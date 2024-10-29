FROM python:3.11

RUN apt-get update && apt-get install -y \
    git \
    wget

WORKDIR /app

RUN git clone -b online --single-branch https://github.com/CavinHuang/comfyui-online-serverless.git comfyui-online-serverless

RUN cd comfyui-online-serverless

WORKDIR /app/comfyui-online-serverless

# RUN source comfyui-online-serverless/bin/activate

RUN python3 -m pip install --upgrade pip


# RUN pip install --pre torch torchvision torchaudio --index-url https://download.pytorch.org/whl/nightly/rocm6.1
# RUN pip3 install --no-cache-dir torch==2.1.1 torchvision==0.16.1 torchaudio==2.1.1 --index-url https://download.pytorch.org/whl/cu121
# pip install --pre torch torchvision torchaudio --index-url https://download.pytorch.org/whl/nightly/rocm6.1
# RUN pip3 install --pre torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/nightly/cpu

RUN pip3 install --no-cache-dir torch==2.1.1 torchvision==0.16.1 torchaudio==2.1.1 --index-url https://download.pytorch.org/whl/cpu

RUN pip3 install -r requirements.txt

RUN cd /app/comfyui-online-serverless/custom_nodes

WORKDIR /app/comfyui-online-serverless/custom_nodes

# RUN git clone --depth 1 https://github.com/ltdrdata/ComfyUI-Manager.git
# RUN cd ComfyUI-Manager && pip3 install -r requirements.txt

# RUN cd ../
RUN git clone --depth 1 https://github.com/M1kep/Comfy_KepKitchenSink.git
# 如果有requirements.txt，则安装
RUN cd Comfy_KepKitchenSink && if [ -f requirements.txt ]; then pip3 install -r requirements.txt; fi

RUN cd /app/comfyui-online-serverless

WORKDIR /app/comfyui-online-serverless

EXPOSE 8188

CMD ["python3", "main.py", "--disable-cuda-malloc", "--cpu"]
