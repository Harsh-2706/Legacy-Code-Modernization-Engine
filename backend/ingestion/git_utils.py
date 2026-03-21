import os
import shutil
import tempfile
import zipfile
import stat
import time
from git import Repo

def remove_readonly(func, path, _):
    """Clear the readonly bit and re-attempt the removal."""
    os.chmod(path, stat.S_IWRITE)
    func(path)

def process_github_url(url: str, base_dir: str = None) -> str:
    """Clones a GitHub repository to a temporary directory."""
    if base_dir is None:
        # Use cross-platform temp directory
        base_dir = os.path.join(tempfile.gettempdir(), "legacy_modernizer_repos")
    
    if not os.path.exists(base_dir):
        os.makedirs(base_dir, exist_ok=True)
        
    # Robust repo name extraction
    # Strip trailing slashes and .git suffix
    clean_url = url.rstrip("/")
    if clean_url.endswith(".git"):
        clean_url = clean_url[:-4]
    
    repo_name = clean_url.split("/")[-1]
    if not repo_name:
        raise ValueError(f"Could not extract repository name from URL: {url}")
        
    target_path = os.path.join(base_dir, repo_name)
    
    print(f"[Git] Cloning {url} to {target_path}...")
    
    # If it already exists, remove it for a fresh clone
    if os.path.exists(target_path):
        print(f"[Git] Target path {target_path} exists. Removing for fresh clone...")
        # Try a few times on Windows as files might be locked
        for i in range(5):
            try:
                shutil.rmtree(target_path, onerror=remove_readonly)
                break
            except Exception as e:
                if i == 4:
                    print(f"[Git] Failed to remove {target_path} after 5 attempts: {e}")
                    raise
                time.sleep(1)
    
    try:
        # Clone with depth 1 for speed
        Repo.clone_from(url, target_path, depth=1)
        print(f"[Git] Successfully cloned {url} to {target_path}")
    except Exception as e:
        print(f"[Git] Error cloning repository: {e}")
        # Provide a more descriptive error message if possible
        error_msg = str(e)
        if "already exists and is not an empty directory" in error_msg:
             error_msg = f"Target directory already exists and could not be cleared: {target_path}"
        elif "Could not read from remote repository" in error_msg:
             error_msg = f"Could not read from remote repository. Please check the URL and your permissions: {url}"
             
        raise Exception(f"Failed to clone repository: {error_msg}")

    return target_path

def process_zip_file(zip_path: str, base_dir: str = None) -> str:
    """Extracts a ZIP file to a temporary directory."""
    if base_dir is None:
        base_dir = os.path.join(tempfile.gettempdir(), "legacy_modernizer_repos")
        
    if not os.path.exists(base_dir):
        os.makedirs(base_dir, exist_ok=True)
        
    extract_name = os.path.basename(zip_path).replace(".zip", "")
    target_path = os.path.join(base_dir, extract_name)
    
    if os.path.exists(target_path):
        shutil.rmtree(target_path, onerror=remove_readonly)
        
    os.makedirs(target_path, exist_ok=True)
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(target_path)
        
    return target_path
