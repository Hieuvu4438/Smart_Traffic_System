import torch

# Kiểm tra xem CUDA có sẵn hay không
cuda_available = torch.cuda.is_available()

if cuda_available:
    print("CUDA is available!")
    print(f"GPU Device: {torch.cuda.get_device_name(0)}")
    print(f"Number of GPUs: {torch.cuda.device_count()}")
else:
    print("CUDA is not available. Running on CPU.")


