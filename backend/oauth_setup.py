import json
from pathlib import Path

from google_auth_oauthlib.flow import Flow

SCOPES = ["https://www.googleapis.com/auth/gmail.send"]

CLIENT_FILE = Path("client_secret_xxxx.json")

REDIRECT_URI = "http://localhost:8000/api/auth/google/callback"

with open(CLIENT_FILE, "r", encoding="utf-8") as f:
    client_config = json.load(f)

flow = Flow.from_client_config(
    client_config,
    scopes=SCOPES,
    redirect_uri=REDIRECT_URI,
)

authorization_url, state = flow.authorization_url(
    access_type="offline",
    prompt="consent",
    include_granted_scopes="true",
)

print("\nOpen this URL in your browser:\n")
print(authorization_url)
print("\nAfter authorizing, Google will redirect to:")
print(REDIRECT_URI)
print("\nYou will need the full callback URL from your browser.")