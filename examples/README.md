# A-D-AGENT Examples

This directory contains example scripts and configurations for advanced A-D-AGENT usage.

## Custom Flag Submission Script

When A-D-AGENT's built-in HTTP and netcat submission methods don't meet your CTF platform's requirements, you can use custom submission scripts.

### Files

- **`custom_submit_example.py`** - Complete example of custom flag submission script
- **`custom_submit_config.json`** - Configuration template for the custom script

### Features

- ✅ Reads flags from A-D-AGENT's `flags.txt` file
- ✅ Real-time monitoring with file system events
- ✅ Duplicate flag detection and tracking
- ✅ Retry logic for failed submissions
- ✅ Multiple submission protocols (HTTP, Telnet)
- ✅ Comprehensive error handling and logging
- ✅ Statistics and progress monitoring

### Setup

1. **Install dependencies:**
   ```bash
   pip install requests watchdog
   ```

2. **Configure the script:**
   ```bash
   cp custom_submit_config.json my_ctf_config.json
   nano my_ctf_config.json  # Edit for your CTF platform
   ```

3. **Run alongside A-D-AGENT:**
   ```bash
   # Terminal 1: Start A-D-AGENT
   ./start.sh

   # Terminal 2: Start custom submission script
   python custom_submit_example.py
   ```

### Configuration Options

```json
{
  "ctf_platform": {
    "name": "Your CTF Name",
    "submit_url": "https://your-ctf.com/api/submit",
    "auth_method": "bearer_token",  // "bearer_token", "api_key"
    "auth_token": "your-actual-token",
    "team_id": "your-team-id"
  },
  "submission": {
    "method": "http",        // "http", "telnet"
    "retry_attempts": 3,     // Max retries for failed submissions
    "retry_delay": 30        // Seconds between retries
  }
}
```

### Use Cases

This custom script approach is perfect for:

- **Complex Authentication**: OAuth, SAML, multi-step auth flows
- **Custom Protocols**: Proprietary APIs, binary protocols
- **Legacy Systems**: Telnet, SSH, or terminal-based submission
- **Integration Requirements**: Slack notifications, Discord bots, custom dashboards
- **Compliance Needs**: Logging, audit trails, specific data formats

### Docker Integration

**Option 1: Run inside A-D-AGENT container**
```bash
docker exec -it ad-agent python /app/examples/custom_submit_example.py
```

**Option 2: Sidecar container**
```yaml
# docker-compose.yml
services:
  ad-agent:
    build: .
    volumes:
      - flags_data:/app/flags.txt
  
  custom-submitter:
    image: python:3.11-alpine
    volumes:
      - flags_data:/data/flags.txt:ro
      - ./examples:/app/examples
    working_dir: /app/examples
    command: python custom_submit_example.py
    depends_on:
      - ad-agent
```

### Output Example

```
🚀 A-D-AGENT Custom Flag Submission Script
==================================================
📝 Created default config file: custom_submit_config.json
🔍 Processing existing flags...
✅ Successfully submitted: CTF{example_flag_1}
❌ Failed to submit CTF{example_flag_2}: Rate limited - will retry
👀 Setting up real-time flag monitoring...
✅ Custom flag submission script is running!

📥 Detected new flags in flags.txt
✅ Successfully submitted: CTF{new_flag_discovered}

📊 Flag Submission Statistics:
   Total processed: 15
   ✅ Successful: 12
   ❌ Failed: 1
   🔄 In retry queue: 2
   💾 Total submitted ever: 47
```

This provides maximum flexibility while leveraging A-D-AGENT's powerful exploit execution and flag detection capabilities!
