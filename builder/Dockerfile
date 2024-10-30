# 声明构建参数
ARG CUSTOM_NODES_REPO
ARG CUSTOM_NODES_DIR

FROM python:3.11

RUN apt-get update && apt-get install -y \
    git \
    wget

WORKDIR /app

# 添加错误处理和输出
RUN git clone -b online --single-branch https://github.com/CavinHuang/comfyui-online-serverless.git comfyui-online-serverless || \
    (echo "Failed to clone main repository" && exit 1)

WORKDIR /app/comfyui-online-serverless

RUN python3 -m pip install --upgrade pip

RUN pip3 install --no-cache-dir torch==2.1.1 torchvision==0.16.1 torchaudio==2.1.1 --index-url https://download.pytorch.org/whl/cpu

RUN pip3 install -r requirements.txt

WORKDIR /app/comfyui-online-serverless/custom_nodes

# 添加调试信息和错误处理
RUN echo "Cloning from: ${CUSTOM_NODES_REPO}" && \
    git clone --depth 1 ${CUSTOM_NODES_REPO} || \
    (echo "Failed to clone custom nodes repository" && git --version && exit 1)

# 修改目录检查和安装依赖的逻辑
RUN if [ -d ${CUSTOM_NODES_DIR} ]; then \
        cd ${CUSTOM_NODES_DIR} && \
        if [ -f requirements.txt ]; then \
            pip3 install -r requirements.txt; \
        fi \
    else \
        echo "Directory ${CUSTOM_NODES_DIR} not found" && \
        ls -la && \
        exit 1; \
    fi

WORKDIR /app/comfyui-online-serverless

EXPOSE 8188

CMD ["python3", "main.py", "--disable-cuda-malloc", "--cpu"]