import requests
import sys

host=sys.argv[1]

# =============================================
# ===== WRITE YOUR CODE BELOW THIS LINE =====
# =============================================

# Example code (you can modify or replace this):
r = requests.get(f'http://{host}:5500')
print(r.text)  # The output should contain the flag
