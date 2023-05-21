# https://docs.microsoft.com/en-us/powershell/scripting/developer/cmdlet/approved-verbs-for-windows-powershell-commands?view=powershell-7

# Aufruf:   .\sonar-scanner.ps1

Set-StrictMode -Version Latest

$versionMinimum = [Version]'7.4.0'
$versionCurrent = $PSVersionTable.PSVersion
if ($versionMinimum -gt $versionCurrent) {
    throw "PowerShell $versionMinimum statt $versionCurrent erforderlich"
}

# Titel setzen
$host.ui.RawUI.WindowTitle = 'sonar-scanner'

#admin1
#$password = 'p'
#C:\Zimmermann\sonar-scanner\bin\sonar-scanner -D'sonar.login=admin' -D"sonar.password=$password"
C:\Zimmermann\sonar-scanner\bin\sonar-scanner -Dsonar.projectKey=film -Dsonar.host.url=http://localhost:9000 -Dsonar.login=sqp_27d4ecba6927598f1234ce98cef8128ec0f033f2