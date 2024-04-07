import asyncio
import server
from aiohttp import web
import aiohttp
import json
from urllib.parse import urlencode
from urllib.request import urlopen
import os
import folder_paths
import shutil
import sys
import time

NODE_CLASS_MAPPINGS = {}
__all__ = ['NODE_CLASS_MAPPINGS']
version = "V1.0.0"

comfy_path = os.path.dirname(folder_paths.__file__)
custom_node_path = os.path.join(comfy_path, 'custom_nodes')

@server.PromptServer.instance.routes.post("/scanner/scan_git_url")
async def scan_node_package(request):
    try:
        reqData = await request.json()
        gitUrl = reqData['gitUrl']

        base_url = f"{request.url.scheme}://{request.url.host}:{request.url.port}"  # Get the base URL (origin) with port number from the current request

        print(f"🗂️🗂️ url:", gitUrl)
        if 'github' not in gitUrl:
            return web.Response(text=json.dumps({"error": "Invalid repository URL"}), status=400)
        if gitUrl.endswith('.git'):
            gitUrl = gitUrl[:-4]
        if gitUrl.endswith('/'):
            gitUrl = gitUrl[:-1]
        git_url = gitUrl + '.git'
        clear_except_allowed_folder(custom_node_path, ['ComfyUI-Manager'])
        
        # Construct the URL with query parameters
        query_params = urlencode({'url': git_url})
        url = f"{base_url}/customnode/install/git_url?{query_params}"
        print(f"comfyui-manager install request: {url}")
        time_before = time.perf_counter()
        status, response_text = await asyncGetRequest(url)
        time_after = time.perf_counter()

        return web.Response(text=json.dumps({"install_time": time_after - time_before, "success": status==200}), content_type='application/json')

    except Exception as e:
        print('🔴🔴Error', e)
        return web.Response(text=json.dumps({"error": str(e)}), status=500)

def restart():
    try:
        sys.stdout.close_log()
    except Exception as e:
        pass

    return os.execv(sys.executable, [sys.executable] + sys.argv)

async def asyncGetRequest(url):
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            # You can adjust the return to include more details as needed
            return response.status, await response.text()

def clear_except_allowed_folder(path, allowedFolders):
    """
    Clears everything in the specified path except for the allowedFolder.
    
    :param path: Path to the directory to clear.
    :param allowedFolder: The name of the folder to keep.
    """
    # Make sure the path is a directory
    if not os.path.isdir(path):
        print(f"The provided path {path} is not a directory.")
        return
    current_file_dir = os.path.dirname(os.path.abspath(__file__))

    # Iterate through items in the directory
    for item in os.listdir(path):
        item_path = os.path.join(path, item)
        # Check if the current item is the allowedFolder
        if item in allowedFolders or item_path == current_file_dir:
            continue  # Skip the allowedFolder
        
        # If item is a directory, remove it and its contents
        if os.path.isdir(item_path):
            shutil.rmtree(item_path)
            print(f"Removed directory: {item_path}")
        # If item is a file, remove it
        else:
            os.remove(item_path)
            print(f"Removed file: {item_path}")