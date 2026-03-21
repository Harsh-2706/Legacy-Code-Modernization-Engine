from sqlalchemy import Column, Integer, String, Text, ForeignKey, Float, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class Repository(Base):
    __tablename__ = "repositories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    path = Column(String)
    status = Column(String, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    files = relationship("File", back_populates="repository")
    metrics = relationship("Metric", back_populates="repository")

class File(Base):
    __tablename__ = "files"
    id = Column(Integer, primary_key=True, index=True)
    repo_id = Column(Integer, ForeignKey("repositories.id"))
    path = Column(String)
    content = Column(Text)
    classes = Column(Text, default="[]") # JSON string
    imports = Column(Text, default="[]") # JSON string
    
    repository = relationship("Repository", back_populates="files")
    functions = relationship("Function", back_populates="file")

class Function(Base):
    __tablename__ = "functions"
    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("files.id"))
    name = Column(String, index=True)
    start_line = Column(Integer)
    end_line = Column(Integer)
    code = Column(Text)
    is_entry_point = Column(Integer, default=0)
    
    file = relationship("File", back_populates="functions")
    outgoing_dependencies = relationship(
        "Dependency",
        foreign_keys="Dependency.caller_id",
        back_populates="caller"
    )
    incoming_dependencies = relationship(
        "Dependency",
        foreign_keys="Dependency.callee_id",
        back_populates="callee"
    )

class Dependency(Base):
    __tablename__ = "dependencies"
    id = Column(Integer, primary_key=True, index=True)
    caller_id = Column(Integer, ForeignKey("functions.id"))
    callee_id = Column(Integer, ForeignKey("functions.id"))
    
    caller = relationship("Function", foreign_keys=[caller_id], back_populates="outgoing_dependencies")
    callee = relationship("Function", foreign_keys=[callee_id], back_populates="incoming_dependencies")

class OptimizedContext(Base):
    __tablename__ = "optimized_contexts"
    id = Column(Integer, primary_key=True, index=True)
    function_id = Column(Integer, ForeignKey("functions.id"))
    original_tokens = Column(Integer)
    optimized_tokens = Column(Integer)
    reduction_percentage = Column(Float)
    latency = Column(Float)
    optimized_code = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class GeneratedOutput(Base):
    __tablename__ = "generated_outputs"
    id = Column(Integer, primary_key=True, index=True)
    function_id = Column(Integer, ForeignKey("functions.id"))
    modern_code = Column(Text)
    explanation = Column(Text)
    documentation = Column(Text)
    metrics = Column(Text) # JSON string for evaluation metrics
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Metric(Base):
    __tablename__ = "metrics"
    id = Column(Integer, primary_key=True, index=True)
    repository_id = Column(Integer, ForeignKey("repositories.id"))
    original_tokens = Column(Integer)
    compressed_tokens = Column(Integer)
    tokens_saved = Column(Integer)
    compression_ratio = Column(Float)
    latency_ms = Column(Float)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    repository = relationship("Repository", back_populates="metrics")

class Submission(Base):
    __tablename__ = "submissions"
    id = Column(Integer, primary_key=True, index=True)
    team_info = Column(String)
    repo_url = Column(String)
    project_description = Column(Text)
    tech_stack = Column(String)
    failure_narrative = Column(Text)
    quiz_score = Column(Integer)
    integrity_flags = Column(Text) # JSON string of flags
    files_analyzed = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
