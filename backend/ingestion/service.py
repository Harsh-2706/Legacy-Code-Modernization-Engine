import os
from sqlalchemy.orm import Session
from .. import models

def scan_repository(repo_id: int, db: Session):
    repo = db.query(models.Repository).filter(models.Repository.id == repo_id).first()
    if not repo:
        return None
    
    # Supported file extensions for parsing
    SUPPORTED_EXTENSIONS = {".cbl", ".java", ".c", ".txt", ".h", ".cpp", ".py"}
    EXCLUDE_DIRS = {".git", "node_modules", "__pycache__", ".venv", ".next", "dist", "build"}
    
    print(f"[Ingestion] Scanning repository path: {repo.path}")
    file_count = 0
    for root, dirs, files in os.walk(repo.path):
        # Filter directories in-place for efficiency
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in SUPPORTED_EXTENSIONS:
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, repo.path)
                
                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                    
                    db_file = db.query(models.File).filter_by(repo_id=repo.id, path=rel_path).first()
                    if not db_file:
                        db_file = models.File(
                            repo_id=repo.id,
                            path=rel_path,
                            content=content
                        )
                        db.add(db_file)
                    else:
                        db_file.content = content
                    file_count += 1
                except Exception as e:
                    print(f"[Ingestion] Error reading {file_path}: {e}")
    
    print(f"[Ingestion] Scan complete. Found {file_count} relevant files.")
    repo.status = "files_ingested"
    db.commit()
    return repo
