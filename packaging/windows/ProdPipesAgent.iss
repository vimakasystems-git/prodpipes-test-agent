#define MyAppName "ProdPipes Test Agent"
#define MyAppVersion "0.2.0"
#define MyAppPublisher "Vimaka Sistemas Inteligentes"
#define MyAppURL "https://prodpipes.com"
#define MyAppExeName "prodpipes-agent.exe"
[Setup]
AppId={{5A82622B-DA19-49D4-9302-C6761A29F550}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
DefaultDirName={autopf}\ProdPipes Test Agent
DefaultGroupName=ProdPipes Test Agent
OutputDir=..\..\dist
OutputBaseFilename=ProdPipes-Test-Agent-Setup-{#MyAppVersion}-win-x64
Compression=lzma2
SolidCompression=yes
PrivilegesRequired=admin
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
LicenseFile=..\..\docs\EULA.md
SetupLogging=yes
[Files]
Source: "..\..\dist\prodpipes-agent.exe"; DestDir: "{app}"; Flags: ignoreversion
[Icons]
Name: "{group}\ProdPipes Test Agent"; Filename: "{app}\{#MyAppExeName}"
[Run]
Filename: "{app}\{#MyAppExeName}"; Parameters: "--install-service"; Flags: runhidden waituntilterminated
Filename: "{app}\{#MyAppExeName}"; Parameters: "--start-service"; Flags: runhidden waituntilterminated
[UninstallRun]
Filename: "{app}\{#MyAppExeName}"; Parameters: "--uninstall-service"; Flags: runhidden waituntilterminated
[Code]
var TokenPage: TInputQueryWizardPage;
procedure InitializeWizard;
begin
 TokenPage := CreateInputQueryPage(wpSelectDir,'Conectar ao ProdPipes','Credencial do agente','Informe o token gerado no ProdPipes. A senha do Windows nunca é solicitada pelo aplicativo.');
 TokenPage.Add('Token do agente:', True);
end;
procedure CurStepChanged(CurStep: TSetupStep);
var Config: String;
begin
 if CurStep = ssPostInstall then begin
  Config := 'PRODPIPES_API_URL=https://prodpipes.com' + #13#10 + 'PRODPIPES_AGENT_TOKEN=' + TokenPage.Values[0] + #13#10;
  SaveStringToFile(ExpandConstant('{app}\.env'), Config, False);
 end;
end;
