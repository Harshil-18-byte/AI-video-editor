#!/usr/bin/env python3
"""
AIVA Backend Diagnostic Tool
Tests all backend endpoints to verify they're working
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8000"


def test_endpoint(method, path, data=None, description=""):
    """Test a single endpoint"""
    url = f"{BASE_URL}{path}"
    try:
        if method == "GET":
            response = requests.get(url, timeout=5)
        else:
            response = requests.post(url, json=data, timeout=5)

        status = "✅" if response.status_code == 200 else "❌"
        print(f"{status} {method:4} {path:30} - {description}")
        if response.status_code != 200:
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
        return response.status_code == 200
    except requests.exceptions.ConnectionError:
        print(f"❌ {method:4} {path:30} - CONNECTION FAILED (Is backend running?)")
        return False
    except Exception as e:
        print(f"❌ {method:4} {path:30} - ERROR: {str(e)}")
        return False


def main():
    print("=" * 80)
    print("AIVA BACKEND DIAGNOSTIC TEST")
    print("=" * 80)
    print()

    # Test basic connectivity
    print("1. BASIC CONNECTIVITY")
    print("-" * 80)
    test_endpoint("GET", "/", description="Root endpoint")
    print()

    # Test system endpoints
    print("2. SYSTEM ENDPOINTS")
    print("-" * 80)
    test_endpoint("GET", "/system/browse_file", description="File browser")
    test_endpoint("GET", "/system/browse_folder", description="Folder browser")
    test_endpoint(
        "POST", "/system/clean_cache", {"cache_path": "test"}, "Cache cleaner"
    )
    print()

    # Test AI endpoints (these will fail without valid files, but we check if they respond)
    print("3. AI PROCESSING ENDPOINTS")
    print("-" * 80)

    # These need a real file path, so they'll return errors, but we check if endpoint exists
    dummy_path = "C:/test.mp4"

    ai_actions = [
        ("smart_enhance", "Magic Mask"),
        ("upscale_ai", "Super Scale"),
        ("color_boost", "Smart Re-light"),
        ("enhance_audio", "Voice Isolation"),
        ("remove_silence", "Silence Removal"),
        ("audio_normalize", "Audio Normalization"),
        ("stabilize_video", "Video Stabilization"),
        ("smart_crop", "Smart Crop"),
        ("cinematic_grade", "Cinematic Grade"),
        ("voice_changer", "Voice Changer"),
        ("generate_captions", "Generate Captions"),
        ("extend_scene", "Extend Scene"),
    ]

    for action, name in ai_actions:
        payload = {"action": action, "file_path": dummy_path}
        if action == "voice_changer":
            payload["context"] = {"effect": "robot"}
        test_endpoint("POST", "/apply", payload, name)

    print()

    # Test dedicated AI endpoints
    print("4. DEDICATED AI ENDPOINTS")
    print("-" * 80)
    test_endpoint("POST", "/ai/transcribe", {"file_path": dummy_path}, "Transcription")
    test_endpoint(
        "POST", "/ai/scene_detect", {"file_path": dummy_path}, "Scene Detection"
    )
    test_endpoint(
        "POST", "/ai/enhance_audio", {"file_path": dummy_path}, "Audio Enhancement"
    )
    test_endpoint(
        "POST", "/ai/generative_fill", {"file_path": dummy_path}, "Generative Fill"
    )
    print()

    # Test project endpoints
    print("5. PROJECT ENDPOINTS")
    print("-" * 80)
    test_endpoint("POST", "/analyze", {"file_path": dummy_path}, "Media Analysis")
    test_endpoint("POST", "/export", {"output_path": "test.mp4"}, "Export")
    test_endpoint("GET", "/system/browse_save_file", description="Save File Dialog")
    print()

    print("=" * 80)
    print("DIAGNOSTIC COMPLETE")
    print("=" * 80)
    print()
    print("If you see ❌ CONNECTION FAILED, start the backend with:")
    print("  cd backend && python api.py")
    print()
    print("If you see ❌ with error messages, those endpoints may have issues.")
    print("Note: File-related errors are expected since we're using dummy paths.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(1)
