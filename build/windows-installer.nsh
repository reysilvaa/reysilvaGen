; ============================================
; 🪟 WINDOWS INSTALLER SCRIPT
; ============================================
; Custom NSIS installer configuration for Windows
; Ensures proper Windows integration and searchability
; Platform: Windows 10/11
; ============================================

!macro customInstall
  ; ============================================
  ; Windows Registry Integration
  ; ============================================
  
  ; Register application for Windows Search
  WriteRegStr SHCTX "Software\Classes\Applications\${APP_EXECUTABLE_FILENAME}" "FriendlyAppName" "${PRODUCT_NAME}"
  WriteRegStr SHCTX "Software\Classes\Applications\${APP_EXECUTABLE_FILENAME}\shell\open\command" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" "%1"'
  
  ; Add to Windows App Paths (enables running from Run dialog)
  WriteRegStr SHCTX "Software\Microsoft\Windows\CurrentVersion\App Paths\${APP_EXECUTABLE_FILENAME}" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
  WriteRegStr SHCTX "Software\Microsoft\Windows\CurrentVersion\App Paths\${APP_EXECUTABLE_FILENAME}" "Path" "$INSTDIR"
  
  ; Add shortcut to "reysilvaGen" command
  WriteRegStr SHCTX "Software\Microsoft\Windows\CurrentVersion\App Paths\reysilvaGen.exe" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
  WriteRegStr SHCTX "Software\Microsoft\Windows\CurrentVersion\App Paths\reysilvaGen.exe" "Path" "$INSTDIR"
  
  ; ============================================
  ; Programs & Features Registration
  ; ============================================
  
  WriteRegStr SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "DisplayName" "${PRODUCT_NAME}"
  WriteRegStr SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "DisplayIcon" "$INSTDIR\${APP_EXECUTABLE_FILENAME},0"
  WriteRegStr SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "UninstallString" '"$INSTDIR\Uninstall ${PRODUCT_NAME}.exe"'
  WriteRegStr SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "Publisher" "${COMPANY_NAME}"
  WriteRegStr SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "DisplayVersion" "${VERSION}"
  WriteRegStr SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "InstallLocation" "$INSTDIR"
  WriteRegDWORD SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "NoModify" 1
  WriteRegDWORD SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "NoRepair" 1
  
  ; ============================================
  ; Start Menu Integration
  ; ============================================
  
  ; Refresh Start Menu
  System::Call 'shell32.dll::SHChangeNotify(i, i, i, i) v (0x08000000, 0, 0, 0)'
!macroend

!macro customUnInstall
  ; ============================================
  ; Cleanup Windows Registry
  ; ============================================
  
  DeleteRegKey SHCTX "Software\Classes\Applications\${APP_EXECUTABLE_FILENAME}"
  DeleteRegKey SHCTX "Software\Microsoft\Windows\CurrentVersion\App Paths\${APP_EXECUTABLE_FILENAME}"
  DeleteRegKey SHCTX "Software\Microsoft\Windows\CurrentVersion\App Paths\reysilvaGen.exe"
  DeleteRegKey SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}"
  
  ; Refresh Start Menu
  System::Call 'shell32.dll::SHChangeNotify(i, i, i, i) v (0x08000000, 0, 0, 0)'
!macroend

