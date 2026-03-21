import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend import models

# Database setup
DATABASE_URL = "sqlite:///./sql_app.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

print("--- LATEST OPTIMIZED CONTEXT ---")
latest_opt = db.query(models.OptimizedContext).order_by(models.OptimizedContext.id.desc()).first()
if latest_opt:
    print(f"ID: {latest_opt.id}")
    print(f"Original Tokens: {latest_opt.original_tokens}")
    print(f"Optimized Tokens: {latest_opt.optimized_tokens}")
    print(f"Reduction: {latest_opt.reduction_percentage}%")
    print(f"Code Preview: {latest_opt.optimized_code[:200]}")
    print(f"Code Length (Chars): {len(latest_opt.optimized_code)}")
else:
    print("No OptimizedContext records found.")

print("\n--- LATEST METRIC ---")
latest_metric = db.query(models.Metric).order_by(models.Metric.id.desc()).first()
if latest_metric:
    print(f"ID: {latest_metric.id}")
    print(f"Original: {latest_metric.original_tokens}")
    print(f"Compressed: {latest_metric.compressed_tokens}")
    print(f"Saved: {latest_metric.tokens_saved}")
    print(f"Ratio: {latest_metric.compression_ratio}%")
else:
    print("No Metric records found.")

db.close()
