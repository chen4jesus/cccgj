import os
import json
import base64
import time
import shutil
import subprocess
import sqlite3

def init_db(db_path):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS prompt_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            prompt TEXT,
            context TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            git_hash_before TEXT,
            git_hash_after TEXT
        )
    ''')
    conn.commit()
    conn.close()

def get_git_hash():
    try:
        # Get short hash
        return subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD']).strip().decode('utf-8')
    except Exception:
        return "unknown"

def log_prompt(db_path, prompt, context):
    try:
        git_hash = get_git_hash()
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        c.execute("INSERT INTO prompt_history (prompt, context, git_hash_before) VALUES (?, ?, ?)",
                  (prompt, context, git_hash))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[ERROR] Failed to log prompt: {e}")

def get_history(db_path, limit=20, offset=0):
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("SELECT * FROM prompt_history ORDER BY timestamp DESC LIMIT ? OFFSET ?", (limit, offset))
        rows = c.fetchall()
        history = [dict(row) for row in rows]
        
        c.execute("SELECT COUNT(*) FROM prompt_history")
        total = c.fetchone()[0]
        
        conn.close()
        return {"history": history, "total": total}
    except Exception as e:
        print(f"[ERROR] Failed to get history: {e}")
        return {"history": [], "total": 0}

def update_history_commit(db_path, history_id, commit_hash):
    try:
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        c.execute("UPDATE prompt_history SET git_hash_after = ? WHERE id = ?", (commit_hash, history_id))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"[ERROR] Failed to update history commit: {e}")
        return False

def handle_ai_request(data, db_path):
    """
    Handles the AI request:
    1. Logs the request to DB.
    2. Constructs the prompt.
    3. Calls the Claude CLI.
    """
    prompt = data.get('prompt', '')
    context = data.get('context', '')

    # Log to Database
    if db_path:
        log_prompt(db_path, prompt, context)

    # Check if Claude CLI exists
    if not shutil.which('claude'):
        print("[ERROR] 'claude' CLI not found in PATH")
        return {"success": False, "error": "CLAUDE_NOT_FOUND"}
    
    # Construct the full prompt for the agent
    full_message = f"Task: {prompt}\n\nContext HTML request:\n{context}\n\nPlease provide the corrected/updated HTML code based on the task."
    
    print(f"[AI Agent] Received Prompt: {prompt}")
    
    # Invoke Claude CLI
    try:
        process = subprocess.Popen(
            ['claude'], 
            stdin=subprocess.PIPE, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE,
            text=True,
            shell=True 
        )
        
        stdout, stderr = process.communicate(input=full_message)
        
        if process.returncode != 0:
            return {"success": False, "error": stderr or "Unknown error"}
        else:
            return {"success": True, "output": stdout}
    except Exception as e:
        print(f"[ERROR] Subprocess Exception: {e}")
        return {"success": False, "error": str(e)}
