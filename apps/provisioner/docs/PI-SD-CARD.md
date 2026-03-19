# Raspberry Pi SD Card Preparation

## Overview

The Freemen Provisioner includes a **true SD card preparation flow** that can write configuration files directly to your Raspberry Pi's SD card boot partition. This eliminates manual file copying and ensures a proper headless setup.

---

## Prerequisites

### Hardware
- Raspberry Pi 4 or 5 (recommended)
- microSD card (16GB+ recommended)
- SD card reader connected to your computer

### Software
- Raspberry Pi OS Lite (64-bit) already flashed to the SD card
- For password hashing: OpenSSL or Python installed on your computer

---

## The SD Card Flow

### Step 1: Flash Raspberry Pi OS

Use the official **Raspberry Pi Imager** to flash Raspberry Pi OS Lite (64-bit):

1. Download from https://www.raspberrypi.com/software/
2. Select **Raspberry Pi OS Lite (64-bit)** (under "Raspberry Pi OS (other)")
3. Select your SD card
4. Click **Write**
5. **Skip the Imager's OS customization** - we'll handle this

### Step 2: Configure in Freemen Provisioner

1. Open Freemen Provisioner
2. Navigate to **Raspberry Pi Setup**
3. Configure:
   - **Hostname** (e.g., `freemen-pi`)
   - **Username** (e.g., `freemen`)
   - **Password** (minimum 8 characters)
   - **WiFi** (optional)

### Step 3: Write to SD Card

Two options are available:

#### Option A: Automatic Write (Recommended)

1. Insert the flashed SD card into your computer
2. Click **"Write to SD Card"** button
3. Select the boot partition (usually labeled "boot" or "bootfs")
4. Confirm the write operation
5. Wait for completion
6. Safely eject the SD card

#### Option B: Manual Download

1. Click **"Download All Files"**
2. Open the SD card's boot partition
3. Copy all downloaded files to the root of the boot partition
4. Safely eject the SD card

---

## Files Written to SD Card

| File | Purpose |
|------|---------|
| `ssh` | Empty file that enables SSH on first boot |
| `userconf.txt` | Sets username and SHA-512 hashed password |
| `wpa_supplicant.conf` | WiFi configuration (if WiFi enabled) |
| `firstrun.sh` | First boot setup script |

### userconf.txt Format

```
username:$6$salt$hashedpassword
```

The password is hashed using SHA-512 (`$6$`) which is the standard for modern Linux systems.

### wpa_supplicant.conf Format

```
country=US
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1

network={
    ssid="YourNetworkName"
    psk="YourPassword"
    key_mgmt=WPA-PSK
}
```

---

## First Boot

After inserting the SD card into your Pi:

1. **Connect power** to boot the Pi
2. **Wait 2-5 minutes** for first boot setup
3. **Find your Pi** on the network:
   ```bash
   ping hostname.local
   ```
4. **Connect via SSH**:
   ```bash
   ssh username@hostname.local
   ```

### What Happens on First Boot

The `firstrun.sh` script automatically:
- Sets the hostname
- Configures timezone
- Updates system packages
- Installs Docker and Docker Compose
- Creates the Freemen service directory
- Reboots to apply changes

---

## Troubleshooting

### Drive Not Detected

- Ensure the SD card is properly inserted
- Try a different USB port or card reader
- Click "Refresh" to re-scan for drives
- On Windows, the boot partition should appear as a drive letter

### Password Hashing Failed

The app tries multiple methods to hash passwords:
1. OpenSSL (if installed)
2. Python's crypt module

**Solution**: Install OpenSSL for Windows or ensure Python is in your PATH.

### Can't Find Pi on Network

- Verify WiFi credentials are correct
- Try connecting via Ethernet first
- Wait longer (up to 5 minutes for first boot)
- Check your router's connected devices list

### SSH Connection Refused

- Verify the `ssh` file exists in boot partition
- Wait for first boot to complete
- Check that the Pi has network connectivity

---

## Security Notes

- Passwords are hashed using SHA-512 before being written to the SD card
- The plaintext password is never stored on the SD card
- WiFi passwords in `wpa_supplicant.conf` are stored in plaintext (this is a Raspberry Pi OS limitation)

---

## Technical Details

### Drive Detection (Windows)

Uses PowerShell WMI queries to detect removable drives:
```powershell
Get-WmiObject Win32_LogicalDisk | Where-Object {$_.DriveType -eq 2}
```

### Boot Partition Detection

The app identifies Pi boot partitions by:
- Volume label containing "boot"
- Presence of `bootcode.bin`, `start.elf`, `config.txt`
- Small partition size (< 1GB)

### Password Hashing

Uses OpenSSL or Python to generate SHA-512 hashes:
```bash
echo 'password' | openssl passwd -6 -stdin
```

---

## Integration with Cloudflare Provisioning

If you've completed Cloudflare provisioning before SD card preparation:
- The tunnel token can be automatically included in `firstrun.sh`
- The Pi will be configured to connect to Cloudflare on first boot

---

## Limitations

| Limitation | Notes |
|------------|-------|
| Windows only | Drive detection currently Windows-specific |
| Requires pre-flashed SD | Does not flash the OS image |
| No disk formatting | Cannot format or partition the SD card |
| Boot partition only | Writes to boot partition, not rootfs |

---

## Support

- GitHub Issues: https://github.com/Potarius/freemen-printer-proxy/issues
- Raspberry Pi Docs: https://www.raspberrypi.com/documentation/
