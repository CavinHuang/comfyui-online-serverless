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
    git \
    python310 python310-pip python310-wheel python310-setuptools \
    python310-devel python310-Cython gcc-c++ python310-py-build-cmake \
    python310-numpy1 python310-opencv \
    python310-dbm \
    Mesa-libGL1 libgthread-2_0-0 \
  && rm -f /usr/lib64/python3.10/EXTERNALLY-MANAGED \
  && update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.10 10

RUN --mount=type=cache,target=/root/.cache/pip \
  pip install --break-system-packages \
      --upgrade pip wheel setuptools

# 安装 PyTorch
RUN --mount=type=cache,target=/root/.cache/pip \
  pip install --break-system-packages torch==2.1.1 torchvision==0.16.1 \
  --extra-index-url https://download.pytorch.org/whl/cpu

# 安装项目依赖
RUN --mount=type=cache,target=/root/.cache/pip \
  pip install --break-system-packages -r \
  https://raw.githubusercontent.com/CavinHuang/comfyui-online-serverless/online/requirements.txt \
  --extra-index-url https://download.pytorch.org/whl/cpu

# 克隆项目
RUN git clone -b online --single-branch --depth 1 --no-tags \
    https://github.com/CavinHuang/comfyui-online-serverless.git .


# 安装其他依赖
# RUN python3 -m pip install --verbose --no-cache-dir -r requirements.txt

# 处理自定义节点
# RUN if [ -n "${CUSTOM_NODES_REPO}" ] && [ -n "${CUSTOM_NODES_DIR}" ]; then \
#     cd custom_nodes \
#     && git clone --depth 1 --no-tags "${CUSTOM_NODES_REPO}" \
#     && if [ -f "${CUSTOM_NODES_DIR}/requirements.txt" ]; then \
#        python3 -m pip install --no-cache-dir -r "${CUSTOM_NODES_DIR}/requirements.txt"; \
#     fi; \
#     fi

# 清理
RUN zypper clean --all \
    && find /usr/lib/python3*/site-packages -type d \( \
       -name "tests" -o \
       -name "examples" -o \
       -name "__pycache__" -o \
       -name "*.dist-info" -o \
       -name "*.egg-info" \
       \) -exec rm -rf {} + \
    && find . -type f -name "*.pyc" -delete \
    && find . -type d -name "__pycache__" -exec rm -rf {} + \
    && rm -rf .github tests docs

# 最终阶段
FROM opensuse/tumbleweed

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# 安装最小运行时依赖
RUN zypper --non-interactive refresh && \
    zypper --non-interactive install --no-recommends -y \
    python310 python310-pip python310-wheel python310-setuptools \
    python310-devel python310-Cython gcc-c++ python310-py-build-cmake \
    python310-numpy1 python310-opencv \
    python310-dbm \
    && zypper clean --all \
    # 创建非 root 用户
    && groupadd -r comfy && useradd -r -g comfy comfy \
    && chown -R comfy:comfy /app

# 只复制必要的文件
COPY --from=builder --chown=comfy:comfy /build /app
COPY --from=builder /usr/lib/python3*/site-packages /usr/lib/python3*/site-packages

# 切换到非 root 用户
USER comfy

# Fix MediaPipe's broken dep (protobuf<4).
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --break-system-packages \
        mediapipe \
    && pip list

RUN df -h \
    && du -ah /root \
    && find /root/ -mindepth 1 -delete

COPY runner-scripts/.  /runner-scripts/

USER root
VOLUME /root
WORKDIR /root
EXPOSE 8188
ENV CLI_ARGS=""
CMD ["bash","/runner-scripts/entrypoint.sh"]