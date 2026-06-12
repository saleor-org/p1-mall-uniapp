# Cursor MCP launcher for weixin-devtools-mcp (must run on Windows Node).
# WeChat DevTools CLI cannot spawn from UNC cwd; force C:\ before npx.
Set-Location C:\
$env:WEIXIN_DEVTOOLS_IDE_PORT = if ($env:WEIXIN_DEVTOOLS_IDE_PORT) { $env:WEIXIN_DEVTOOLS_IDE_PORT } else { "43263" }
npx -y weixin-devtools-mcp --tools-profile=full
