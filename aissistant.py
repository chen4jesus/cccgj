
import os
import json
import subprocess
import shutil
import sqlite3
import threading
import secrets
import time
from flask import Blueprint, request, jsonify

# Flask Blueprint
ai_bp = Blueprint('ai', __name__)

# Module Globals
DB_PATH = None
AI_JOBS = {}
AI_JOB_TIMEOUT = 300 # 5 minutes

def init(db_path):
    global DB_PATH
    DB_PATH = db_path
    init_db(db_path)

# --- Database & Helper Functions ---

def init_db(db_path):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS prompt_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            prompt TEXT,
            context TEXT,
            response TEXT,
            git_hash_before TEXT,
            git_hash_after TEXT
        )
    ''')
    
    # Schema Migration: Add job_id and job_status if missing
    try:
        c.execute("ALTER TABLE prompt_history ADD COLUMN job_id TEXT")
    except sqlite3.OperationalError:
        pass 
    try:
        c.execute("ALTER TABLE prompt_history ADD COLUMN job_status TEXT")
    except sqlite3.OperationalError:
        pass

    conn.commit()
    conn.close()

def get_git_hash():
    try:
        return subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD']).decode('utf-8').strip()
    except Exception:
        return "unknown"

def log_prompt(db_path, prompt, context, job_id=None, status='pending'):
    try:
        git_hash = get_git_hash()
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        c.execute("INSERT INTO prompt_history (prompt, context, git_hash_before, job_id, job_status) VALUES (?, ?, ?, ?, ?)",
                  (prompt, context, git_hash, job_id, status))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[ERROR] Failed to log prompt: {e}")

def update_job_status(db_path, job_id, status):
    try:
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        c.execute("UPDATE prompt_history SET job_status = ? WHERE job_id = ?", (status, job_id))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[ERROR] Failed to update job status: {e}")

def get_history(db_path, limit=20, offset=0):
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("SELECT COUNT(*) FROM prompt_history")
        total = c.fetchone()[0]
        c.execute("SELECT * FROM prompt_history ORDER BY timestamp DESC LIMIT ? OFFSET ?", (limit, offset))
        rows = c.fetchall()
        history = [dict(row) for row in rows]
        conn.close()
        return {"history": history, "total": total}
    except Exception as e:
        return {"history": [], "total": 0, "error": str(e)}

def update_history_commit(db_path, hist_id, commit_hash):
    try:
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        c.execute("UPDATE prompt_history SET git_hash_after = ? WHERE id = ?", (commit_hash, hist_id))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"[ERROR] Failed to update history commit: {e}")
        return False

def handle_ai_request(data, db_path, job_id=None):
    prompt = data.get('prompt', '')
    context = data.get('context', '')
    model = data.get('model', 'claude-3-opus-20240229') # Default to Opus

    # Log to Database
    if db_path:
        log_prompt(db_path, prompt, context, job_id, status='processing')

    if not shutil.which('claude'):
        return {
            "success": False, 
            "error": "Claude CLI not found. Please install anthracite-cli.", 
            "prompt_for_clipboard": f"Task: {prompt}\n\nContext HTML:\n{context}"
        }

    # Construct the full prompt (Context + Task)
    full_prompt = f"Context:\n{context}\n\nTask: {prompt}" if context else prompt

    # Refined CLI Command
    command = [
        'claude',
        'completion',
        '--model', model,
        '--prompt', full_prompt,
        '--system-prompt', 'You are a concise AI assistant who edits HTML code.',
        '--format', 'json'
    ]

    try:
        # Execute with timeout
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            check=True,
            timeout=45 # Increased slightly from 30 purely for network jitter
        )
        
        # Parse JSON output
        claude_output = json.loads(result.stdout)
        generated_text = claude_output.get('completion', '').strip()
        
        if not generated_text:
             generated_text = "No content returned from AI."

        return {
            "success": True, 
            "output": generated_text,
            "raw": claude_output
        }
        
    except subprocess.TimeoutExpired:
        return {"success": False, "error": "AI request timed out (45s limit)."}
        
    except subprocess.CalledProcessError as e:
        return {"success": False, "error": f"CLI execution failed: {e.stderr}"}
        
    except json.JSONDecodeError:
        return {"success": False, "error": "Failed to parse AI response as JSON."}
        
    except Exception as e:
        return {"success": False, "error": f"Unexpected error: {str(e)}"}

# --- Async Job Processing ---

def process_ai_job(job_id, data, db_path):
    try:
        print(f"[AI JOB {job_id}] Started")
        result = handle_ai_request(data, db_path, job_id=job_id)
        
        status = "completed" if result.get('success') else "failed"
        update_job_status(db_path, job_id, status)

        AI_JOBS[job_id] = {
            "status": "completed", 
            "result": result,
            "timestamp": time.time()
        }
        print(f"[AI JOB {job_id}] Completed")
    except Exception as e:
        print(f"[AI JOB {job_id}] Failed: {e}")
        try:
             update_job_status(db_path, job_id, "error")
        except: pass
        
        AI_JOBS[job_id] = {
            "status": "error", 
            "error": str(e),
            "timestamp": time.time()
        }

# --- Routes ---

@ai_bp.route('/api/ask-ai', methods=['POST'])
def api_ask_ai():
    data = request.json or {}
    job_id = secrets.token_hex(8)
    AI_JOBS[job_id] = {"status": "processing", "timestamp": time.time()}
    
    t = threading.Thread(target=process_ai_job, args=(job_id, data, DB_PATH))
    t.daemon = True
    t.start()
    
    return jsonify({
        "success": True, 
        "job_id": job_id, 
        "status": "processing",
        "message": "AI task started in background"
    }), 202

@ai_bp.route('/api/ai-status/<job_id>', methods=['GET'])
def api_ai_status(job_id):
    if job_id in AI_JOBS:
        return jsonify(AI_JOBS[job_id])
    return jsonify({"error": "Job not found"}), 404

@ai_bp.route('/api/ai/history', methods=['GET'])
def api_ai_history_route():
    # Auth Check (Rudimentary reuse of session logic check would be ideal, 
    # but since this is a blueprint, we might rely on the main app for auth or check cookie manually)
    # For now, let's replicate the simple check or assume protected by middleware if added.
    # To keep it simple and consistent:
    
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    offset = (page - 1) * limit

    result = get_history(DB_PATH, limit, offset)
    return jsonify({"success": True, **result})

@ai_bp.route('/api/ai/history/<hist_id>', methods=['PUT'])
def api_update_history_route(hist_id):
    data = request.json or {}
    commit_hash = data.get('commit_hash')
    
    if update_history_commit(DB_PATH, hist_id, commit_hash):
        return jsonify({"success": True})
    return jsonify({"success": False, "error": "Update failed"}), 500
