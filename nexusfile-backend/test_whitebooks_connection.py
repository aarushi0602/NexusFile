"""
Verifies your WhiteBooks OAuth2 credentials actually work, using their
simplest endpoint (GSTIN verify) before trusting the more complex
GSTR-2B fetch and filing calls. Run this whenever you want to confirm
live integration status without going through the full app.

Usage: python test_whitebooks_connection.py
"""
from services.whitebooks_client import _get_access_token, verify_gstin

TEST_GSTIN = "27AAAPL1234C1Z9"  # any syntactically valid test GSTIN


def main():
    print("Step 1: Requesting OAuth2 access token...")
    try:
        token = _get_access_token()
        print(f"  OK — token acquired (first 12 chars: {token[:12]}...)")
    except Exception as e:
        print(f"  FAILED: {e}")
        print("  Check WHITEBOOKS_CLIENT_ID / WHITEBOOKS_CLIENT_SECRET in .env,")
        print("  and confirm the token endpoint path in whitebooks_client.py")
        print("  matches WhiteBooks' 'enable GST API access' doc.")
        return

    print(f"\nStep 2: Calling GSTIN verify for {TEST_GSTIN}...")
    try:
        result = verify_gstin(TEST_GSTIN)
        print(f"  OK — response: {result}")
        print("\nLive WhiteBooks connection is working.")
    except Exception as e:
        print(f"  FAILED: {e}")
        print("  Token exchange works, but the verify_gstin endpoint path")
        print("  or response parsing likely needs adjusting — check the")
        print("  actual API path in your WhiteBooks dashboard docs.")


if __name__ == "__main__":
    main()
