# 构建阶段
FROM opensuse/tumbleweed as builder

# 声明构建参数
ARG CUSTOM_NODES_REPO
ARG CUSTOM_NODES_DIR

# 设置环境变量减少 Python 生成的缓存文件
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

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

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY runner-scripts/.  /runner-scripts/

USER root
VOLUME /root
WORKDIR /root
EXPOSE 8188
ENV CLI_ARGS=""
CMD ["bash","/runner-scripts/entrypoint.sh"]