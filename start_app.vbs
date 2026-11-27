' Yoga Studio Admin Dashboard - Silent 1-Click Background Launcher
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
batFile = scriptDir & "\start_app.bat"
sysRoot = WshShell.ExpandEnvironmentStrings("%SystemRoot%")
cmdExe = sysRoot & "\System32\cmd.exe"

If Not fso.FileExists(batFile) Then
    MsgBox "Cannot find start_app.bat in: " & scriptDir, vbCritical, "Yoga Studio Launcher Error"
    WScript.Quit 1
End If

' Locate check_port.mjs
checkPortScript = ""
If fso.FileExists(scriptDir & "\admin_dashboard\check_port.mjs") Then
    checkPortScript = scriptDir & "\admin_dashboard\check_port.mjs"
ElseIf fso.FileExists(scriptDir & "\yoga-studio.app-main\admin_dashboard\check_port.mjs") Then
    checkPortScript = scriptDir & "\yoga-studio.app-main\admin_dashboard\check_port.mjs"
ElseIf fso.FileExists(scriptDir & "\..\admin_dashboard\check_port.mjs") Then
    checkPortScript = scriptDir & "\..\admin_dashboard\check_port.mjs"
End If

' 1. Check if server is already running on port 5173
If checkPortScript <> "" Then
    If WshShell.Run("node """ & checkPortScript & """ 5173", 0, True) = 0 Then
        ' Server already running: open browser exactly once and quit immediately
        WshShell.Run "https://localhost:5173/", 1, False
        WScript.Quit 0
    End If
End If

' 2. Not running: launch start_app.bat in silent mode with hidden window (0)
WshShell.Run """" & cmdExe & """ /c """"" & batFile & """ /silent""", 0, False

' 3. Poll until port 5173 is ready (up to 25 seconds, checking every 300ms)
started = False
If checkPortScript <> "" Then
    For i = 1 To 80
        WScript.Sleep 300
        If WshShell.Run("node """ & checkPortScript & """ 5173", 0, True) = 0 Then
            started = True
            Exit For
        End If
    Next
Else
    WScript.Sleep 2500
    started = True
End If

' 4. Open the web browser exactly once
If started Then
    WshShell.Run "https://localhost:5173/", 1, False
Else
    MsgBox "Yoga Studio dev server did not start within 25 seconds." & vbCrLf & _
           "Please run start_app.bat in a console window to check the compilation logs.", _
           vbExclamation, "Yoga Studio Dev Launcher"
End If
