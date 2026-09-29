$ErrorActionPreference="Stop"
$required=@("assets/prodpipes-logo.png","assets/vimaka-logo.png","assets/windows/setup-icon.ico")
foreach($f in $required){if(-not(Test-Path $f)){throw "Release branding asset missing: $f"}}
if(-not(Get-Command iscc.exe -ErrorAction SilentlyContinue)){throw "Inno Setup compiler (iscc.exe) is required"}
iscc.exe packaging\windows\ProdPipesAgent.iss
