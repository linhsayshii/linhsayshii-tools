import os
import time
import threading
import glob

def clean_temp_files(directory=".", pattern="download_*", max_age_seconds=1800):
    """
    Cleans up files matching the pattern that are older than max_age_seconds.
    """
    print(f"🧹 Running temp files cleanup in '{directory}' for pattern '{pattern}'...")
    now = time.time()
    count = 0
    # Search for files matching the pattern in the directory
    search_path = os.path.join(directory, pattern)
    for file_path in glob.glob(search_path):
        try:
            if os.path.isfile(file_path):
                file_age = now - os.path.getmtime(file_path)
                if file_age > max_age_seconds:
                    os.remove(file_path)
                    print(f"Deleted old temp file: {file_path} (age: {int(file_age)}s)")
                    count += 1
        except Exception as e:
            print(f"Error deleting file {file_path}: {e}")
    if count > 0:
        print(f"🧹 Cleaned up {count} temp file(s).")

def start_cleanup_daemon(directory=".", pattern="download_*", interval_seconds=1800, max_age_seconds=1800):
    """
    Starts a daemon thread that runs the cleanup function periodically.
    """
    def loop():
        # Wait a bit before first run
        time.sleep(10)
        while True:
            try:
                clean_temp_files(directory, pattern, max_age_seconds)
            except Exception as e:
                print(f"Error in cleanup daemon loop: {e}")
            time.sleep(interval_seconds)

    thread = threading.Thread(target=loop, daemon=True)
    thread.start()
    print("🚀 Cleanup daemon thread started successfully.")
    return thread
