' Yoga Studio Admin Dashboard - Silent 1-Click Stopper
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
batFile = scriptDir & "\stop_app.bat"
sysRoot = WshShell.ExpandEnvironmentStrings("%SystemRoot%")
cmdExe = sysRoot & "\System32\cmd.exe"

If fso.FileExists(batFile) Then
    WshShell.Run """" & cmdExe & """ /c """"" & batFile & """ /silent""", 0, True
End If
