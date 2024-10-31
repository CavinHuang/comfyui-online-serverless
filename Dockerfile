# 声明构建参数
ARG CUSTOM_NODES_REPO
ARG CUSTOM_NODES_DIR

FROM python:3.11-slim as builder

# 重新声明构建参数，确保在 FROM 之后可用
ARG CUSTOM_NODES_REPO
ARG CUSTOM_NODES_DIR

# 将参数转换为环境变量，确保在 RUN 命令中可用
ENV CUSTOM_NODES_REPO=${CUSTOM_NODES_REPO}
ENV CUSTOM_NODES_DIR=${CUSTOM_NODES_DIR}

RUN echo "Debug: CUSTOM_NODES_REPO=${CUSTOM_NODES_REPO}" && \
    echo "Debug: CUSTOM_NODES_DIR=${CUSTOM_NODES_DIR}"

# RUN apt-get update && apt-get install -y \
#     git \
#     wget

# 设置工作目录
WORKDIR /build

# 安装构建依赖并清理
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    && rm -rf /var/lib/apt/lists/*

# 克隆项目并安装依赖
RUN git clone -b online --single-branch --depth 1 \
    https://github.com/CavinHuang/comfyui-online-serverless.git . && \
    python3 -m pip install --no-cache-dir --upgrade pip && \
    pip3 install --no-cache-dir torch==2.1.1 torchvision==0.16.1 torchaudio==2.1.1 \
    --index-url https://download.pytorch.org/whl/cpu && \
    pip3 install --no-cache-dir -r requirements.txt


# 处理自定义节点
RUN if [ -n "${CUSTOM_NODES_REPO}" ] && [ -n "${CUSTOM_NODES_DIR}" ]; then \
    cd custom_nodes && \
    git clone --depth 1 "${CUSTOM_NODES_REPO}" && \
    if [ -f "${CUSTOM_NODES_DIR}/requirements.txt" ]; then \
        pip3 install --no-cache-dir -r "${CUSTOM_NODES_DIR}/requirements.txt"; \
    fi; \
    fi

# 清理阶段 - 添加一个新的阶段专门用于清理
FROM builder as cleaner
RUN find /usr/local/lib/python3.11/site-packages -name "*.pyc" -delete && \
    find /usr/local/lib/python3.11/site-packages -name "__pycache__" -delete && \
    find /app -name "*.pyc" -delete && \
    find /app -name "__pycache__" -delete && \
    rm -rf /app/.git /app/.github /app/tests /app/docs


# 最终阶段
FROM python:3.11-slim

WORKDIR /app

# 复制必要的文件从构建阶段
COPY --from=builder /build /app
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages

# 安装运行时依赖
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     libgl1-mesa-glx \
#     libglib2.0-0 \
#     && rm -rf /var/lib/apt/lists/* \
#     && apt-get clean

EXPOSE 8188

CMD ["python3", "main.py", "--disable-cuda-malloc", "--cpu"]