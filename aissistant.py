import os
import json
import base64
import time
import shutil
import subprocess

def handle_ai_request(data, captures_dir):
    """
    Handles the AI request:
    1. Decodes and saves the image (if any).
    2. Constructs the prompt.
    3. Calls the Claude CLI.
    """
    prompt = data.get('prompt', '')
    context = data.get('context', '')
    image_data = data.get('image', None) # Base64 string

    # Handle Image Capture
    image_path_msg = ""
    if image_data:
        try:
            # Remove header if present (e.g., "data:image/png;base64,...")
            if "base64," in image_data:
                image_data = image_data.split("base64,")[1]
            
            img_bytes = base64.b64decode(image_data)
            filename = f"capture_{int(time.time())}.png"
            filepath = os.path.join(captures_dir, filename)
            
            with open(filepath, "wb") as f:
                f.write(img_bytes)
            
            image_path_msg = f"\n\n[System: A screenshot of the element has been saved to: {filepath} ]"
            print(f"[AI Agent] Saved screenshot to: {filepath}")
        except Exception as img_err:
            print(f"[ERROR] Failed to save screenshot: {img_err}")

    # Check if Claude CLI exists
    if not shutil.which('claude'):
        print("[ERROR] 'claude' CLI not found in PATH")
        return {"success": False, "error": "CLAUDE_NOT_FOUND"}
    
    # Construct the full prompt for the agent
    full_message = f"Task: {prompt}\n\nContext HTML request:\n{context}{image_path_msg}\n\nPlease provide the corrected/updated HTML code based on the task."
    
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
