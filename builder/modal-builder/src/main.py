from typing import  Dict, List, Set
from pydantic import BaseModel
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.logger import logger as fastapi_logger
import os
from enum import Enum
import json
import time
from contextlib import asynccontextmanager
import asyncio
import threading
import logging
from fastapi.logger import logger as fastapi_logger
import requests
from urllib.parse import parse_qs
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp, Scope, Receive, Send

import weakref
import aiohttp

# 配置日志记录器
gunicorn_error_logger = logging.getLogger("gunicorn.error")
gunicorn_logger = logging.getLogger("gunicorn")
uvicorn_access_logger = logging.getLogger("uvicorn.access")
uvicorn_access_logger.handlers = gunicorn_error_logger.handlers

fastapi_logger.handlers = gunicorn_error_logger.handlers

# 根据运行环境设置日志级别
if __name__ != "__main__":
    fastapi_logger.setLevel(gunicorn_logger.level)
else:
    fastapi_logger.setLevel(logging.DEBUG)

logger = logging.getLogger("uvicorn")
logger.setLevel(logging.INFO)

# 记录最后活动时间和超时时间
last_activity_time = time.time()
global_timeout = 60 * 4

# 存储机器ID和WebSocket连接的映射
machine_id_websocket_dict = {}
machine_id_status = {}

# 获取Fly.io实例ID
fly_instance_id = os.environ.get('FLY_ALLOC_ID', 'local').split('-')[0]


