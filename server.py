
import os
import secrets
import sqlite3
import time
import json
import datetime
import random
import threading
import shutil
import urllib.parse
from flask import Flask, request, jsonify, send_from_directory, make_response, abort
import aissistant

app = Flask(__name__, static_url_path='', static_folder=None)

# Configuration
PORT = int(os.getenv('PORT', 8000))
DB_FILE = os.getenv('DB_FILE', 'churchdata.db')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'admin123')
UPLOAD_DIR = os.path.join(os.getcwd(), 'upload')
BACKUP_DIR = os.path.join(os.getcwd(), 'backups')

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)
if not os.path.exists(BACKUP_DIR):
    os.makedirs(BACKUP_DIR)

# Global Stores
SESSIONS = {}
SESSION_TIMEOUT = 3600  # 1 hour

CAPTCHA_SESSIONS = {}
CAPTCHA_TIMEOUT = 600 # 10 minutes

# Set Working Directory
web_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(web_dir)

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT,
            phone TEXT,
            message TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

# --- Helper Functions ---

def is_authenticated_check():
    token = request.cookies.get('session_token')
    if not token or token not in SESSIONS:
        return False
    if time.time() - SESSIONS[token] > SESSION_TIMEOUT:
        del SESSIONS[token]
        return False
    SESSIONS[token] = time.time() 
    return True

# --- Routes ---

# 1. Static Files (Catch-All)
@app.route('/')
def serve_index():
    return send_from_directory(web_dir, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    # Security check is largely handled by send_from_directory
    return send_from_directory(web_dir, path)

# 2. Admin Auth & pages
@app.route('/admin/login.html')
@app.route('/admin/login')
def admin_login_page():
    return send_from_directory(os.path.join(web_dir, 'admin'), 'login.html')

@app.route('/admin')
@app.route('/admin/')
@app.route('/admin/<path:path>')
def admin_pages(path='index.html'):
    if not is_authenticated_check():
        return make_response('', 302, {'Location': '/admin/login.html'})
    return send_from_directory(os.path.join(web_dir, 'admin'), path)

# 3. API Handlers

@app.route('/api/admin/verify', methods=['GET'])
def api_verify():
    return jsonify({"authenticated": is_authenticated_check()})

@app.route('/api/admin/login', methods=['POST'])
def api_login():
    data = request.json or {}
    password = data.get('password', '')
    
    if password == ADMIN_PASSWORD:
        token = secrets.token_hex(16)
        SESSIONS[token] = time.time()
        resp = make_response(jsonify({"success": True}))
        resp.set_cookie('session_token', token, httponly=True, path='/')
        return resp
    else:
        return jsonify({"success": False, "error": "Invalid password"}), 401

@app.route('/api/admin/messages', methods=['GET'])
def api_get_messages():
    if not is_authenticated_check(): return jsonify({"error": "Unauthorized"}), 401
    
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 10))
    offset = (page - 1) * limit

    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM messages")
    total = c.fetchone()[0]
    
    c.execute("SELECT * FROM messages ORDER BY timestamp DESC LIMIT ? OFFSET ?", (limit, offset))
    rows = c.fetchall()
    messages = [dict(row) for row in rows]
    conn.close()
    
    return jsonify({
        "success": True, 
        "messages": messages,
        "total": total,
        "page": page,
        "limit": limit
    })

@app.route('/api/admin/messages/<msg_id>', methods=['PUT'])
def api_update_message(msg_id):
    if not is_authenticated_check(): return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json or {}
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone')
    message = data.get('message')

    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("UPDATE messages SET name=?, email=?, phone=?, message=? WHERE id=?", 
              (name, email, phone, message, msg_id))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route('/api/admin/messages/<msg_id>', methods=['DELETE'])
