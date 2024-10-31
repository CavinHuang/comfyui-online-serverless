# 构建阶段
FROM opensuse/tumbleweed as builder

# 声明构建参数
ARG CUSTOM_NODES_REPO
ARG CUSTOM_NODES_DIR

# 设置环境变量减少 Python 生成的缓存文件
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# 设置工作目录
WORKDIR /build

# 安装构建依赖
RUN zypper --non-interactive refresh && \
    zypper --non-interactive install --no-recommends -y \
    git-core \
    python311 \
    python311-pip \
    python311-devel \
    gcc \
    gcc-c++ \
    && zypper clean --all \
    # 克隆项目
    && git clone -b online --single-branch --depth 1 --no-tags \
    https://github.com/CavinHuang/comfyui-online-serverless.git . \
    # 安装 Python 依赖
    && python3.11 -m pip install --no-cache-dir --upgrade pip \
    && pip3.11 install --no-cache-dir torch==2.1.1 torchvision==0.16.1 \
    --index-url https://download.pytorch.org/whl/cpu \
    && pip3.11 install --no-cache-dir -r requirements.txt \
    # 处理自定义节点
    && if [ -n "${CUSTOM_NODES_REPO}" ] && [ -n "${CUSTOM_NODES_DIR}" ]; then \
       cd custom_nodes \
       && git clone --depth 1 --no-tags "${CUSTOM_NODES_REPO}" \
       && if [ -f "${CUSTOM_NODES_DIR}/requirements.txt" ]; then \
          pip3.11 install --no-cache-dir -r "${CUSTOM_NODES_DIR}/requirements.txt"; \
       fi; \
    fi \
    # 清理构建依赖和缓存
    && zypper --non-interactive remove -y \
    git-core \
    gcc \
    gcc-c++ \
    python311-devel \
    && zypper clean --all \
    # 清理 Python 缓存和不必要文件
    && find /usr/lib/python3.11/site-packages -type d \( \
       -name "tests" -o \
       -name "examples" -o \
       -name "__pycache__" -o \
       -name "*.dist-info" -o \
       -name "*.egg-info" \
       \) -exec rm -rf {} + \
    && find . -type f -name "*.pyc" -delete \
    && find . -type d -name "__pycache__" -exec rm -rf {} + \
    && rm -rf .git .github tests docs

# 最终阶段
FROM opensuse/tumbleweed

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# 安装最小运行时依赖
RUN zypper --non-interactive refresh && \
    zypper --non-interactive install --no-recommends -y \
    python311 \
    python311-pip \
    Mesa \
    glib2 \
    wget \
    && zypper clean --all \
    # 创建非 root 用户
    && groupadd -r comfy && useradd -r -g comfy comfy \
    && chown -R comfy:comfy /app

# 只复制必要的文件
COPY --from=builder --chown=comfy:comfy /build /app
COPY --from=builder /usr/lib/python3.11/site-packages /usr/lib/python3.11/site-packages

# 切换到非 root 用户
USER comfy

EXPOSE 8188

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8188/system_stats || exit 1

CMD ["python3.11", "main.py", "--disable-cuda-malloc", "--cpu"]