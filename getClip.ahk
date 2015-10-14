#NoEnv  ; Recommended for performance and compatibility with future AutoHotkey releases.
; #Warn  ; Enable warnings to assist with detecting common errors.
SendMode Input  ; Recommended for new scripts due to its superior speed and reliability.
SetWorkingDir %A_ScriptDir%  ; Ensures a consistent starting directory.

^j::
	oldClip := Clipboard
	clipboard =
	Send, ^c
	ClipWait
	text := Clipboard
	clipboard = oldClip
	Run, pythonw c:/Work/david/david.py %text%
Return
