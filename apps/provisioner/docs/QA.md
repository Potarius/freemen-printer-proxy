# Freemen Provisioner - QA Checklist

## Version: 1.0.0
## Date: _______________
## Tester: _______________

---

## Pre-Test Setup

- [ ] Clean Windows 10/11 installation OR clean user profile
- [ ] No previous version installed
- [ ] Internet connection available
- [ ] Cloudflare account with API token ready (for full flow testing)

---

## 1. Installation Testing

### 1.1 NSIS Installer
- [ ] Double-click `Freemen Provisioner_x.x.x_x64-setup.exe`
- [ ] Installer launches without errors
- [ ] Installation completes successfully
- [ ] Start menu shortcut created
- [ ] Application launches from Start menu
- [ ] Application launches from desktop shortcut (if created)

### 1.2 MSI Installer (Optional)
- [ ] Run MSI installer
- [ ] Installation completes
- [ ] Application accessible

### 1.3 Portable Executable
- [ ] Run standalone `.exe` directly
- [ ] Application launches without installation

---

## 2. Application Launch

### 2.1 First Launch
- [ ] Application window opens
- [ ] Custom titlebar displays correctly
- [ ] Window is centered on screen
- [ ] Minimum size constraints work (900x600)
- [ ] Resizing works smoothly
- [ ] Maximize/minimize buttons work
- [ ] Close button works

### 2.2 UI Rendering
- [ ] Sidebar renders correctly
- [ ] Navigation items visible
- [ ] Home page loads
- [ ] No visual glitches or flickering
- [ ] Fonts render correctly
- [ ] Icons display properly

---

## 3. Navigation Testing

### 3.1 Sidebar Navigation
| Route | Loads | No Errors |
|-------|-------|-----------|
| Home (`/`) | [ ] | [ ] |
| Provision (`/wizard`) | [ ] | [ ] |
| Pi Setup (`/pi-setup`) | [ ] | [ ] |
| Ubuntu Deploy (`/ubuntu-deploy`) | [ ] | [ ] |
| Diagnostics (`/diagnostics`) | [ ] | [ ] |
| Settings (`/settings`) | [ ] | [ ] |

### 3.2 Navigation State
- [ ] Active route highlighted in sidebar
- [ ] Back navigation works (where applicable)
- [ ] Browser back/forward buttons work (if applicable)

---

## 4. Core Flows

### 4.1 Provisioning Wizard (Critical Path)

#### Step 1: API Token
- [ ] Token input field works
- [ ] Paste functionality works
- [ ] Token validation triggers on submit
- [ ] Error message displays for invalid token
- [ ] Success proceeds to next step

#### Step 2: Zone Selection
- [ ] Zones load from API
- [ ] Loading state displays
- [ ] Zones list renders
- [ ] Zone selection works
- [ ] Proceeds to next step

#### Step 3: Hostname Configuration
- [ ] Hostname input works
- [ ] Validation messages display
- [ ] Subdomain preview updates

#### Step 4: Tunnel Creation
- [ ] Tunnel creation initiates
- [ ] Progress indicator shows
- [ ] Success state displays
- [ ] Token is generated/displayed

#### Step 5: Summary
- [ ] All configuration displayed
- [ ] Copy buttons work
- [ ] Download functionality works (if applicable)

### 4.2 Raspberry Pi Setup Flow
- [ ] Intro step renders
- [ ] Flash instructions display
- [ ] Config step accepts input
- [ ] Network config works
- [ ] Files generation works
- [ ] Completion screen displays

### 4.3 Ubuntu Deploy Flow
- [ ] Mode selection works (Fresh/Update/Reprovision)
- [ ] Config step accepts input
- [ ] Commands generate correctly
- [ ] Copy commands works
- [ ] Script download works
- [ ] Execute step tracking works
- [ ] Completion screen displays

---

## 5. Diagnostics Page

### 5.1 System Checks
- [ ] Page loads without errors
- [ ] "Run Diagnostics" button works
- [ ] All checks execute
- [ ] Results display correctly
- [ ] Status icons correct (success/warning/error)
- [ ] Timing information displays

### 5.2 System Information
- [ ] Platform detected correctly
- [ ] Architecture detected
- [ ] Version information correct

### 5.3 Actions
- [ ] Copy Report works
- [ ] Clear Storage works
- [ ] Reload Application works
- [ ] Report Issue link works

---

## 6. Error Handling

### 6.1 Network Errors
- [ ] Disconnect internet, attempt API call
- [ ] Error message displays
- [ ] App doesn't crash
- [ ] Reconnect internet, retry works

### 6.2 Invalid Input
- [ ] Empty required fields show validation
- [ ] Invalid API tokens show error
- [ ] Invalid hostnames show error

### 6.3 Error Boundary
- [ ] Unhandled errors caught
- [ ] Error screen displays
- [ ] Reload button works
- [ ] Copy error works

---

## 7. UI/UX Quality

### 7.1 Visual Quality
- [ ] No layout shifts
- [ ] Animations smooth (60fps)
- [ ] Hover states work
- [ ] Focus states visible
- [ ] Loading states display
- [ ] Success states display

### 7.2 Responsive Behavior
- [ ] Window at minimum size (900x600)
- [ ] Window at 1920x1080
- [ ] Window at 2560x1440
- [ ] Content doesn't overflow
- [ ] Scrolling works where needed

### 7.3 Accessibility
- [ ] Tab navigation works
- [ ] Focus indicators visible
- [ ] Text readable (contrast)
- [ ] Interactive elements clickable

---

## 8. Performance

### 8.1 Startup
- [ ] App starts in < 3 seconds
- [ ] No blank screen > 1 second
- [ ] Sidebar loads immediately

### 8.2 Runtime
- [ ] Navigation instant (< 100ms)
- [ ] No memory leaks (monitor task manager)
- [ ] CPU idle when not in use
- [ ] Smooth scrolling

---

## 9. Uninstallation

### 9.1 Clean Uninstall
- [ ] Uninstall from Windows Settings
- [ ] OR run uninstaller from Start Menu
- [ ] No files left behind
- [ ] Start menu entry removed
- [ ] Desktop shortcut removed (if created)

---

## 10. Edge Cases

### 10.1 Stress Testing
- [ ] Rapid navigation between pages
- [ ] Multiple wizard starts/cancels
- [ ] Long session (1+ hour)

### 10.2 Data Persistence
- [ ] Settings save correctly
- [ ] Settings persist after restart
- [ ] Clear storage resets correctly

---

## Test Results Summary

| Category | Pass | Fail | N/A |
|----------|------|------|-----|
| Installation | | | |
| Launch | | | |
| Navigation | | | |
| Core Flows | | | |
| Diagnostics | | | |
| Error Handling | | | |
| UI/UX | | | |
| Performance | | | |
| Uninstallation | | | |
| Edge Cases | | | |

**Total:** _____ Pass / _____ Fail / _____ N/A

---

## Issues Found

| # | Severity | Description | Steps to Reproduce |
|---|----------|-------------|-------------------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

**Severity Levels:**
- **Critical** - App crash, data loss, security issue
- **High** - Major feature broken, no workaround
- **Medium** - Feature broken with workaround
- **Low** - Minor visual issue, edge case

---

## Sign-off

**QA Status:** [ ] PASS / [ ] FAIL

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________

**Tester Signature:** _______________
**Date:** _______________
