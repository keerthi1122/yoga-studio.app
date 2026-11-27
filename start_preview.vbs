' Yoga Studio Admin Dashboard - Silent 1-Click Production Preview Launcher
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

batFile = scriptDir & "\start_preview.bat"
sysRoot = WshShell.ExpandEnvironmentStrings("%SystemRoot%")
cmdExe = sysRoot & "\System32\cmd.exe"

If Not fso.FileExists(batFile) Then
    MsgBox "Cannot find start_preview.bat in: " & scriptDir, vbCritical, "Yoga Studio Launcher Error"
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

' 1. Check if production server is already running on port 4173
If checkPortScript <> "" Then
    If WshShell.Run("node """ & checkPortScript & """ 4173", 0, True) = 0 Then
        WshShell.Run "http://localhost:4173/", 1, False
        WScript.Quit 0
    End If
End If

' 2. Start preview server in background with /silent
WshShell.Run """" & cmdExe & """ /c """"" & batFile & """ /silent""", 0, False

' 3. Poll until port 4173 is ready (up to 30 seconds for build + boot)
started = False
If checkPortScript <> "" Then
    For i = 1 To 100
        WScript.Sleep 300
        If WshShell.Run("node """ & checkPortScript & """ 4173", 0, True) = 0 Then
            started = True
            Exit For
        End If
    Next
Else
    WScript.Sleep 2500
    started = True
End If

If started Then
    WshShell.Run "http://localhost:4173/", 1, False
Else
    MsgBox "Production Preview server did not start within 30 seconds." & vbCrLf & _
           "Please run start_preview.bat to check the build output.", _
           vbExclamation, "Yoga Studio Preview Launcher"
End If
