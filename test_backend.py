from backend import models, database
from backend.ingestion import service as ingestion_service
from backend.parser import engine as parser_engine
from backend.graph import builder as graph_builder
from backend.optimizer import service as optimizer_service
from backend.llm import service as llm_service
import os

# Create database
models.Base.metadata.create_all(bind=database.engine)

def test_pipeline():
    db = next(database.get_db())
    
    # 1. Upload/Ingest Repo
    repo_path = os.path.abspath("samples")
    print(f"Ingesting repo at: {repo_path}")
    repo = models.Repository(name="Test Repo", path=repo_path, status="ingested")
    db.add(repo)
    db.commit()
    db.refresh(repo)
    
    ingestion_service.scan_repository(repo.id, db)
    print(f"Found {db.query(models.File).filter(models.File.repo_id == repo.id).count()} files")
    
    # 2. Parse Repository
    files = db.query(models.File).filter(models.File.repo_id == repo.id).all()
    for file in files:
        parser_engine.parse_file(file.id, db)
    
    print(f"Found {db.query(models.Function).join(models.File).filter(models.File.repo_id == repo.id).count()} functions")
    
    # 3. Build Graph
    graph_builder.build_dependency_graph(repo.id, db)
    print(f"Built dependency graph")
    
    # 4. Optimize Context for a function (e.g., 'main_logic')
    func = db.query(models.Function).filter(models.Function.name == "main_logic").first()
    if func:
        print(f"Optimizing context for: {func.name}")
        opt_context = optimizer_service.optimize_context(func.id, db)
        print(f"Original Tokens: {opt_context.original_tokens}")
        print(f"Optimized Tokens: {opt_context.optimized_tokens}")
        print(f"Reduction: {opt_context.reduction_percentage:.2f}%")
        
        # 5. Generate Modernization
        print(f"Generating modernization...")
        output = llm_service.generate_modernization(func.id, opt_context.optimized_code, db)
        print(f"Modern Code Generated")
        print(f"Explanation: {output.explanation}")
    else:
        print("Function 'main_logic' not found")

if __name__ == "__main__":
    test_pipeline()
