from fastapi import FastAPI, Depends, HTTPException, UploadFile, File as FastAPIFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
import json
from pydantic import BaseModel

import models, database
from database import engine, get_db
from ingestion import service as ingestion_service
from ingestion import git_utils
from parser import engine as parser_engine
from graph import builder as graph_builder
from optimizer import service as optimizer_service
from llm import service as llm_service

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Legacy Code Modernization Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to Legacy Code Modernization Engine API"}

class SubmissionCreate(BaseModel):
    team_info: str
    repo_url: str
    project_description: str
    tech_stack: str
    failure_narrative: str
    quiz_score: int
    integrity_flags: str = "{}"
    files_analyzed: int = 0

@app.post("/submit/validate")
async def validate_submission_files(files: List[UploadFile] = FastAPIFile(...)):
    ai_signals = 0
    total_files = len(files)
    for file in files:
        content = await file.read()
        try:
            text = content.decode("utf-8").lower()
            if "as an ai" in text or "language model" in text or "```python" in text:
                ai_signals += 1
        except:
            pass
            
    flags = {
        "ai_generated_probability": round((ai_signals / total_files) * 100, 2) if total_files > 0 else 0,
        "human_authored": ai_signals == 0
    }
    return {
        "integrity_flags": json.dumps(flags),
        "files_analyzed": total_files
    }

@app.post("/submit")
async def create_submission(sub: SubmissionCreate, db: Session = Depends(get_db)):
    if len(sub.project_description) < 100:
        raise HTTPException(status_code=400, detail="Project description must be at least 100 characters")
    if len(sub.failure_narrative) < 200:
        raise HTTPException(status_code=400, detail="Failure narrative must be at least 200 characters")
        
    db_sub = models.Submission(**sub.dict())
    db.add(db_sub)
    db.commit()
    db.refresh(db_sub)
    return db_sub


@app.post("/repo/upload")
async def upload_repository(name: str, file: UploadFile = FastAPIFile(...), db: Session = Depends(get_db)):
    # Save the uploaded file to a temporary path, then process appropriately
    import tempfile
    
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name
    
    if file.filename.endswith(".zip"):
        final_path = git_utils.process_zip_file(tmp_path)
    else:
        # Single file upload
        final_path = os.path.join("/tmp/legacy_modernizer_repos", name)
        os.makedirs(final_path, exist_ok=True)
        shutil.copy(tmp_path, os.path.join(final_path, file.filename))
        
    repo = db.query(models.Repository).filter(models.Repository.name == name).first()
    if not repo:
        repo = models.Repository(name=name, path=final_path, status="ingested")
        db.add(repo)
    else:
        repo.path = final_path
        repo.status = "ingested"
    db.commit()
    db.refresh(repo)
    
    # Ingest files
    ingestion_service.scan_repository(repo.id, db)
    
    # Auto-parse
    files = db.query(models.File).filter(models.File.repo_id == repo.id).all()
    for f in files:
        parser_engine.parse_file(f.id, db)
    graph_builder.build_dependency_graph(repo.id, db)
    repo.status = "parsed"
    db.commit()
    
    return repo

@app.post("/repo/clone")
async def clone_repository(url: str, db: Session = Depends(get_db)):
    try:
        # 1. Clone the repository
        path = git_utils.process_github_url(url)
        
        # 2. Consistent Name Extraction
        clean_url = url.rstrip("/")
        if clean_url.endswith(".git"):
            clean_url = clean_url[:-4]
        name = clean_url.split("/")[-1]
        
        print(f"[API] Processing cloned repository: {name} at {path}")
        
        # 3. DB Transaction for Repository
        repo = db.query(models.Repository).filter(models.Repository.name == name).first()
        if not repo:
            repo = models.Repository(name=name, path=path, status="ingested")
            db.add(repo)
        else:
            repo.path = path
            repo.status = "ingested"
        db.commit()
        db.refresh(repo)
        
        # 4. Ingest files
        ingestion_service.scan_repository(repo.id, db)
        
        # 5. Auto-parse & Build Graph
        files = db.query(models.File).filter(models.File.repo_id == repo.id).all()
        print(f"[API] Parsing {len(files)} files for repository {name}")
        for f in files:
            parser_engine.parse_file(f.id, db)
            
        graph_builder.build_dependency_graph(repo.id, db)
        
        repo.status = "parsed"
        db.commit()
        db.refresh(repo)
        
        return {
            "id": repo.id,
            "name": repo.name,
            "status": repo.status,
            "file_count": len(files),
            "path": path
        }
    except Exception as e:
        print(f"[API] Error in clone_repository: {str(e)}")
        return {"error": str(e)}

