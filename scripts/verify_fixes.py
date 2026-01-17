#!/usr/bin/env python3
"""
AIVA Code Verification - Confirms all fixes are in place
Run this to verify the code has all the fixes before starting the backend
"""

import os
import sys


def check_file_contains(filepath, search_text, description):
    """Check if a file contains specific text"""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            if search_text in content:
                print(f"✅ {description}")
                return True
            else:
                print(f"❌ {description} - NOT FOUND")
                return False
    except Exception as e:
        print(f"❌ {description} - ERROR: {e}")
        return False


def main():
    print("=" * 80)
    print("AIVA CODE VERIFICATION")
    print("=" * 80)
    print()

    backend_dir = os.path.join(os.path.dirname(__file__), "..", "backend")
    api_path = os.path.join(backend_dir, "api.py")
    analysis_path = os.path.join(backend_dir, "analysis.py")

    all_good = True

    print("1. CHECKING OPENCV CODEC FIXES (api.py)")
    print("-" * 80)
    # Check that mp4v is used instead of vp80
    all_good &= check_file_contains(
        api_path,
        'fourcc = cv2.VideoWriter_fourcc(*"mp4v")',
        "Using mp4v codec (not vp80)",
    )
    # Verify vp80 is NOT in the actual code (only in comments/strings)
    with open(api_path, "r", encoding="utf-8") as f:
        lines = [
            l
            for l in f.readlines()
            if "fourcc" in l and "vp80" in l and not l.strip().startswith("#")
        ]
        if len(lines) == 0:
            print("✅ No vp80 codec usage found in code")
        else:
            print(f"❌ Found {len(lines)} lines still using vp80")
            all_good = False
    print()

    print("2. CHECKING AUDIO ANALYSIS FIX (analysis.py)")
    print("-" * 80)
    all_good &= check_file_contains(
        analysis_path, "if is_audio:", "Audio analysis only for audio files"
    )
    all_good &= check_file_contains(
        analysis_path,
        "# 1. Audio Analysis (for audio files only",
        "Correct audio analysis comment",
    )
    print()

    print("3. CHECKING THREADING FIXES (api.py)")
    print("-" * 80)
    all_good &= check_file_contains(
        api_path, "import threading", "Threading module imported"
    )
    all_good &= check_file_contains(
        api_path,
        "thread = threading.Thread(target=run_dialog)",
        "File dialogs use threading",
    )
    all_good &= check_file_contains(
        api_path, "thread.join(timeout=30)", "Thread timeout implemented"
    )
    print()

    print("4. CHECKING FRONTEND FEEDBACK (Inspector.tsx)")
    print("-" * 80)
    frontend_inspector = os.path.join(
        os.path.dirname(__file__),
        "..",
        "frontend",
        "src",
        "components",
        "Inspector.tsx",
    )
    all_good &= check_file_contains(
        frontend_inspector, "🚀 Processing:", "Immediate feedback messages"
    )
    all_good &= check_file_contains(
        frontend_inspector,
        "const actionNames: Record<string, string>",
        "Friendly action names",
    )
    print()

    print("=" * 80)
    if all_good:
        print("✅ ALL FIXES VERIFIED - Code is ready!")
        print()
        print("Next step: RESTART the backend to load these fixes")
        print("  1. Stop current backend (Ctrl+C)")
        print("  2. Run: python backend/api.py")
        print()
        return 0
    else:
        print("❌ SOME FIXES MISSING - Please review the code")
        print()
        return 1


if __name__ == "__main__":
    sys.exit(main())