class FlyReplayMiddleware(BaseHTTPMiddleware):
    """
    如果fly.io负载均衡器选择了错误的实例,使用fly-replay头重新发送请求到正确的实例

    仅当正确的实例作为query_string参数提供时有效
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        target_instance = query_params.get(
            'fly_instance_id', [fly_instance_id])[0]

        async def send_wrapper(message):
            if target_instance != fly_instance_id:
                if message['type'] == 'websocket.close' and 'Invalid session' in message['reason']:
                    # fly.io只在websocket被接受时查看fly-replay头
                    message = {'type': 'websocket.accept'}
                if 'headers' not in message:
                    message['headers'] = []
                message['headers'].append(
                    [b'fly-replay', f'instance={target_instance}'.encode()])
            await send(message)
        await self.app(scope, receive, send_wrapper)


# 检查不活动状态的异步函数
async def check_inactivity():
    global last_activity_time
    while True:
        if time.time() - last_activity_time > global_timeout:
            if len(machine_id_status) == 0:
                logger.info(f"No activity for {global_timeout} seconds, but keeping server alive...")
                last_activity_time = time.time()  # 重置计时器
        await asyncio.sleep(1)


# 添加线程跟踪器
class ThreadTracker:
    def __init__(self):
        self.active_threads: Set[threading.Thread] = set()
        self._lock = threading.Lock()

    def add_thread(self, thread: threading.Thread):
        with self._lock:
            self.active_threads.add(thread)

    def remove_thread(self, thread: threading.Thread):
        with self._lock:
            self.active_threads.discard(thread)

    def cleanup(self):
        with self._lock:
            for thread in list(self.active_threads):
                if not thread.is_alive():
                    self.active_threads.discard(thread)

# 创建全局线程跟踪器
thread_tracker = ThreadTracker()

class AsyncLoopThread(threading.Thread):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.loop = None
        self._stop_event = threading.Event()

    def run(self):
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)
        try:
            self.loop.run_until_complete(self._run_with_cleanup())
        finally:
            self.loop.close()
            thread_tracker.remove_thread(self)

    async def _run_with_cleanup(self):
        while not self._stop_event.is_set():
            await asyncio.sleep(0.1)

    def stop(self):
        self._stop_event.set()
        if self.loop:
            self.loop.call_soon_threadsafe(self.loop.stop)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动检查不活动状态的线程
    inactivity_thread = run_in_new_thread(check_inactivity())
    try:
        yield
    finally:
        # 清理所有活动线程
        logger.info("Cleaning up threads...")
        if inactivity_thread and inactivity_thread.is_alive():
            inactivity_thread.stop()
            inactivity_thread.join(timeout=5)
        thread_tracker.cleanup()
        logger.info("Threads cleaned up")

# 初始化FastAPI应用
app = FastAPI(lifespan=lifespan)
app.add_middleware(FlyReplayMiddleware)
# MODAL_ORG = os.environ.get("MODAL_ORG")


@app.get("/")
def read_root():
    global last_activity_time
    last_activity_time = time.time()
    logger.info(f"Extended inactivity time to {global_timeout}")
    return {"Hello": "World"}

# 创建/create POST路由,接收JSON格式:
# {
#     name: "my first image",
#     deps: {
#         "comfyui": "d0165d819afe76bd4e6bdd710eb5f3e571b6a804",
#         "git_custom_nodes": {
#             "https://github.com/cubiq/ComfyUI_IPAdapter_plus": {
#                 "hash": "2ca0c6dd0b2ad64b1c480828638914a564331dcd",
#                 "disabled": true
#             },
#             "https://github.com/ltdrdata/ComfyUI-Manager.git": {
#                 "hash": "9c86f62b912f4625fe2b929c7fc61deb9d16f6d3",
#                 "disabled": false
#             },
#         },
#         "file_custom_nodes": []
#     }
# }


# 定义数据模型
class GitCustomNodes(BaseModel):
    hash: str
    disabled: bool

class FileCustomNodes(BaseModel):
    filename: str
    disabled: bool


class Snapshot(BaseModel):
    comfyui: str
    git_custom_nodes: Dict[str, GitCustomNodes]
    file_custom_nodes: List[FileCustomNodes]

class Model(BaseModel):
    name: str
    type: str
    base: str
    save_path: str
    description: str
    reference: str
    filename: str
    url: str


class GPUType(str, Enum):
    T4 = "T4"
    A10G = "A10G"
    A100 = "A100"
    L4 = "L4"

class CustomNode(BaseModel):
    url: str
    directory: str

class Item(BaseModel):
    machine_id: str
    name: str
    snapshot: Snapshot
    models: List[Model]
    callback_url: str
    custom_nodes: List[CustomNode]
    # gpu: GPUType = Field(default=GPUType.T4)

    # @field_validator('gpu')
    # @classmethod
    # def check_gpu(cls, value):
    #     if value not in GPUType.__members__:
    #         raise ValueError(
    #             f"Invalid GPU option. Choose from: {', '.join(GPUType.__members__.keys())}")
    #     return GPUType(value)


# WebSocket端点处理
@app.websocket("/ws/{machine_id}")
async def websocket_endpoint(websocket: WebSocket, machine_id: str):
    await websocket.accept()
    machine_id_websocket_dict[machine_id] = websocket
    # 发送现有日志
    if machine_id in machine_logs_cache:
        combined_logs = "\n".join(
            log_entry['logs'] for log_entry in machine_logs_cache[machine_id])
        await websocket.send_text(json.dumps({"event": "LOGS", "data": {
            "machine_id": machine_id,
            "logs": combined_logs,
            "timestamp": time.time()
        }}))
    try:
        while True:
            data = await websocket.receive_text()
            global last_activity_time
            last_activity_time = time.time()
            logger.info(f"Extended inactivity time to {global_timeout}")
            # 可以在这里处理接收到的消息
    except WebSocketDisconnect:
        if machine_id in machine_id_websocket_dict:
            machine_id_websocket_dict.pop(machine_id)

main_task_progress = None
# 使用字典管理每个机器的任务
machine_tasks = {}

# 创建机器的POST端点
@app.post("/create")
async def create_machine(item: Item):
    logger.info(f"Creating machine {item.machine_id}")
    machine_id = item.machine_id

    # 如果已有任务在运行，返回错误
    if machine_id in machine_tasks and not machine_tasks[machine_id].done():
        return JSONResponse(
            status_code=400,
            content={"error": "Build already in progress"}
        )

    try:
        # 创建新的任务并存储
        task = asyncio.create_task(build_logic(item))
        machine_tasks[machine_id] = task

        # 立即返回响应，不等待构建完成
        return JSONResponse(
            status_code=200,
            content={
                "message": "Build Queued",
                "build_machine_instance_id": fly_instance_id
            }
        )
    except Exception as e:
        logger.error(f"Error creating machine: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to create machine: {str(e)}"}
        )


class StopAppItem(BaseModel):
    machine_id: str
    callback_url: str


def find_app_id(app_list, app_name):
    print(app_list, '================')
    for app in app_list:
        if app['Description'] == app_name:
            return app['App ID']
    return None

# 停止应用的POST端点
@app.post("/stop-app")
async def stop_app(item: StopAppItem):
    # cmd = f"modal app list | grep {item.machine_id} | awk -F '│' '{{print $2}}'"
    cmd = f"modal app list --json"

    env = os.environ.copy()
    env["COLUMNS"] = "10000"  # 设置大宽度值
    find_id_process = await asyncio.subprocess.create_subprocess_shell(cmd,
                                                                      stdout=asyncio.subprocess.PIPE,
                                                                      stderr=asyncio.subprocess.PIPE,
                                                                      env=env)
    await find_id_process.wait()

    stdout, stderr = await find_id_process.communicate()
    if stdout:
        app_id = stdout.decode().strip()
        app_list = json.loads(app_id)
        app_id = find_app_id(app_list, item.machine_id)
        logger.info(f"cp_process stdout: {app_id}")
    if stderr:
        logger.info(f"cp_process stderr: {stderr.decode()}")

    cp_process = await asyncio.subprocess.create_subprocess_exec("modal", "app", "stop", app_id,
                                                                 stdout=asyncio.subprocess.PIPE,
                                                                 stderr=asyncio.subprocess.PIPE,)
    await cp_process.wait()
    logger.info(f"Stopping app {item.machine_id}")
    stdout, stderr = await cp_process.communicate()
    if stdout:
        logger.info(f"cp_process stdout: {stdout.decode()}")
    if stderr:
        logger.info(f"cp_process stderr: {stderr.decode()}")

    if cp_process.returncode == 0:
        requests.post(item.callback_url, json={
                      "machine_id": item.machine_id, "status": "success"})
        return JSONResponse(status_code=200, content={"status": "success"})
    else:
        requests.post(item.callback_url, json={
                      "machine_id": item.machine_id, "status": "error", "error": stderr.decode()})
        return JSONResponse(status_code=500, content={"status": "error", "error": stderr.decode()})

# 初始化日志缓存
machine_logs_cache = {}


# 构建逻辑的异步函数
async def build_logic(item: Item):
    callback_sent = False  # 添加标志来跟踪回调状态
    try:
        # 部署到modal
        folder_path = f"/app/builds/{item.machine_id}"
        machine_id_status[item.machine_id] = True

        # 复制应用模板
        cp_process = await asyncio.subprocess.create_subprocess_exec("cp", "-r", "/app/src/template", folder_path)
        await cp_process.wait()

        # 写入配置文件
        config = {
            "name": item.name,
            "deploy_test": os.environ.get("DEPLOY_TEST_FLAG", "False"),
            "civitai_token": os.environ.get("CIVITAI_TOKEN", "")
        }
        print('++++++++++++config', config)
        with open(f"{folder_path}/config.py", "w") as f:
            f.write("config = " + json.dumps(config))

        with open(f"{folder_path}/data/snapshot.json", "w") as f:
            f.write(item.snapshot.json())

        with open(f"{folder_path}/data/models.json", "w") as f:
            models_json_list = [model.dict() for model in item.models]
            models_json_string = json.dumps(models_json_list)
            f.write(models_json_string)

        if item.custom_nodes and len(item.custom_nodes) > 0:
          shell_str = "cd /comfyui-online-serverless/custom_nodes\n"
          for custom_node in item.custom_nodes:
              shell_str += """
