param(
  [int]$Port = 43263,
  [string]$Project = "D:\flynn\saleor-org\p1-mall-uniapp\dist\dev\mp-weixin"
)

$cli = (Get-ChildItem "C:\Program Files (x86)\Tencent\*\cli.bat" | Select-Object -First 1).FullName
if (-not $cli) { throw "WeChat cli.bat not found" }
if (-not (Test-Path "$Project\app.json")) {
  throw "Project not built: $Project. Run: npm run dev:mp-weixin in WSL"
}

Set-Location C:\
& $cli auto --port $Port --project $Project --trust-project
