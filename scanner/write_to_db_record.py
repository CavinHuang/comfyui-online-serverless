import os
import json
import requests
import logging
import queue
import threading
import time
from typing import Dict, Any
from concurrent.futures import ThreadPoolExecutor

# package_report_url = "http://208.87.207.161:6000/api/comfy/plugins/node-def"
# node_report_url = "http://208.87.207.161:6000/api/comfy/nodes/node-def"

package_report_url = "https://www.comfydocs.site/api/comfy/plugins/node-def"
node_report_url = "https://www.comfydocs.site/api/comfy/nodes/node-def"

class RequestQueue:
    def __init__(self, max_workers=3, queue_size=100):
        self.queue = queue.Queue(maxsize=queue_size)
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
        self.failed_requests = queue.Queue()
        self._start_worker()

    def _make_request(self, url: str, data: Dict[str, Any]) -> None:
        for attempt in range(3):
            try:
                res = requests.post(
                    url,
                    data=data,
                    headers={'Authorization': 'Bearer ' + 'token'},
                    timeout=10
                )
                res.raise_for_status()
                logging.info(f"✅ Successfully posted data: {data.get('nodeType', '')}")
                time.sleep(0.1)  # 请求间隔
                return
            except Exception as e:
                if attempt == 2:  # 最后一次尝试失败
                    logging.error(f"❌ Failed after 3 attempts: {str(e)}, data: {data}")
                    self.failed_requests.put((url, data))
                    return
                time.sleep(1 * (attempt + 1))
                continue

    def _start_worker(self):
        def worker():
            while True:
                try:
                    url, data = self.queue.get()
                    self._make_request(url, data)
                except Exception as e:
                    logging.error(f"Worker error: {str(e)}")
                finally:
                    self.queue.task_done()

        # 启动工作线程
        for _ in range(3):  # 创建3个工作线程
            thread = threading.Thread(target=worker, daemon=True)
            thread.start()

    def add_request(self, url: str, data: Dict[str, Any]):
        self.queue.put((url, data))

    def wait_completion(self):
        self.queue.join()

    def get_failed_requests(self):
        failed = []
        while not self.failed_requests.empty():
            failed.append(self.failed_requests.get())
        return failed

# 创建全局请求队列
request_queue = RequestQueue()

def put_node_package_ddb(item):
    postData = {
        "packageID": item['id'],
        "gitRepo": item['gitRepo'],
        "nodeDefs": item['nodeDefs'],
        "nameID": item['nameID'],
        "latestCommit": item['latestCommit']
    }
    # 转换为JSON字符串并进行转义处理
    request_queue.add_request(package_report_url, postData)

def put_node_ddb(item):
    folderPaths = []
    if 'folderPaths' in item:
      folderPaths = item['folderPaths']
    postData = {
        "packName": item['packName'],
        "nodeName": item['nodeType'],
        "nodeID": item['id'],
        "nodeType": item['nodeType'],
        "nodeDef": item['nodeDef'],
        "folderPaths": folderPaths,
        "latestCommit": item['latestCommit']
    }
    # 转换为JSON字符串并进行转义处理
    request_queue.add_request(node_report_url, json.dumps(postData))

######v3

def custom_serializer(obj):
    """Convert non-serializable objects."""
    if isinstance(obj, (list, tuple, set)):
        return list(obj)  # Convert tuples and sets to lists
    elif isinstance(obj, dict):
        # Recursively apply to dictionary entries
        return {str(key): custom_serializer(value) for key, value in obj.items()}
    else:
        return obj

from .githubUtils import get_repo_user_and_name
from decimal import Decimal
import time
from  scanner.analyze_node_input import analyze_class

def write_to_db_record(input_dict):
    time_before = input_dict['time_before']
    import_time = time.perf_counter() - time_before
    NODE_CLASS_MAPPINGS = input_dict['NODE_CLASS_MAPPINGS']
    NODE_DISPLAY_NAME_MAPPINGS = input_dict['NODE_DISPLAY_NAME_MAPPINGS']
    cur_node_package = input_dict['cur_node_package']
    module_path = input_dict['module_path']
    prev_nodes = input_dict['prev_nodes']
    success = input_dict['success']
    if 'ComfyUI-Manager' in module_path:
        return
    nodes_count = len(NODE_CLASS_MAPPINGS) - len(prev_nodes)

    # save_base_nodes_to_ddb(NODE_CLASS_MAPPINGS, input_dict)

    # print('🍻 nodes_count',nodes_count, 'cur_node_package',cur_node_package)
    # logging.info(f"🍻 nodes_count => {nodes_count} cur_node_package => {cur_node_package}")
    if not os.path.isdir(module_path):
        return
    username, repo_name, default_branch_name, latest_commit = get_repo_user_and_name(module_path)
    packageID = username + '_' + repo_name
    custom_node_defs = {}
    for name in NODE_CLASS_MAPPINGS:
        try:
            if name not in prev_nodes:
                logging.info(f"🍻 +++++++++name => {name}")
                # paths = analyze_class(NODE_CLASS_MAPPINGS[name])
                # all_node = fetch_node_info()
                node_def = node_info(input_dict, name)
                data = {
                    "id": name+"~"+packageID,
                    "packName": repo_name,
                    "nodeType": name,
                    "nodeDef": json.dumps(node_def),
                    "packageID": packageID,
                    "gitRepo": username + '/' + repo_name,
                    "latestCommit": latest_commit}
                custom_node_defs[name] = node_def
                # if paths is not None and len(paths) > 0:
                #     data['folderPaths'] = json.dumps(paths, default=custom_serializer)
                put_node_ddb(data)
        except Exception as e:
            print("❌analyze imported node: error",e)
    put_node_package_ddb({
        **cur_node_package,
        'id': packageID,
        'gitRepo': username + '/' + repo_name,
        'gitHtmlUrl': 'https://github.com/'+username + '/' + repo_name,
        'nameID': repo_name,
        'authorID': 'admin',
        'status': 'IMPORT_'+ ('SUCCESS' if success else 'FAILED'),
        'defaultBranch': default_branch_name,
        'totalNodes':nodes_count,
        "importTime":str(import_time),
        'nodeDefs': json.dumps(custom_node_defs),
        "latestCommit": latest_commit
    })

    # 等待所有请求完成
    request_queue.wait_completion()

    # 检查失败的请求
    failed_requests = request_queue.get_failed_requests()
    if failed_requests:
        logging.error(f"Failed requests: {len(failed_requests)}")
        # 可以选择重试失败的请求或将其保存到文件中