git clone --depth 1 {custom_node.url} {custom_node.directory}
if [ -f {custom_node.directory}/requirements.txt ]; then
    cd {custom_node.directory}
    pip install -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu
fi
"""
          shell_str = shell_str.format(custom_node=custom_node) + "\n cd /comfyui-online-serverless"
          with open(f"{folder_path}/data/install_custom_node.sh", "w") as f:
              f.write(shell_str)

        process = await asyncio.subprocess.create_subprocess_shell(
            f"modal deploy app.py",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=folder_path,
            env={**os.environ, "COLUMNS": "10000"}
        )

        url = None

        if item.machine_id not in machine_logs_cache:
            machine_logs_cache[item.machine_id] = []

        machine_logs = machine_logs_cache[item.machine_id]

        url_queue = asyncio.Queue()

        logger.info(f"Deploying machine {item.machine_id}")

        # 读取流的异步函数
        async def read_stream(stream, isStderr, url_queue: asyncio.Queue):
            while True:
                line = await stream.readline()
                if line:
                    l = line.decode('utf-8').strip()

                    if l == "":
                        continue

                    if not isStderr:
                        logger.info(l)
                        machine_logs.append({
                            "logs": l,
                            "timestamp": time.time()
                        })

                        if "Created web function comfyui_api =>" in l or ((l.startswith("https://") or l.startswith("│")) and l.endswith(".modal.run")):
                            if "Created web function comfyui_api =>" in l:
                                url = l.split("=>")[1].strip()
                            elif "comfyui-api" in l:
                                if l.startswith("│"):
                                    url = l.split("│")[1].strip()
                                else:
                                    url = l

                            if url:
                                machine_logs.append({
                                    "logs": f"App image built, url: {url}",
                                    "timestamp": time.time()
                                })

                                await url_queue.put(url)

                    else:
                        # 错误处理
                        logger.error(l)
                        machine_logs.append({
                            "logs": l,
                            "timestamp": time.time()
                        })
                else:
                    break

        stdout_task = asyncio.create_task(
            read_stream(process.stdout, False, url_queue))
        stderr_task = asyncio.create_task(
            read_stream(process.stderr, True, url_queue))

        await asyncio.wait([stdout_task, stderr_task])

        # 等待子进程完成
        await process.wait()

        logger.info(f"Finished deploying machine {item.machine_id}")

        if not url_queue.empty():
            url = await url_queue.get()

        # 关闭WebSocket连接并弹出项目
        if item.machine_id in machine_id_websocket_dict and machine_id_websocket_dict[item.machine_id] is not None:
            await machine_id_websocket_dict[item.machine_id].close()

        if item.machine_id in machine_id_websocket_dict:
            machine_id_websocket_dict.pop(item.machine_id)

        if item.machine_id in machine_id_status:
            machine_id_status[item.machine_id] = False

        logger.info(f"Deployed machine {item.machine_id}")
        logger.info(url)

        logger.info(f"return code: {process.returncode}")

        # 检查错误
        if process.returncode != 0:
            logger.info("An error occurred.")
            machine_logs.append({
                "logs": "Unable to build the app image.",
                "timestamp": time.time()
            })
            await send_callback(item.callback_url, {
                "machine_id": item.machine_id,
                "status": "error",
                "error": "Build process failed",
                "build_log": json.dumps(machine_logs)
            })
            callback_sent = True  # 标记回调已发送
            return

        if url is None:
            machine_logs.append({
                "logs": "App image built, but url is None, unable to parse the url.",
                "timestamp": time.time()
            })
            logger.info("App image built, but url is None, unable to parse the url.")
            await send_callback(item.callback_url, {
                "machine_id": item.machine_id,
                "status": "error",
                "error": "Failed to get deployment URL",
                "build_log": json.dumps(machine_logs)
            })
            callback_sent = True  # 标记回调已发送
            return

        logger.info(f"machine_id: {item.machine_id}, endpoint: {url}, item.callback_url: {item.callback_url}")
        await send_callback(item.callback_url, {
            "machine_id": item.machine_id,
            "status": "success",
            "endpoint": url,
            "build_log": json.dumps(machine_logs)
        })
        callback_sent = True  # 标记回调已发送

    except Exception as e:
        logger.error(f"Error in build_logic: {str(e)}")
        if not callback_sent:  # 只在还没发送回调时发送错误回调
            try:
                await send_callback(item.callback_url, {
                    "machine_id": item.machine_id,
                    "status": "error",
                    "error": str(e),
                    "build_log": json.dumps(machine_logs) if 'machine_logs' in locals() else "[]"
                })
            except Exception as callback_error:
                logger.error(f"Error sending error callback: {str(callback_error)}")
    finally:
        # 清理资源
        if item.machine_id in machine_logs_cache:
            del machine_logs_cache[item.machine_id]
        if item.machine_id in machine_id_status:
            machine_id_status[item.machine_id] = False
        if item.machine_id in machine_id_websocket_dict:
            try:
                await machine_id_websocket_dict[item.machine_id].close()
            except Exception as e:
                logger.error(f"Error closing websocket: {str(e)}")
            machine_id_websocket_dict.pop(item.machine_id)

        # 从任务字典中移除
        if item.machine_id in machine_tasks:
            machine_tasks.pop(item.machine_id)

async def send_callback(callback_url: str, data: dict):
    """异步发送回调请求"""
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(callback_url, json=data) as response:
                response_data = await response.json()
                logger.info(f"Callback response: {response_data}")
                if response.status >= 400:
                    logger.error(f"Callback failed with status {response.status}: {response_data}")
                    raise aiohttp.ClientError(f"Callback failed with status {response.status}")
        except aiohttp.ClientError as e:
            logger.error(f"Network error sending callback: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error sending callback: {str(e)}")
            raise

def start_loop(loop):
    asyncio.set_event_loop(loop)
    loop.run_forever()

# 在新的线程中运行协程
def run_in_new_thread(coroutine):
    """在新线程中运行协程，并确保proper cleanup"""
    thread = AsyncLoopThread(daemon=True)
    thread_tracker.add_thread(thread)
    thread.start()

    # 使用 weakref 确保线程在不再需要时被清理
    thread_ref = weakref.ref(thread)

    async def cleanup_wrapper():
        try:
            await coroutine
        finally:
            if thread_ref() is not None:
                thread_ref().stop()

    asyncio.run_coroutine_threadsafe(cleanup_wrapper(), thread.loop)
    return thread


if __name__ == "__main__":
    import uvicorn
    try:
        uvicorn.run("main:app", host="0.0.0.0", port=8080, lifespan="on")
    finally:
        # 确保在程序退出时清理所有线程
        thread_tracker.cleanup()
