import { chromium } from 'playwright';
import { serve } from 'bun';

let browser;
let page;

// Initialize browser
async function initBrowser() {
  browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox']
  });

  const context = await browser.newContext({
    permissions: ['clipboard-read', 'clipboard-write']
  });
  page = await context.newPage();

  // Navigate to strudelcc REPL
  await page.goto('https://strudel.cc/', { waitUntil: 'networkidle' });

  // Wait for the editor to load
  await page.waitForSelector('.cm-content', { timeout: 10000 });

  // Wait a bit more for JavaScript to initialize
  await page.waitForTimeout(2000);

  // Discover the CodeMirror instance
  const cmInfo = await page.evaluate(() => {
    // Look for CodeMirror in various places
    const possiblePaths = [
      'window.strudelMirror',
      'window.cm',
      'window.editor',
      'window.codemirror',
      'window.CodeMirror',
      'window._editor',
      'window.strudel?.editor',
      'window.strudel?.codemirror',
    ];

    for (const path of possiblePaths) {
      try {
        const obj = eval(path);
        if (obj && (obj.state || obj.getValue || obj.dispatch)) {
          return { found: true, path, hasMethods: true };
        }
      } catch (e) {}
    }

    // Look for CodeMirror instances attached to DOM elements
    const cmContent = document.querySelector('.cm-content');
    if (cmContent) {
      // Check if there's a CodeMirror instance in the element or its parent
      let el = cmContent;
      while (el) {
        // Check various property names
        const props = ['CodeMirror', 'codemirror', 'cm', '_cm', 'editor'];
        for (const prop of props) {
          if (el[prop]) {
            // Store it globally for future use
            window._cmInstance = el[prop];
            return { found: true, path: 'DOM element property: ' + prop, stored: true };
          }
        }
        el = el.parentElement;
      }
    }

    // Look in window properties for anything that looks like CodeMirror
    for (const key of Object.keys(window)) {
      const val = window[key];
      if (val && typeof val === 'object') {
        // Check if it has CodeMirror-like methods
        if ((val.state && val.dispatch) ||
            (val.getValue && val.setValue) ||
            (val.doc && val.cm)) {
          window._cmInstance = val;
          return { found: true, path: 'window.' + key, stored: true };
        }
      }
    }

    return { found: false };
  });

  console.log('CodeMirror search result:', cmInfo);

  console.log('Browser initialized and navigated to strudel.cc');
}

// Main function to send code to the REPL
async function sendToStrudel(code, clearFirst = true) {
  if (!page) {
    throw new Error('Browser not initialized');
  }

  try {
    // First, let's try to find the editor view through the DOM
    const editorInfo = await page.evaluate(() => {
      const cmContent = document.querySelector('.cm-content');
      if (!cmContent) return { found: false };

      // Try to find the editor view
      let view = null;

      // Method 1: Look for view in element properties
      let el = cmContent;
      while (el && !view) {
        if (el._view || el.view || el.cmView) {
          view = el._view || el.view || el.cmView;
          break;
        }
        el = el.parentElement;
      }

      // Method 2: Look for editor in React props
      if (!view) {
        const reactKey = Object.keys(cmContent).find(key => key.startsWith('__react'));
        if (reactKey) {
          const fiber = cmContent[reactKey];
          let node = fiber;
          while (node) {
            if (node.memoizedProps?.view || node.memoizedProps?.editor) {
              view = node.memoizedProps.view || node.memoizedProps.editor;
              break;
            }
            node = node.return;
          }
        }
      }

      if (view) {
        window._editorView = view;
        return {
          found: true,
          hasDispatch: !!view.dispatch,
          hasState: !!view.state,
          docLength: view.state?.doc?.length || 0
        };
      }

      return { found: false };
    });

    console.log('Editor info:', editorInfo);

    if (clearFirst) {
      console.log('Clearing editor...');

      if (editorInfo.found && editorInfo.hasDispatch) {
        // Try to clear using the view's dispatch
        const cleared = await page.evaluate(() => {
          try {
            const view = window._editorView;
            if (view && view.dispatch && view.state) {
              const len = view.state.doc.length;
              view.dispatch({
                changes: { from: 0, to: len, insert: '' }
              });
              return { success: true, method: 'view.dispatch' };
            }
          } catch (e) {
            return { success: false, error: e.message };
          }
          return { success: false };
        });

        console.log('Clear attempt:', cleared);
      }

      // Fallback: keyboard clearing
      await page.click('.cm-content', { force: true });
      await page.waitForTimeout(100);

      const selectKey = process.platform === 'darwin' ? 'Meta+a' : 'Control+a';
      await page.keyboard.press(selectKey);
      await page.waitForTimeout(100);
      await page.keyboard.press('Delete');
      await page.waitForTimeout(100);
    }

    // Try to insert code using the view
    if (editorInfo.found && editorInfo.hasDispatch) {
      const insertResult = await page.evaluate((code) => {
        try {
          const view = window._editorView;
          if (view && view.dispatch) {
            const len = view.state.doc.length;
            view.dispatch({
              changes: { from: 0, to: len, insert: code }
            });
            return { success: true, method: 'view.dispatch' };
          }
        } catch (e) {
          return { success: false, error: e.message };
        }
        return { success: false };
      }, code);

      console.log('Insert result:', insertResult);

      if (insertResult.success) {
        // Execute the code
        await page.waitForTimeout(100);
        const execKey = process.platform === 'darwin' ? 'Meta+Enter' : 'Control+Enter';
        await page.keyboard.press(execKey);
        return { success: true, method: 'view.dispatch' };
      }
    }

    // Fallback: clipboard method
    console.log('Trying clipboard method...');

    // Copy code to clipboard
    await page.evaluate((text) => {
      navigator.clipboard.writeText(text);
    }, code);

    await page.waitForTimeout(100);

    // Clear if needed
    if (clearFirst) {
      await page.keyboard.press(process.platform === 'darwin' ? 'Meta+a' : 'Control+a');
      await page.waitForTimeout(50);
    }

    // Paste
    const pasteKey = process.platform === 'darwin' ? 'Meta+v' : 'Control+v';
    await page.keyboard.press(pasteKey);

    await page.waitForTimeout(100);

    // Execute
    const execKey = process.platform === 'darwin' ? 'Meta+Enter' : 'Control+Enter';
    await page.keyboard.press(execKey);

    return { success: true, method: 'clipboard' };

  } catch (error) {
    console.error('SendToStrudel error:', error);
    return { success: false, error: error.message };
  }
}