def api_delete_message(msg_id):
    if not is_authenticated_check(): return jsonify({"error": "Unauthorized"}), 401
    
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("DELETE FROM messages WHERE id = ?", (msg_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route('/api/admin/files', methods=['GET'])
def api_get_files():
    if not is_authenticated_check(): return jsonify({"error": "Unauthorized"}), 401
    
    files = []
    if os.path.exists(UPLOAD_DIR):
        for f in os.listdir(UPLOAD_DIR):
            full_path = os.path.join(UPLOAD_DIR, f)
            if os.path.isfile(full_path):
                stats = os.stat(full_path)
                files.append({
                    "name": f,
                    "size": stats.st_size,
                    "modified": stats.st_mtime
                })
    return jsonify({"success": True, "files": files})

@app.route('/api/admin/files/<path:filename>', methods=['DELETE'])
def api_delete_file(filename):
    if not is_authenticated_check(): return jsonify({"error": "Unauthorized"}), 401
    
    filename = urllib.parse.unquote(filename)
    clean_name = os.path.basename(filename)
    file_path = os.path.join(UPLOAD_DIR, clean_name)
    
    if os.path.exists(file_path):
        os.remove(file_path)
        return jsonify({"success": True})
    else:
        return jsonify({"success": False, "error": "File not found"}), 404

@app.route('/api/admin/upload', methods=['POST'])
def api_upload():
    if not is_authenticated_check(): return jsonify({"error": "Unauthorized"}), 401
    
    uploaded_file = None
    for key in request.files:
        uploaded_file = request.files[key]
        break
    
    if uploaded_file and uploaded_file.filename:
        original_filename = uploaded_file.filename
        safe_name = os.path.basename(original_filename).replace(' ', '_')
        file_path = os.path.join(UPLOAD_DIR, safe_name)
        uploaded_file.save(file_path)
        print(f"[ADMIN] Uploaded file: {safe_name}")
        return jsonify({"success": True, "url": f"upload/{safe_name}"})
    
    return jsonify({"success": False, "error": "No file uploaded"}), 400

@app.route('/api/admin/save-page', methods=['POST'])
def api_save_page():
    if not is_authenticated_check(): return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json or {}
    page_name = data.get('page')
    content = data.get('content')
    
    if not page_name or not content:
        return jsonify({"success": False, "error": "Missing page or content"}), 400

    clean_name = os.path.basename(page_name)
    if not clean_name.endswith('.html'):
         return jsonify({"success": False, "error": "Only HTML files allowed"}), 403
    
    file_path = os.path.join(web_dir, clean_name)

    # Backup
    if os.path.exists(file_path):
        timestamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
        backup_name = f"{clean_name}.{timestamp}.bak"
        backup_path = os.path.join(BACKUP_DIR, backup_name)
        try:
            shutil.copy2(file_path, backup_path)
            print(f"[BACKUP] Created backup: {backup_name}")
        except Exception as e:
            print(f"[WARNING] Backup failed: {e}")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"[ADMIN] Updated file: {clean_name}")
    return jsonify({"success": True})

# 4. Public APIs (Contact & Captcha)

@app.route('/api/captcha', methods=['GET'])
def api_get_captcha():
    n1 = random.randint(1, 10)
    n2 = random.randint(1, 10)
    answer = str(n1 + n2)
    token = secrets.token_hex(16)
    
    CAPTCHA_SESSIONS[token] = {
        "answer": answer,
        "timestamp": time.time()
    }
    
    if random.randint(0, 10) == 0:
         keys_to_del = [k for k, v in CAPTCHA_SESSIONS.items() if time.time() - v['timestamp'] > CAPTCHA_TIMEOUT]
         for k in keys_to_del: del CAPTCHA_SESSIONS[k]

    return jsonify({
        "success": True, 
        "token": token,
        "question": f"{n1} + {n2} = ?"
    })

@app.route('/api/contact', methods=['POST'])
def api_contact():
    data = request.json or {}
    name = data.get('name', '')
    email = data.get('email', '')
    phone = data.get('phone', '')
    message = data.get('message', '')
    
    # Bot Prevention
    honeypot = data.get('website', '')
    math_ans = data.get('math_challenge', '')
    captcha_token = data.get('captcha_token', '')

    try:
        if honeypot: raise Exception("Spam detected (honeypot)")

        if not captcha_token or captcha_token not in CAPTCHA_SESSIONS:
             raise Exception("Invalid or expired captcha. Please refresh.")
        
        stored_data = CAPTCHA_SESSIONS[captcha_token]
        if time.time() - stored_data['timestamp'] > CAPTCHA_TIMEOUT:
            del CAPTCHA_SESSIONS[captcha_token]
            raise Exception("Captcha expired.")

        if str(math_ans).strip() != stored_data['answer']:
             raise Exception("Incorrect math answer.")
        
        del CAPTCHA_SESSIONS[captcha_token]

        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("INSERT INTO messages (name, email, phone, message) VALUES (?, ?, ?, ?)",
                  (name, email, phone, message))
        conn.commit()
        conn.close()
        
        return jsonify({"success": True, "message": "Message received"})
        
    except Exception as e:
        print(f"[CONTACT ERROR] {e}")
        return jsonify({"success": False, "error": str(e)}), 500

# 5. Register AI Blueprint
app.register_blueprint(aissistant.ai_bp)

if __name__ == "__main__":
    init_db()
    # Initialize AI Module with DB
    aissistant.init(DB_FILE)
    
    print(f"Admin Password: {ADMIN_PASSWORD}")
    print(f"Serving at http://localhost:{PORT}")
    app.run(port=PORT, host='0.0.0.0', threaded=True)
