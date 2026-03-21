import re
import networkx as nx
from sqlalchemy.orm import Session
from .. import models

def build_dependency_graph(repo_id: int, db: Session):
    # Get all functions for this repo
    functions = db.query(models.Function).join(models.File).filter(models.File.repo_id == repo_id).all()
    func_names = {f.name: f.id for f in functions}
    
    dependencies = []
    
    for caller in functions:
        # Search for calls in the function code
        # A simple call pattern: func_name(args)
        # Note: This will catch some false positives, but it's a good heuristic for legacy code.
        for callee_name, callee_id in func_names.items():
            if caller.name == callee_name:
                continue
            
            # Look for calls: \bcallee_name\s*\(
            if re.search(rf"\b{re.escape(callee_name)}\s*\(", caller.code):
                # Check if dependency already exists
                existing = db.query(models.Dependency).filter(
                    models.Dependency.caller_id == caller.id,
                    models.Dependency.callee_id == callee_id
                ).first()
                
                if not existing:
                    dep = models.Dependency(caller_id=caller.id, callee_id=callee_id)
                    db.add(dep)
                    dependencies.append(dep)
    
    db.commit()
    return dependencies

def get_transitive_dependencies(function_id: int, depth: int, db: Session):
    """
    Traverse the dependency graph to find indirect dependencies up to a certain depth.
    """
    G = nx.DiGraph()
    # Build graph from DB for this function's scope
    # For performance, we might want to pre-load the whole repo graph if it's small
    all_deps = db.query(models.Dependency).all()
    for dep in all_deps:
        G.add_edge(dep.caller_id, dep.callee_id)
    
    if function_id not in G:
        return [function_id]
        
    # BFS to find neighbors up to depth
    relevant_ids = {function_id}
    current_layer = {function_id}
    
    for _ in range(depth):
        next_layer = set()
        for node in current_layer:
            if node in G:
                for neighbor in G.neighbors(node):
                    if neighbor not in relevant_ids:
                        relevant_ids.add(neighbor)
                        next_layer.add(neighbor)
        current_layer = next_layer
        if not current_layer:
            break
            
    return list(relevant_ids)
