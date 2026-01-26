#!/usr/bin/env python3
import os

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

gemini_key = os.getenv("GEMINI_API_KEY")
if gemini_key:
    print(f"GEMINI_API_KEY found: {gemini_key[:10]}... (length: {len(gemini_key)})")
else:
    print("GEMINI_API_KEY not found!")

# Test Gemini connection
try:
    from google import genai
    client = genai.Client(api_key=gemini_key)

    # Try to list models
    models = client.models.list()
    print("\nAvailable Gemini models:")
    for model in models[:5]:
        print(f"  - {model.name}")

    print("\n✅ Gemini API connection successful!")
except Exception as e:
    print(f"\n❌ Gemini API error: {e}")