// Start the server
const server = serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // Handle CORS
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    if (url.pathname === '/send' && req.method === 'POST') {
      try {
        const { code, clearFirst = true } = await req.json();
        const result = await sendToStrudel(code, clearFirst);
        return Response.json(result, { headers });
      } catch (error) {
        return Response.json({
          success: false,
          error: error.message
        }, {
          status: 500,
          headers
        });
      }
    }

    if (url.pathname === '/debug' && req.method === 'GET') {
      try {
        const debugInfo = await page.evaluate(() => {
          const info = {
            hasStrudelMirror: !!window.strudelMirror,
            has_cmInstance: !!window._cmInstance,
            has_editorView: !!window._editorView,
            globalKeys: Object.keys(window).filter(k =>
              k.includes('mirror') ||
              k.includes('Mirror') ||
              k.includes('editor') ||
              k.includes('Editor') ||
              k.includes('cm') ||
              k.includes('CM') ||
              k.includes('strudel')
            ),
            cmContentFound: !!document.querySelector('.cm-content'),
          };

          // Check for CodeMirror 6 view
          const cmContent = document.querySelector('.cm-content');
          if (cmContent) {
            const keys = Object.keys(cmContent);
            info.cmContentKeys = keys;

            // Look up the parent chain
            let parent = cmContent.parentElement;
            let level = 0;
            while (parent && level < 5) {
              const parentKeys = Object.keys(parent).filter(k => !k.startsWith('__react'));
              if (parentKeys.length > 0) {
                info[`parent${level}Keys`] = parentKeys;
              }
              parent = parent.parentElement;
              level++;
            }
          }

          return info;
        });

        return Response.json(debugInfo, { headers });
      } catch (error) {
        return Response.json({
          success: false,
          error: error.message
        }, {
          status: 500,
          headers
        });
      }
    }

    if (url.pathname === '/health') {
      return Response.json({
        status: 'ok',
        browserConnected: !!page
      }, { headers });
    }

    return new Response('Not Found', { status: 404, headers });
  }
});

// Initialize browser on startup
await initBrowser();

console.log(`Server running at http://localhost:${server.port}`);
console.log('Endpoints:');
console.log('  POST /send - Send code to REPL');
console.log('  GET /debug - Get debug information');
console.log('  GET /health - Check server status');

// Cleanup on exit
process.on('SIGINT', async () => {
  console.log('\nClosing browser...');
  if (browser) await browser.close();
  process.exit(0);
});

