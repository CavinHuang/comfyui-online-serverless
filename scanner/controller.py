import datetime
import json
import os
import shutil
import subprocess
import os
import subprocess
from dotenv import load_dotenv
import os
from .manager_copy import run_script
import threading

comfy_path = os.path.dirname(os.path.dirname(__file__))
communication_file = os.path.join(comfy_path, 'communication_file.txt') 
custom_node_path = os.path.join(comfy_path, "custom_nodes")
manager_path = os.path.join(comfy_path, "custom_nodes", "ComfyUI-Manager")

load_dotenv(os.path.join(comfy_path, '.env.local'))

cur_git_repo = None
def run_main_py_and_wait(package_data:dict,index: int = 0):
    global cur_git_repo
    # print(f"😻git clone installing:{package_data['reference']}")
    if os.path.exists(communication_file):
        print("Removing communication file")
        os.remove(communication_file)
    os.chdir(comfy_path)
    try:
        cur_git_repo=package_data['title']
        cmd = ['python', 'main.py']  # Use 'python3' instead of 'python' if your system requires it
        # You can specify the current working directory (cwd) if needed, or use '.' for the current directory
        run_script(cmd, cwd='.')
    
    finally:
        # process.terminate()
        # process.wait()
        print(f"\033[93m Done importing:{package_data['reference']}\033[0m", end='')  
