require("arikabz.send-to-repl")

require('arikabz.send-to-repl').setup({
  clear_on_send_buffer = true,  -- Clear REPL when sending entire buffer
  method = "direct",  -- Use "clipboard" if direct method doesn't work
  auto_send_on_save = false,  -- Optionally auto-send buffer on save
})
