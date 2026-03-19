# Updating Freemen Printer Proxy

Guide for keeping your installation up to date.

## Quick Update

The easiest way to update:

```bash
cd freemen-printer-proxy
./scripts/update.sh
```

Or use the interactive menu:

```bash
./deploy-menu.sh
# Then select option 'u' for update
```

The update script performs a **7-step robust process**:

1. Check prerequisites (Docker, permissions)
2. Check for local changes (prompts if found)
3. Backup configuration (.env and printer config)
4. Pull latest code from Git
5. Stop the running container
6. Rebuild and restart container
7. Verify service health

### Force Mode

Skip confirmation prompts (for automation):

```bash
./scripts/update.sh --force
```

### Checking Version

Before updating, check your current version:

- **Dashboard**: Look at the footer or Admin tab
- **API**: `curl http://localhost:6500/health | jq .version`
- **CLI**: `grep '"version"' package.json`

---

## Interactive Admin Menu

The `deploy-menu.sh` script provides an interactive menu:

```bash
./deploy-menu.sh
```

**Options:**
| Key | Action |
|-----|--------|
| 1 | Full deployment (pull + build + restart) |
| 2 | Quick restart (stop + start) |
| 3-6 | Individual operations (pull/build/stop/start) |
| 7 | View logs |
| 8 | View status |
| 9 | Rebuild + restart (no pull) |
| u | Run update script |
| d | Run diagnostics |
| 0 | Quit |

---

## Manual Update

If you prefer to update manually:

### Step 1: Pull Latest Changes

```bash
cd freemen-printer-proxy
git fetch origin
git pull origin main
```

### Step 2: Backup Configuration

```bash
cp .env .env.backup
```

### Step 3: Check for New Environment Variables

```bash
# Compare your .env with the template
diff .env .env.example
```

Add any new variables to your `.env` if needed.

### Step 4: Rebuild and Restart

```bash
# Stop current container
docker compose down

# Rebuild with no cache
docker compose build --no-cache

# Start new version
docker compose up -d
```

### Step 5: Verify

```bash
# Check status
docker compose ps

# Check logs
docker compose logs -f

# Run diagnostics
./scripts/doctor.sh
```

---

## Checking for Updates

### Check Current Version

```bash
# View local version
cat package.json | grep version

# Or check via API
curl http://localhost:6500/health | jq .version
```

### Check Remote Version

```bash
git fetch origin
git log HEAD..origin/main --oneline
```

If output is empty, you're up to date.

---

## Rollback

If an update causes issues:

### Quick Rollback

```bash
# Stop current version
docker compose down

# Reset to previous commit
git reset --hard HEAD~1

# Restore .env backup if needed
cp .env.backup .env

# Rebuild and restart
docker compose build
docker compose up -d
```

### Rollback to Specific Version

```bash
# List recent commits
git log --oneline -10

# Reset to specific commit
git reset --hard <commit-hash>

# Rebuild
docker compose build
docker compose up -d
```

---

## Update Frequency

Recommendations:
- **Security updates**: Apply as soon as available
- **Feature updates**: Test in development first if possible
- **Major versions**: Read release notes before updating

---

## Configuration Migration

When updating between major versions, configuration changes may be required.

### Automatic Migration

The application handles most config migrations automatically. Your `data/printer-config.json` will be updated to include new fields while preserving your settings.

### Manual Migration

If prompted or if issues occur:

1. Backup current config:
   ```bash
   cp data/printer-config.json data/printer-config.backup.json
   ```

2. Delete config to regenerate:
   ```bash
   rm data/printer-config.json
   ```

3. Reconfigure via dashboard

---

## Docker Image Updates

The Dockerfile uses `node:20-alpine` as base. To get the latest security patches for the base image:

```bash
# Pull latest base image
docker pull node:20-alpine

# Rebuild
docker compose build --no-cache
docker compose up -d
```

---

## Troubleshooting Updates

### Git Pull Fails

```bash
# If you have local changes
git stash
git pull origin main
git stash pop
```

### Build Fails

```bash
# Clear Docker cache
docker builder prune -f
docker compose build --no-cache
```

### Container Won't Start After Update

```bash
# Check logs
docker compose logs

# Common fixes:
# 1. Ensure .env is valid
# 2. Check for new required environment variables
# 3. Verify data directory permissions
```

### Port Already in Use

```bash
# Check what's using port 6500
sudo lsof -i :6500

# Stop conflicting service or change PORT in .env
```

---

## Automated Updates (Advanced)

For production environments, consider using Watchtower for automatic updates:

```yaml
# Add to docker-compose.yml
services:
  watchtower:
    image: containrrr/watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 86400 freemen-printer-proxy
```

⚠️ **Warning**: Automated updates should be used carefully in production. Always test updates in a staging environment first.
