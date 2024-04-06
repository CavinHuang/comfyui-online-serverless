
from scanner.githubUtils import clear_except_allowed_folder
from scanner.manager_copy import gitclone_install, run_script
import os
import json
import subprocess
from dotenv import load_dotenv

custom_node_path = os.path.join(os.path.dirname(__file__), "custom_nodes")
manager_path = os.path.join(custom_node_path, "ComfyUI-Manager")
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

def process_json(file_path):
    if (os.path.exists(file_path) == False):
        print("🔴file not found", file_path)
        gitclone_install(["https://github.com/ltdrdata/ComfyUI-Manager.git"])
    START_FROM = 2
    # START_FROM = 2
    try:
        with open(file_path, 'r') as file:
            data = json.load(file)
            for index, node in enumerate(data["custom_nodes"][START_FROM:]):
                print(f"🗂️🗂️No.{START_FROM + index} files", node['files'])
                repo = node['reference']
                if 'github' not in repo:
                    continue
                if repo.endswith('.git'):
                    repo = repo[:-4]
                if repo.endswith('/'):
                    repo = repo[:-1]
                repo_name = repo.split('/')[-1]
                print('repo name',repo_name)
                git_clone_url = repo + '.git' if not repo.endswith('.git') else repo
                clear_except_allowed_folder(custom_node_path, 'ComfyUI-Manager')
                gitclone_install([git_clone_url])
                run_script(['python', 'main.py'], cwd='.')
                print(f"\033[93m Done importing:{git_clone_url}, index {index} \033[0m", end='')  
    except Exception as e:
        return f"An error occurred: {e}"


process_json(os.path.join(manager_path, "custom-node-list.json"))
