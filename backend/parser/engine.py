import re
import json
import os
from sqlalchemy.orm import Session
import models

def parse_file(file_id: int, db: Session):
    file_obj = db.query(models.File).filter(models.File.id == file_id).first()
    if not file_obj:
        return None
    
    content = file_obj.content
    ext = os.path.splitext(file_obj.path)[1].lower()
    
    functions = []
    classes = []
    imports = []
    
    if ext in [".c", ".cpp", ".h"]:
        # Match includes
        includes = re.findall(r"^\s*#include\s*[<\"].*[>\"]", content, re.MULTILINE)
        imports.extend(includes)
        
        # Match classes and structs
        class_pattern = r"(class|struct)\s+(\w+)\s*[^{]*\{"
        for match in re.finditer(class_pattern, content):
            classes.append(match.group(2))
            
        # Basic C/C++ function parser
        pattern = r"(\w+)\s+([a-zA-Z_]\w*)\s*\([^)]*\)\s*\{"
        matches = re.finditer(pattern, content)
        for match in matches:
            func_name = match.group(2)
            if func_name in ["if", "for", "while", "catch", "switch"]:
                continue
            start_pos = match.start()
            start_line = content[:start_pos].count("\n") + 1
            
            depth = 0
            end_pos = -1
            for i in range(match.end() - 1, len(content)):
                if content[i] == '{':
                    depth += 1
                elif content[i] == '}':
                    depth -= 1
                    if depth == 0:
                        end_pos = i + 1
                        break
            
            if end_pos != -1:
                end_line = content[:end_pos].count("\n") + 1
                functions.append({
                    "name": func_name,
                    "start_line": start_line,
                    "end_line": end_line,
                    "code": content[start_pos:end_pos]
                })
    
    elif ext == ".java":
        # Match imports
        imp_matches = re.findall(r"^\s*import\s+[a-zA-Z0-9_\.*]+;", content, re.MULTILINE)
        imports.extend(imp_matches)
        
        # Match classes
        class_matches = re.findall(r"(?:public|private|protected|static|\s)*\s*class\s+(\w+)\s*[^{]*\{", content)
        classes.extend(class_matches)
        
        # Basic Java method parser
        pattern = r"(public|private|protected|static|\s)+\s+(\w+)\s+([a-zA-Z_]\w*)\s*\([^)]*\)\s*\{"
        matches = re.finditer(pattern, content)
        for match in matches:
            func_name = match.group(3)
            if func_name in ["if", "for", "while", "catch", "switch"]:
                continue
            start_pos = match.start()
            start_line = content[:start_pos].count("\n") + 1
            
            depth = 0
            end_pos = -1
            for i in range(match.end() - 1, len(content)):
                if content[i] == '{':
                    depth += 1
                elif content[i] == '}':
                    depth -= 1
                    if depth == 0:
                        end_pos = i + 1
                        break
            
            if end_pos != -1:
                end_line = content[:end_pos].count("\n") + 1
                functions.append({
                    "name": func_name,
                    "start_line": start_line,
                    "end_line": end_line,
                    "code": content[start_pos:end_pos]
                })

    elif ext == ".cbl":
        # Basic COBOL paragraph parser: Section name. or Paragraph name.
        pattern = r"^([ \t]*[A-Z0-9-]+)\."
        matches = re.finditer(pattern, content, re.MULTILINE)
        prev_match = None
        for match in matches:
            if prev_match:
                name = prev_match.group(1).strip()
                start_line = content[:prev_match.start()].count("\n") + 1
                end_line = content[:match.start()].count("\n") + 1
                functions.append({
                    "name": name,
                    "start_line": start_line,
                    "end_line": end_line,
                    "code": content[prev_match.start():match.start()]
                })
            prev_match = match
        
        if prev_match:
            name = prev_match.group(1).strip()
            start_line = content[:prev_match.start()].count("\n") + 1
            functions.append({
                "name": name,
                "start_line": start_line,
                "end_line": content.count("\n") + 1,
                "code": content[prev_match.start():]
            })

    # Save new json fields to file
    file_obj.classes = json.dumps(classes)
    file_obj.imports = json.dumps(imports)

    # Filter out trivial functions (less than 4 lines) unless they are 'main' or 'init'
    MIN_LINES = 4
    filtered_functions = []
    for func_data in functions:
        line_count = func_data["end_line"] - func_data["start_line"] + 1
        is_main = "main" in func_data["name"].lower() or "init" in func_data["name"].lower()
        if line_count >= MIN_LINES or is_main:
            filtered_functions.append(func_data)

    for func_data in filtered_functions:
        db_func = db.query(models.Function).filter_by(file_id=file_obj.id, name=func_data["name"]).first()
        if not db_func:
            db_func = models.Function(
                file_id=file_obj.id,
                name=func_data["name"],
                start_line=func_data["start_line"],
                end_line=func_data["end_line"],
                code=func_data["code"]
            )
            db.add(db_func)
        else:
            db_func.start_line = func_data["start_line"]
            db_func.end_line = func_data["end_line"]
            db_func.code = func_data["code"]
    
    db.commit()
    return filtered_functions
