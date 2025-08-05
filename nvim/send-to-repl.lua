local M = {}

-- Configuration
M.config = {
  server_url = "http://localhost:3000",
  endpoint = "/send",
  clear_on_send_buffer = true,  -- Clear REPL before sending buffer
  method = "direct"  -- "direct" or "clipboard"
}

-- Function to send code to the browser REPL
function M.send_to_repl(code, clear_first)
  -- Default clear_first to false unless explicitly set
  if clear_first == nil then
    clear_first = false
  end

  local data = {
    code = code,
    clearFirst = clear_first,
    method = M.config.method
  }

  local curl_command = string.format(
    'curl -s -X POST %s%s -H "Content-Type: application/json" -d %s',
    M.config.server_url,
    M.config.endpoint,
    vim.fn.shellescape(vim.fn.json_encode(data))
  )

  local result = vim.fn.system(curl_command)
  local success = vim.v.shell_error == 0

  if success then
    vim.notify("Code sent to REPL", vim.log.levels.INFO)
  else
    vim.notify("Failed to send to REPL: " .. result, vim.log.levels.ERROR)
  end

  return success
end

-- Send current line (never clears)
function M.send_current_line()
  local line = vim.api.nvim_get_current_line()
  M.send_to_repl(line, false)
end

-- Send current selection (never clears)
function M.send_selection()
  -- Get visual selection
  local start_pos = vim.fn.getpos("'<")
  local end_pos = vim.fn.getpos("'>")
  local lines = vim.api.nvim_buf_get_lines(
    0,
    start_pos[2] - 1,
    end_pos[2],
    false
  )

  local code = table.concat(lines, "\n")
  M.send_to_repl(code, false)
end

-- Send entire buffer (clears by default based on config)
function M.send_buffer()
  local lines = vim.api.nvim_buf_get_lines(0, 0, -1, false)
  local code = table.concat(lines, "\n")
  M.send_to_repl(code, M.config.clear_on_send_buffer)
end

-- Send paragraph (code block between empty lines)
function M.send_paragraph()
  local current_line = vim.fn.line('.')
  local total_lines = vim.fn.line('$')

  -- Find start of paragraph
  local start_line = current_line
  while start_line > 1 and vim.fn.getline(start_line - 1) ~= '' do
    start_line = start_line - 1
  end

  -- Find end of paragraph
  local end_line = current_line
  while end_line < total_lines and vim.fn.getline(end_line + 1) ~= '' do
    end_line = end_line + 1
  end

  local lines = vim.api.nvim_buf_get_lines(0, start_line - 1, end_line, false)
  local code = table.concat(lines, "\n")
  M.send_to_repl(code, false)
end

-- Setup keybindings
function M.setup(opts)
  if opts then
    M.config = vim.tbl_extend("force", M.config, opts)
  end

  -- Create commands
  vim.api.nvim_create_user_command('ReplSendLine', M.send_current_line, {})
  vim.api.nvim_create_user_command('ReplSendSelection', M.send_selection, { range = true })
  vim.api.nvim_create_user_command('ReplSendBuffer', M.send_buffer, {})
  vim.api.nvim_create_user_command('ReplSendParagraph', M.send_paragraph, {})

  -- Set up keybindings (adjust to your preference)
  vim.keymap.set('n', '<leader>rl', M.send_current_line, { desc = 'Send current line to REPL' })
  vim.keymap.set('v', '<leader>rs', M.send_selection, { desc = 'Send selection to REPL' })
  vim.keymap.set('n', '<leader>rb', M.send_buffer, { desc = 'Send buffer to REPL (clear first)' })
  vim.keymap.set('n', '<leader>rp', M.send_paragraph, { desc = 'Send paragraph to REPL' })
  vim.keymap.set('n', '<leader>rr', M.send_current_line, { desc = 'Send current line to REPL' })

  -- Optional: Auto-send on save
  if M.config.auto_send_on_save then
    vim.api.nvim_create_autocmd("BufWritePost", {
      pattern = "*.js,*.ts,*.strudel",  -- Adjust patterns as needed
      callback = function()
        M.send_buffer()
      end,
    })
  end
end

return M
