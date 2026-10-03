import os

# Local development only:
# Allows OAuth callback over http://localhost.
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

import json
from pathlib import Path

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from google_auth_oauthlib.flow import Flow


router = APIRouter(
    prefix="/api/auth/google",
    tags=["Google OAuth"],
)


SCOPES = [
    "https://www.googleapis.com/auth/gmail.send"
]


REDIRECT_URI = "http://localhost:8000/api/auth/google/callback"


BASE_DIR = Path(__file__).resolve().parents[2]


def get_client_file():
    client_files = list(BASE_DIR.glob("client_secret*.json"))

    if not client_files:
        raise FileNotFoundError(
            "Google OAuth client JSON file was not found in the backend folder."
        )

    return client_files[0]


TOKEN_FILE = BASE_DIR / "token.json"


@router.get("")
def google_login():
    """
    Start the Google OAuth authorization flow.
    """

    with open(get_client_file(), "r", encoding="utf-8") as file:
        client_config = json.load(file)

    flow = Flow.from_client_config(
        client_config,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI,
        autogenerate_code_verifier=True,
    )

    authorization_url, state = flow.authorization_url(
        access_type="offline",
        prompt="consent",
        include_granted_scopes="true",
    )

    # Save both OAuth state and PKCE code verifier.
    # They are required when Google redirects back to the callback.
    state_file = BASE_DIR / ".oauth_state"

    state_file.write_text(
        json.dumps(
            {
                "state": state,
                "code_verifier": flow.code_verifier,
            }
        ),
        encoding="utf-8",
    )

    # Automatically redirect the browser to Google.
    return RedirectResponse(url=authorization_url)


@router.get("/callback", response_class=HTMLResponse)
def google_callback(request: Request):
    """
    Google redirects here after the user grants permission.
    """

    state_file = BASE_DIR / ".oauth_state"

    if not state_file.exists():
        return HTMLResponse(
            """
            <h2>OAuth state not found.</h2>
            <p>Please start the authorization again.</p>
            """,
            status_code=400,
        )

    # Read the saved OAuth state and PKCE verifier.
    try:
        oauth_data = json.loads(
            state_file.read_text(encoding="utf-8")
        )

        state = oauth_data["state"]
        code_verifier = oauth_data["code_verifier"]

    except Exception as exc:
        return HTMLResponse(
            f"""
            <h2>OAuth state error</h2>
            <p>{str(exc)}</p>
            """,
            status_code=400,
        )

    with open(CLIENT_FILE, "r", encoding="utf-8") as file:
        client_config = json.load(file)

    # Re-create the OAuth flow using the SAME
    # state and PKCE code verifier from the first step.
    flow = Flow.from_client_config(
        client_config,
        scopes=SCOPES,
        state=state,
        redirect_uri=REDIRECT_URI,
        code_verifier=code_verifier,
        autogenerate_code_verifier=False,
    )

    try:
        flow.fetch_token(
            authorization_response=str(request.url)
        )

    except Exception as exc:
        return HTMLResponse(
            f"""
            <h2>Google OAuth failed</h2>
            <p>{str(exc)}</p>
            """,
            status_code=400,
        )

    credentials = flow.credentials

    # We need a refresh token so the backend can continue
    # sending Gmail messages without asking for permission every time.
    if not credentials.refresh_token:
        return HTMLResponse(
            """
            <h2>OAuth completed, but no refresh token was received.</h2>
            <p>Please start the authorization again.</p>
            """,
            status_code=400,
        )

    # Save the OAuth credentials locally.
    # IMPORTANT: token.json must remain in .gitignore.
    TOKEN_FILE.write_text(
        credentials.to_json(),
        encoding="utf-8",
    )

    # Remove temporary OAuth state after successful authorization.
    try:
        state_file.unlink()
    except FileNotFoundError:
        pass

    return HTMLResponse(
        """
        <html>
            <body
                style="
                    font-family: Arial;
                    padding: 40px;
                    line-height: 1.6;
                "
            >
                <h2>✅ Gmail authorization successful!</h2>

                <p>
                    Your Gmail OAuth credentials have been saved locally.
                </p>

                <p>
                    You can close this browser tab.
                </p>
            </body>
        </html>
        """
    )