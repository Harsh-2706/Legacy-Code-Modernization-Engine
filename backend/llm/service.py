import os
import json
import time
from sqlalchemy.orm import Session
import models

def generate_modernization(function_id: int, optimized_context: str, db: Session, model_name: str = "gemini-2.0-flash"):
    # Get original function for context
    func = db.query(models.Function).filter(models.Function.id == function_id).first()
    func_name = func.name if func else "unknown_function"

    # ─── PROMPT: Ask for PURE Python code only ────────────────────────────────
    code_prompt = f"""You are an expert Python 3.12 engineer.
Your ONLY task is to convert the following legacy code into modern Python 3.12+.

Legacy Code (function: '{func_name}'):
{optimized_context}

Rules:
- Use Python 3.12 features: `type` statement for type aliases, match/case, f-strings, type hints.
- The output MUST be runnable Python 3.12 code only.
- Do NOT wrap the output in JSON.
- Do NOT add markdown code fences (no ```python or ```).
- Do NOT add any explanation text before or after the code.
- Start directly with `import` statements or the first line of Python code.
"""

    # ─── PROMPT: Ask for explanation separately ───────────────────────────────
    explain_prompt = f"""Briefly explain (2-4 sentences) how you modernized the legacy function '{func_name}' to Python 3.12+, highlighting the key design decisions."""

    # Fallback chain - prioritize user-preferred models
    fallbacks = [model_name, "gemini-2.0-flash", "llama-3.1-8b-instant", "gpt-4o-mini", "gemini-1.5-flash"]
    chain = []
    for m in fallbacks:
        if m and m not in chain:
            chain.append(m)

    code_text = None
    explain_text = None
    successful_model = None
    error_log = []

    # ─── Model Execution ──────────────────────────────────────────────────────
    for model in chain:
        try:
            print(f"[LLM] Running modernization with {model}...")
            if model.startswith("gpt") and os.environ.get("OPENAI_API_KEY"):
                from openai import OpenAI
                client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
                resp = client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": "You are a Python 3.12 expert. Output ONLY raw Python code — no JSON, no markdown fences, no explanations."},
                        {"role": "user", "content": code_prompt}
                    ]
                )
                code_text = resp.choices[0].message.content
                resp2 = client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": "You are a helpful assistant. Be concise."},
                        {"role": "user", "content": explain_prompt}
                    ]
                )
                explain_text = resp2.choices[0].message.content
            elif model.startswith("llama") and os.environ.get("GROQ_API_KEY"):
                from openai import OpenAI
                # Groq is completely OpenAI-compatible
                client = OpenAI(api_key=os.environ.get("GROQ_API_KEY"), base_url="https://api.groq.com/openai/v1")
                resp = client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": "You are a Python 3.12 expert. Output ONLY raw Python code — no JSON, no markdown fences, no explanations."},
                        {"role": "user", "content": code_prompt}
                    ]
                )
                code_text = resp.choices[0].message.content
                resp2 = client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": "You are a helpful assistant. Be concise."},
                        {"role": "user", "content": explain_prompt}
                    ]
                )
                explain_text = resp2.choices[0].message.content

            elif model.startswith("gemini") and os.environ.get("GEMINI_API_KEY"):
                import google.generativeai as genai
                genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
                gemini_model = genai.GenerativeModel(model)
                resp = gemini_model.generate_content(code_prompt)
                code_text = resp.text
                resp2 = gemini_model.generate_content(explain_prompt)
                explain_text = resp2.text
            else:
                continue

            successful_model = model
            if code_text:
                break
        except Exception as e:
            err_msg = str(e)
            print(f"[LLM] Model {model} failed: {err_msg[:100]}")
            error_log.append(f"{model}: {err_msg[:50]}")
            continue

    if not code_text:
        err_out = '; '.join(error_log)
        if "429" in err_out or "exhausted" in err_out.lower() or "quota" in err_out.lower():
            fallback_code = (
                f"# [QUOTA LIMIT REACHED]\n"
                f"# The Gemini free tier limits you to 15 requests per minute.\n"
                f"# Please wait ~60 seconds and try again, or upgrade to a paid tier.\n"
                f"#\n"
                f"# Debug Errors: {err_out}\n\n"
                f"def {func_name}():\n"
                f"    pass\n"
            )
            explanation = "API Quota Exceeded (15 RPM limit). Please wait a minute and retry."
        else:
            fallback_code = (
                f"# ALL MODELS FAILED\n"
                f"# Errors: {err_out}\n\n"
                f"def {func_name}():\n"
                f"    raise NotImplementedError('Check API Keys.')\n"
            )
            explanation = "Modernization failed across all fallback models."

        return {
            "modern_code": fallback_code,
            "explanation": explanation,
            "documentation": f"Tested models: {', '.join(chain)}",
            "successful_model": "None"
        }

    # ─── Clean the code output ────────────────────────────────────────────────
    def clean_code(raw: str) -> str:
        """Strip any accidental JSON wrapper or markdown fences from the LLM response."""
        cleaned = raw.strip()

        # If the model accidentally returned JSON, extract modern_code from it
        if cleaned.startswith("{") and '"modern_code"' in cleaned:
            try:
                parsed = json.loads(cleaned)
                cleaned = parsed.get("modern_code", cleaned)
            except Exception:
                s = cleaned.find("{")
                e = cleaned.rfind("}")
                if s != -1 and e != -1:
                    try:
                        parsed = json.loads(cleaned[s:e+1])
                        cleaned = parsed.get("modern_code", cleaned)
                    except Exception:
                        pass

        # Strip markdown code fences
        if "```json" in cleaned:
            try:
                inner = cleaned.split("```json")[1].split("```")[0].strip()
                try:
                    parsed = json.loads(inner)
                    cleaned = parsed.get("modern_code", inner)
                except Exception:
                    cleaned = inner
            except Exception:
                pass
        elif "```python" in cleaned:
            cleaned = cleaned.split("```python")[1].split("```")[0].strip()
        elif cleaned.startswith("```") and "```" in cleaned[3:]:
            cleaned = cleaned.split("```")[1].split("```")[0].strip()
            lines = cleaned.splitlines()
            if lines and lines[0].strip().lower() in ("python", "py", "python3"):
                cleaned = "\n".join(lines[1:]).strip()

        return cleaned.strip()

    final_code = clean_code(code_text)
    final_explanation = (explain_text or "").strip() or f"Successfully modernized '{func_name}' to Python 3.12+ using {successful_model}."
    final_documentation = f"## {func_name} — Modernization\n\n**Model**: {successful_model}\n\n**Python Version**: 3.12+"

    result = {
        "modern_code": final_code,
        "explanation": final_explanation,
        "documentation": final_documentation,
        "successful_model": successful_model
    }

    # ─── Persistence ──────────────────────────────────────────────────────────
    try:
        db.query(models.GeneratedOutput).filter(models.GeneratedOutput.function_id == function_id).delete()
        output_db = models.GeneratedOutput(
            function_id=function_id,
            modern_code=result["modern_code"],
            explanation=result["explanation"],
            documentation=result["documentation"],
            metrics=json.dumps({"model": successful_model, "tokens": int(len(optimized_context) / 3.7)})
        )
        db.add(output_db)
        db.commit()
        db.refresh(output_db)
    except Exception as db_err:
        print(f"[LLM] DB persistence error: {db_err}")

    return result
