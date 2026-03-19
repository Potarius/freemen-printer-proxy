# Troubleshooting

Common issues and solutions for Freemen Printer Proxy.

## Quick Diagnostics

### Command-Line Diagnostics

Run the built-in diagnostic tool:

```bash
./scripts/doctor.sh
```

This checks:
- Docker status
- Container health
- Port availability
- Configuration files
- Network connectivity
- Service health

### Interactive Admin Menu

For interactive troubleshooting:

```bash
./deploy-menu.sh
# Then select 'd' for diagnostics or '8' for status
```

### Dashboard Admin Tab

Open the web dashboard and go to the **Admin** tab to see:
- Current version
- Uptime and memory usage
- Recent logs
- System information

---

## Container Issues

### Container Won't Start

**Symptoms**: `docker compose up -d` completes but container immediately exits.

**Solution**:
```bash
# Check logs for errors
docker compose logs

# Common causes:
# 1. Missing .env file
cp .env.example .env
nano .env  # Set API_KEY

# 2. Port already in use
sudo lsof -i :6500
# Change PORT in .env if needed

# 3. Permission issues
sudo chown -R $USER:$USER data/ logs/
```

### Container Keeps Restarting

**Symptoms**: Container status shows "Restarting" repeatedly.

**Solution**:
```bash
# View crash logs
docker compose logs --tail=50

# Check for startup errors
docker logs freemen-printer-proxy 2>&1 | head -50

# Common fixes:
# - Ensure Node.js can read all files
# - Check .env file syntax
# - Verify no syntax errors in config files
```

### "API_KEY must be set" Error

**Symptoms**: Container fails with environment variable error.

**Solution**:
```bash
# Ensure .env file exists and has API_KEY
cat .env | grep API_KEY

# If missing, create from template
cp .env.example .env

# Generate a key
echo "API_KEY=$(openssl rand -hex 32)" >> .env
```

---

## Network Issues

### Port 6500 Inaccessible

**Symptoms**: Can't access `http://localhost:6500` or from other devices.

**Solutions**:

1. **Check container is running**:
   ```bash
   docker compose ps
   ```

2. **Check port is exposed**:
   ```bash
   docker port freemen-printer-proxy
   # Should show: 6500/tcp -> 0.0.0.0:6500
   ```

3. **Check firewall**:
   ```bash
   # Ubuntu/Debian
   sudo ufw status
   sudo ufw allow 6500/tcp
   
   # Fedora/RHEL
   sudo firewall-cmd --list-ports
   sudo firewall-cmd --add-port=6500/tcp --permanent
   sudo firewall-cmd --reload
   ```

4. **Check if something else uses the port**:
   ```bash
   sudo lsof -i :6500
   sudo netstat -tulpn | grep 6500
   ```

### Can't Access from Other Devices

**Symptoms**: Works on `localhost` but not from other computers.

**Solutions**:

1. **Use correct IP** (not localhost):
   ```bash
   hostname -I  # Get your server's IP
   # Access via: http://YOUR_IP:6500
   ```

2. **Check binding**:
   The server binds to `0.0.0.0` by default, which should allow external access.

3. **Network/Firewall**:
   - Ensure devices are on same network
   - Check router firewall
   - Check host firewall (see above)

---

## Printer Issues

### Printer Not Found During Scan

**Symptoms**: Quick/Full scan returns no printers.

**Solutions**:

1. **Verify printer is on and connected**:
   - Print a network config page from the printer itself
   - Check printer has valid IP address

2. **Check network connectivity**:
   ```bash
   # From the host (not container)
   ping YOUR_PRINTER_IP
   
   # Test port 9100
   nc -zv YOUR_PRINTER_IP 9100
   ```

3. **Scanner subnet issues** (Docker):
   ```bash
   # Edit .env and set explicit subnet
   SCAN_SUBNET=192.168.1
   
   # Restart container
   docker compose restart
   ```

