#!/usr/bin/env python3
"""
A-D-AGENT Custom Flag Submission Script Example

This script demonstrates how to create custom flag submission logic
for CTF platforms that require special protocols or authentication.

Usage:
    python custom_submit_example.py

Requirements:
    pip install requests watchdog

Features:
    - Reads flags from A-D-AGENT's flags.txt file
    - Tracks submitted flags to avoid duplicates
    - Implements retry logic for failed submissions
    - Real-time monitoring of new flags
    - Multiple submission protocol examples
"""

import os
import time
import json
import requests
import socket
import threading
from datetime import datetime, timedelta
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler


class FlagSubmissionManager:
    def __init__(self, config_file="custom_submit_config.json"):
        self.config = self.load_config(config_file)
        self.submitted_flags = self.load_submitted_flags()
        self.retry_queue = []
        self.stats = {
            'total_processed': 0,
            'successful_submissions': 0,
            'failed_submissions': 0,
            'duplicate_flags': 0
        }
    
    def load_config(self, config_file):
        """Load configuration for custom submission"""
        default_config = {
            "ctf_platform": {
                "name": "Example CTF",
                "submit_url": "https://ctf.example.com/api/submit",
                "auth_method": "bearer_token",
                "auth_token": "your-api-token-here",
                "team_id": "team_123"
            },
            "submission": {
                "method": "http",  # "http", "telnet", "ssh"
                "batch_size": 1,
                "retry_attempts": 3,
                "retry_delay": 30
            },
            "files": {
                "flags_input": "flags.txt",
                "submitted_flags": "submitted_flags.txt",
                "failed_flags": "failed_flags.txt"
            }
        }
        
        if os.path.exists(config_file):
            try:
                with open(config_file, 'r') as f:
                    user_config = json.load(f)
                # Merge with defaults
                for key, value in user_config.items():
                    if isinstance(value, dict) and key in default_config:
                        default_config[key].update(value)
                    else:
                        default_config[key] = value
            except Exception as e:
                print(f"⚠️ Error loading config {config_file}: {e}")
                print("Using default configuration")
        else:
            # Create default config file
            with open(config_file, 'w') as f:
                json.dump(default_config, f, indent=2)
            print(f"📝 Created default config file: {config_file}")
            print("Please edit the configuration and restart the script")
        
        return default_config
    
    def load_submitted_flags(self):
        """Load list of already submitted flags"""
        submitted_file = self.config['files']['submitted_flags']
        submitted = set()
        
        if os.path.exists(submitted_file):
            try:
                with open(submitted_file, 'r') as f:
                    submitted = set(line.strip() for line in f if line.strip())
                print(f"📋 Loaded {len(submitted)} previously submitted flags")
            except Exception as e:
                print(f"⚠️ Error loading submitted flags: {e}")
        
        return submitted
    
    def mark_flag_submitted(self, flag):
        """Mark a flag as successfully submitted"""
        self.submitted_flags.add(flag)
        submitted_file = self.config['files']['submitted_flags']
        
        try:
            with open(submitted_file, 'a') as f:
                f.write(f"{flag}\n")
        except Exception as e:
            print(f"⚠️ Error logging submitted flag: {e}")
    
    def log_failed_flag(self, flag, error_msg):
        """Log a permanently failed flag"""
        failed_file = self.config['files']['failed_flags']
        
        try:
            with open(failed_file, 'a') as f:
                timestamp = datetime.now().isoformat()
                f.write(f"{timestamp} | {flag} | {error_msg}\n")
        except Exception as e:
            print(f"⚠️ Error logging failed flag: {e}")
    
    def submit_flag_http(self, flag):
        """Submit flag via HTTP/HTTPS"""
        config = self.config['ctf_platform']
        
        headers = {
            "User-Agent": "A-D-AGENT-Custom/1.0",
            "Content-Type": "application/json"
        }
        
        # Add authentication
        if config['auth_method'] == 'bearer_token':
            headers['Authorization'] = f"Bearer {config['auth_token']}"
        elif config['auth_method'] == 'api_key':
            headers['X-API-Key'] = config['auth_token']
        
        # Prepare payload
        payload = {
            "flag": flag,
            "team_id": config['team_id'],
            "timestamp": datetime.now().isoformat()
        }
        
        try:
            response = requests.post(
                config['submit_url'],
                headers=headers,
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('status') == 'accepted':
                    return True, "Flag accepted"
                else:
                    return False, result.get('message', 'Flag rejected')
            elif response.status_code == 429:
                return False, "Rate limited - will retry"
            else:
                return False, f"HTTP {response.status_code}: {response.text}"
                
        except requests.exceptions.Timeout:
            return False, "Request timeout - will retry"
        except requests.exceptions.ConnectionError:
            return False, "Connection error - will retry"
        except Exception as e:
            return False, f"Unexpected error: {e}"
    
    def submit_flag_telnet(self, flag):
        """Submit flag via Telnet protocol"""
        config = self.config['ctf_platform']
        
        try:
            # Parse host and port from URL
            host = config.get('telnet_host', 'localhost')
            port = config.get('telnet_port', 23)
            
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(10)
            sock.connect((host, port))
            
            # Read banner
            banner = sock.recv(1024).decode('utf-8', errors='ignore')
            print(f"📡 Telnet banner: {banner.strip()}")
            
            # Authenticate if required
            if config.get('telnet_auth'):
                auth_cmd = f"{config['telnet_auth']}\n"
                sock.send(auth_cmd.encode())
                auth_response = sock.recv(1024).decode('utf-8', errors='ignore')
                
                if "success" not in auth_response.lower():
                    return False, f"Authentication failed: {auth_response.strip()}"
            
            # Submit flag
            submit_cmd = f"SUBMIT {flag}\n"
            sock.send(submit_cmd.encode())
            
            # Read response
            response = sock.recv(1024).decode('utf-8', errors='ignore')
            
            if any(word in response.lower() for word in ['accepted', 'correct', 'valid']):
                return True, "Flag accepted via Telnet"
            else:
                return False, f"Flag rejected: {response.strip()}"
                
        except Exception as e:
            return False, f"Telnet error: {e}"
        finally:
            try:
                sock.close()
            except:
                pass
    
    def submit_flag(self, flag):
        """Main flag submission logic"""
        if flag in self.submitted_flags:
            self.stats['duplicate_flags'] += 1
            return True, "Already submitted"
        
        self.stats['total_processed'] += 1
        
        # Choose submission method
        method = self.config['submission']['method']
        
        if method == 'http':
            success, message = self.submit_flag_http(flag)
        elif method == 'telnet':
            success, message = self.submit_flag_telnet(flag)
        else:
            success, message = False, f"Unknown submission method: {method}"
        
        if success:
            self.mark_flag_submitted(flag)
            self.stats['successful_submissions'] += 1
            print(f"✅ Successfully submitted: {flag}")
            return True, message
        else:
            self.stats['failed_submissions'] += 1
            print(f"❌ Failed to submit {flag}: {message}")
            
            # Check if this is a retryable error
            retryable_errors = ['timeout', 'rate limited', 'connection error', 'will retry']
            if any(error in message.lower() for error in retryable_errors):
                return False, message  # Will be added to retry queue
            else:
                self.log_failed_flag(flag, message)
                return False, f"Permanent failure: {message}"
    
    def process_flags_file(self):
        """Process all flags from the flags.txt file"""
        flags_file = self.config['files']['flags_input']
        
        if not os.path.exists(flags_file):
            print(f"📁 Waiting for {flags_file} to be created by A-D-AGENT...")
            return []
        
        new_flags = []
        try:
            with open(flags_file, 'r') as f:
                for line_num, line in enumerate(f, 1):
                    flag = line.strip()
                    if flag and flag not in self.submitted_flags:
                        new_flags.append(flag)
        except Exception as e:
            print(f"❌ Error reading {flags_file}: {e}")
        
        return new_flags
    
    def process_retry_queue(self):
        """Process flags in the retry queue"""
        current_time = time.time()
        retry_delay = self.config['submission']['retry_delay']
        max_attempts = self.config['submission']['retry_attempts']
        
        for item in self.retry_queue[:]:  # Copy for safe iteration
            if current_time - item['last_attempt'] >= retry_delay:
                if item['attempts'] < max_attempts:
                    print(f"🔄 Retrying flag: {item['flag']} (attempt {item['attempts'] + 1})")
                    success, message = self.submit_flag(item['flag'])
                    
                    if success:
                        self.retry_queue.remove(item)
                    else:
                        item['attempts'] += 1
                        item['last_attempt'] = current_time
                        item['last_error'] = message
                else:
                    # Max retries exceeded
                    print(f"💀 Giving up on flag after {max_attempts} attempts: {item['flag']}")
                    self.log_failed_flag(item['flag'], f"Max retries exceeded: {item.get('last_error', 'Unknown error')}")
                    self.retry_queue.remove(item)
    
    def print_stats(self):
        """Print current statistics"""
        print("\n📊 Flag Submission Statistics:")
        print(f"   Total processed: {self.stats['total_processed']}")
        print(f"   ✅ Successful: {self.stats['successful_submissions']}")
        print(f"   ❌ Failed: {self.stats['failed_submissions']}")
        print(f"   🔄 In retry queue: {len(self.retry_queue)}")
        print(f"   📋 Already submitted: {self.stats['duplicate_flags']}")
        print(f"   💾 Total submitted ever: {len(self.submitted_flags)}")


class FlagFileWatcher(FileSystemEventHandler):
    def __init__(self, submission_manager):
        self.manager = submission_manager
        self.last_processed_size = 0
    
    def on_modified(self, event):
        if not event.is_directory and event.src_path.endswith('flags.txt'):
            print("📥 Detected new flags in flags.txt")
            new_flags = self.manager.process_flags_file()
            
            for flag in new_flags:
                success, message = self.manager.submit_flag(flag)
                if not success and "timeout" in message.lower() or "retry" in message.lower():
                    # Add to retry queue
                    self.manager.retry_queue.append({
                        'flag': flag,
                        'attempts': 1,
                        'last_attempt': time.time(),
                        'last_error': message
                    })


def main():
    print("🚀 A-D-AGENT Custom Flag Submission Script")
    print("=" * 50)
    
    # Initialize submission manager
    manager = FlagSubmissionManager()
    
    # Process any existing flags
    print("🔍 Processing existing flags...")
    existing_flags = manager.process_flags_file()
    
    for flag in existing_flags:
        success, message = manager.submit_flag(flag)
        if not success and any(word in message.lower() for word in ['timeout', 'retry', 'rate limit']):
            manager.retry_queue.append({
                'flag': flag,
                'attempts': 1,
                'last_attempt': time.time(),
                'last_error': message
            })
        time.sleep(0.5)  # Small delay between submissions
    
    # Set up file watcher for real-time processing
    print("👀 Setting up real-time flag monitoring...")
    event_handler = FlagFileWatcher(manager)
    observer = Observer()
    observer.schedule(event_handler, ".", recursive=False)
    observer.start()
    
    print("✅ Custom flag submission script is running!")
    print("   - Monitoring flags.txt for new flags")
    print("   - Processing retry queue every 30 seconds")
    print("   - Press Ctrl+C to stop")
    
    try:
        # Main loop for retry processing and stats
        while True:
            time.sleep(30)  # Check every 30 seconds
            
            # Process retry queue
            if manager.retry_queue:
                print(f"🔄 Processing {len(manager.retry_queue)} flags in retry queue...")
                manager.process_retry_queue()
            
            # Print stats every 5 minutes
            if int(time.time()) % 300 == 0:  # Every 5 minutes
                manager.print_stats()
                
    except KeyboardInterrupt:
        print("\n🛑 Stopping custom flag submission script...")
        observer.stop()
        manager.print_stats()
    
    observer.join()
    print("✅ Custom flag submission script stopped")


if __name__ == "__main__":
    main()
