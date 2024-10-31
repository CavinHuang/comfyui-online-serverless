# 构建阶段
FROM opensuse/tumbleweed:latest as builder

# 声明构建参数
ARG CUSTOM_NODES_REPO
ARG CUSTOM_NODES_DIR

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# 优化包安装并清理缓存
RUN zypper --non-interactive refresh && \
    zypper --non-interactive install --no-recommends -y \
    git \
    python310 python310-pip python310-wheel \
    python310-devel python310-Cython gcc-c++ \
    python310-numpy1 python310-opencv \
    Mesa-libGL1 libgthread-2_0-0 && \
    zypper clean -a && \
    rm -rf /var/cache/zypp/* && \
    rm -f /usr/lib64/python3.10/EXTERNALLY-MANAGED && \
    update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.10 10

# 使用单个 RUN 命令安装所有 Python 依赖
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir --break-system-packages \
    torch==2.1.1 torchvision==0.16.1 \
    -r https://raw.githubusercontent.com/CavinHuang/comfyui-online-serverless/online/requirements.txt \
    --extra-index-url https://download.pytorch.org/whl/cpu && \
    rm -rf /root/.cache/pip/*

# 运行阶段
FROM opensuse/tumbleweed:latest
COPY --from=builder /usr/lib64/python3.10 /usr/lib64/python3.10
COPY --from=builder /usr/bin/python3.10 /usr/bin/python3.10
COPY --from=builder /usr/bin/python3 /usr/bin/python3
COPY --from=builder /usr/lib64/libpython3.10.so* /usr/lib64/
COPY runner-scripts/. /runner-scripts/

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

USER root
WORKDIR /root
EXPOSE 8188
ENV CLI_ARGS=""
CMD ["bash","/runner-scripts/entrypoint.sh"]