@app.get("/repositories")
async def get_repositories(db: Session = Depends(get_db)):
    return db.query(models.Repository).all()

@app.post("/repo/{repo_id}/parse")
async def parse_repository(repo_id: int, db: Session = Depends(get_db)):
    repo = db.query(models.Repository).filter(models.Repository.id == repo_id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    files = db.query(models.File).filter(models.File.repo_id == repo_id).all()
    for file in files:
        parser_engine.parse_file(file.id, db)
    
    # Build graph
    graph_builder.build_dependency_graph(repo_id, db)
    
    repo.status = "parsed"
    db.commit()
    return {"status": "success", "message": f"Parsed {len(files)} files"}

@app.get("/repo/{repo_id}/functions")
async def get_functions(repo_id: int, db: Session = Depends(get_db)):
    return db.query(models.Function).join(models.File).filter(models.File.repo_id == repo_id).all()

@app.get("/function/{func_id}/dependencies")
async def get_dependencies(func_id: int, db: Session = Depends(get_db)):
    deps = db.query(models.Dependency).filter(models.Dependency.caller_id == func_id).all()
    return deps

@app.post("/function/{func_id}/optimize")
async def optimize_function_context(func_id: int, model: str = "gemini-2.0-flash", rate: str = "auto", db: Session = Depends(get_db)):
    opt_context = optimizer_service.optimize_context(func_id, db, model=model, rate=rate)
    return opt_context

@app.post("/function/{func_id}/generate")
async def generate_modernization(func_id: int, model: str = "gemini-2.0-flash", rate: str = "auto", db: Session = Depends(get_db)):
    # Always run optimization to get fresh context dict
    opt_dict = optimizer_service.optimize_context(func_id, db, model=model, rate=rate)
    optimized_code = opt_dict.get("optimized_code", "") if isinstance(opt_dict, dict) else opt_dict.optimized_code
    
    output = llm_service.generate_modernization(func_id, optimized_code, db, model_name=model)
    return output

@app.get("/function/{func_id}/outputs")
async def get_outputs(func_id: int, db: Session = Depends(get_db)):
    return db.query(models.GeneratedOutput).filter(models.GeneratedOutput.function_id == func_id).all()

@app.get("/metrics/summary")
async def get_metrics_summary(db: Session = Depends(get_db)):
    from sqlalchemy.sql import func
    # Only count runs that actually had non-trivial compression (ratio > 0)
    meaningful = db.query(models.Metric).filter(models.Metric.compression_ratio > 0)
    all_metrics = db.query(
        func.count(models.Metric.id).label("total_calls"),
        func.avg(models.Metric.compression_ratio).label("avg_compression_ratio"),
        func.avg(models.Metric.latency_ms).label("avg_latency_ms"),
        func.sum(models.Metric.tokens_saved).label("total_tokens_saved")
    ).first()
    meaningful_metrics = db.query(
        func.avg(models.Metric.compression_ratio).label("avg_compression_ratio")
    ).filter(models.Metric.compression_ratio > 0).first()
    
    return {
        "total_calls": all_metrics[0] or 0,
        "avg_compression_ratio": float(meaningful_metrics[0] or 0.0),
        "avg_latency_ms": float(all_metrics[2] or 0.0),
        "total_tokens_saved": int(all_metrics[3] or 0)
    }

@app.delete("/metrics/reset")
async def reset_metrics(db: Session = Depends(get_db)):
    """Clear all stale/zero-compression metric records for a clean dashboard."""
    deleted = db.query(models.Metric).delete()
    db.commit()
    return {"message": f"Deleted {deleted} metric records. Dashboard is now clean."}


@app.get("/metrics")
@app.get("/analytics/modernization")
async def get_all_metrics(db: Session = Depends(get_db)):
    return db.query(models.Metric).order_by(models.Metric.timestamp.asc()).all()