4. **Try manual configuration**:
   - In dashboard, go to Configuration
   - Enter printer IP manually
   - Click "Test" then "Configure"

### Printer Connection Failed

**Symptoms**: Printer found but can't connect.

**Solutions**:

1. **Wrong port**:
   - JetDirect uses port 9100 (default)
   - IPP uses port 631
   - Try both in manual configuration

2. **Printer busy**:
   - Another job may be printing
   - Power cycle the printer
   - Wait and retry

3. **Network issues**:
   - Printer and proxy must be on same subnet
   - Check for VLAN separation
   - Try pinging printer from Docker host

### Print Job Fails

**Symptoms**: "Configure" works but actual prints fail.

**Solutions**:

1. **Check printer status**:
   - Paper loaded?
   - No jams?
   - Online status?

2. **Test with simple print**:
   ```bash
   # Dashboard > Actions > Test Print
   ```

3. **Check logs for errors**:
   ```bash
   docker compose logs -f | grep -i error
   ```

4. **Verify label size**:
   - Ensure label size in request matches loaded media
   - Brother QL printers are sensitive to size mismatches

---

## Configuration Issues

### Configuration Not Saved

**Symptoms**: Settings reset after restart.

**Solutions**:

1. **Check data volume**:
   ```bash
   ls -la data/
   # Should see printer-config.json
   ```

2. **Check permissions**:
   ```bash
   # Ensure writable
   touch data/test && rm data/test
   
   # Fix permissions if needed
   sudo chown -R 1000:1000 data/
   ```

3. **Check Docker volume mount**:
   ```bash
   docker inspect freemen-printer-proxy | grep -A5 Mounts
   # Should show ./data:/app/data
   ```

### API Key Not Working

**Symptoms**: Dashboard shows "API key invalid" or 403 errors.

**Solutions**:

1. **Check .env file**:
   ```bash
   cat .env | grep API_KEY
   ```

2. **Restart after changes**:
   ```bash
   docker compose restart
   ```

3. **Clear browser storage**:
   - Dashboard stores API key in localStorage
   - Clear it and re-enter the key

4. **Check for whitespace**:
   ```bash
   # Ensure no trailing spaces in .env
   sed -i 's/[[:space:]]*$//' .env
   ```

---

## Raspberry Pi Specific

### Slow Performance

**Solutions**:
1. Use Raspberry Pi 4 (Pi 3 is slower)
2. Use 64-bit OS
3. Ensure adequate cooling
4. Use quality SD card (A2 rated)

### Memory Issues

**Symptoms**: Container killed or system freezes.

**Solutions**:
```bash
# Check memory
free -h

# Add swap if needed
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Set CONF_SWAPSIZE=1024
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### SD Card Wear

**Solutions**:
- Use log rotation (already configured in Docker)
- Consider mounting logs to tmpfs
- Use quality SD card

---

## Docker Compose vs docker-compose

If you see command not found errors:

```bash
# New Docker (plugin)
docker compose version

# Old Docker (standalone)
docker-compose version

# Install plugin if missing
sudo apt-get install docker-compose-plugin
```

The scripts auto-detect which version you have.

---

## Getting Help

### Collect Debug Information

```bash
# Run full diagnostics
./scripts/doctor.sh > diagnostics.txt

# Get container logs
docker compose logs > container-logs.txt

# Get system info
uname -a >> diagnostics.txt
docker --version >> diagnostics.txt
```

### Log Locations

- **Container logs**: `docker compose logs`
- **Application logs**: `logs/` directory (if mounted)
- **System logs**: `journalctl -u docker`

### Report Issues

When reporting issues, include:
1. Output of `./scripts/doctor.sh`
2. Relevant container logs
3. Steps to reproduce
4. Your environment (OS, Pi model, etc.)

File issues at: https://github.com/freemen-solutions/freemen-printer-proxy/issues