# For COMFYUI BASE NODES
def save_base_nodes_to_ddb(NODE_CLASS_MAPPINGS, input_dict):
    baseNodeDefs = {}

    username, repo_name, default_branch_name, latest_commit = get_repo_user_and_name('.')

    print('🍻 username',username, 'repo_name',repo_name, 'default_branch_name',default_branch_name, 'latest_commit',latest_commit)
    for name in NODE_CLASS_MAPPINGS:
        # paths = analyze_class(NODE_CLASS_MAPPINGS[name])
        print('🍻 name',name)
        node_def = node_info(input_dict, name)
        data = {
            "id": name+"~"+'comfyanonymous_ComfyUI',
            "nodeType": name,
            "packName": 'comfyanonymous/ComfyUI',
            "nodeDef": json.dumps(node_def),
            "packageID": 'comfyanonymous_ComfyUI',
            "gitRepo": 'comfyanonymous/ComfyUI',
            "latestCommit": 'master',

          }
        baseNodeDefs[name] = node_def
        # if paths is not None and len(paths) > 0:
        #     data['folderPaths'] = json.dumps(paths, default=custom_serializer)
        put_node_ddb(data)

    put_node_package_ddb({
                    'id': 'comfyanonymous_ComfyUI',
                    'gitRepo': "comfyanonymous/ComfyUI",
                    'gitHtmlUrl': 'https://github.com/comfyanonymous/ComfyUI',
                    'nameID': 'ComfyUI',
                    'authorID': 'admin',
                    'status': 'IMPORT_SUCCESS',
                    'defaultBranch': 'master',
                    'totalNodes':len(NODE_CLASS_MAPPINGS),
                    'nodeDefs': json.dumps(baseNodeDefs),
                    "latestCommit": 'master'
                })

# copied from server.py
def node_info(input_dict, node_class:str):
    NODE_CLASS_MAPPINGS = input_dict['NODE_CLASS_MAPPINGS']
    NODE_DISPLAY_NAME_MAPPINGS = input_dict['NODE_DISPLAY_NAME_MAPPINGS']
    obj_class = NODE_CLASS_MAPPINGS[node_class]
    info = {}
    info['input'] = obj_class.INPUT_TYPES()
    info['output'] = obj_class.RETURN_TYPES
    info['output_is_list'] = obj_class.OUTPUT_IS_LIST if hasattr(obj_class, 'OUTPUT_IS_LIST') else [False] * len(obj_class.RETURN_TYPES)
    info['output_name'] = obj_class.RETURN_NAMES if hasattr(obj_class, 'RETURN_NAMES') else info['output']
    info['name'] = node_class
    info['display_name'] = NODE_DISPLAY_NAME_MAPPINGS[node_class] if node_class in NODE_DISPLAY_NAME_MAPPINGS.keys() else node_class
    info['description'] = obj_class.DESCRIPTION if hasattr(obj_class,'DESCRIPTION') else ''
    info['category'] = 'sd'
    if hasattr(obj_class, 'OUTPUT_NODE') and obj_class.OUTPUT_NODE == True:
        info['output_node'] = True
    else:
        info['output_node'] = False

    if hasattr(obj_class, 'CATEGORY'):
        info['category'] = obj_class.CATEGORY
    return info


import json
from urllib.request import urlopen
from urllib.error import URLError, HTTPError

def fetch_node_info():
    url = "http://localhost:8188/object_info"

    try:
        with urlopen(url) as response:
            if response.status == 200:
                data = json.loads(response.read().decode())
                return data
            else:
                print(f"Failed to fetch node info. Status code: {response.status}")
                return None
    except HTTPError as e:
        print(f"HTTP Error: {e.code} - {e.reason}")
        return None
    except URLError as e:
        print(f"URL Error: {e.reason}")
        return None
