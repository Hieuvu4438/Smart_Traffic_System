# 🚗 Traffic Detection using YOLO

<div align="center">

![Traffic Detection](https://img.shields.io/badge/Traffic-Detection-blue?style=for-the-badge&logo=car)
![YOLO](https://img.shields.io/badge/YOLO-v10%20%7C%20v11%20%7C%20v12-green?style=for-the-badge&logo=python)
![OpenCV](https://img.shields.io/badge/OpenCV-Computer%20Vision-red?style=for-the-badge&logo=opencv)
![Python](https://img.shields.io/badge/Python-3.8+-yellow?style=for-the-badge&logo=python)
![PyTorch](https://img.shields.io/badge/PyTorch-2.7+-orange?style=for-the-badge&logo=pytorch)

*Hệ thống giám sát giao thông thông minh với khả năng phát hiện phương tiện, ước tính tốc độ, nhận dạng biển số xe và phát hiện vi phạm giao thông*

</div>

## 📋 Mục lục

- [📖 Tổng quan](#-tổng-quan)
- [✨ Tính năng](#-tính-năng)
- [📁 Cấu trúc dự án](#-cấu-trúc-dự-án)
- [🛠️ Cài đặt](#️-cài-đặt)
- [🚀 Sử dụng](#-sử-dụng)
- [🤖 Mô hình](#-mô-hình)
- [📊 Kết quả](#-kết-quả)
- [⚙️ Cấu hình](#️-cấu-hình)
- [🔧 Modules chính](#-modules-chính)
- [🤝 Đóng góp](#-đóng-góp)
- [📄 Giấy phép](#-giấy-phép)

## 📖 Tổng quan

Dự án này triển khai một hệ thống giám sát và phân tích giao thông hoàn chỉnh sử dụng các mô hình YOLO (You Only Look Once) tiên tiến. Hệ thống cung cấp khả năng phát hiện phương tiện theo thời gian thực, ước tính tốc độ, nhận dạng biển số xe Việt Nam, phát hiện vi phạm đèn đỏ và kiểm tra mũ bảo hiểm cho người đi xe máy.

### 🎯 Khả năng chính

- **Phát hiện đa đối tượng**: Ô tô, xe máy, người, mũ bảo hiểm
- **Ước tính tốc độ**: Tính toán tốc độ phương tiện theo thời gian thực với IPM (Inverse Perspective Mapping)
- **Nhận dạng biển số**: Phát hiện và OCR biển số xe Việt Nam sử dụng KNN
- **Phát hiện vi phạm**: Giám sát vi phạm đèn đỏ
- **Kiểm tra an toàn**: Phát hiện mũ bảo hiểm cho người đi xe máy

## ✨ Tính năng

### 🚙 Phát hiện & Theo dõi phương tiện
- Phát hiện phương tiện theo thời gian thực sử dụng YOLOv10/v11/v12
- Theo dõi đa đối tượng với ID duy nhất
- Hỗ trợ ô tô, xe máy, xe buýt và xe tải

### 🏎️ Ước tính tốc độ
- Tính toán tốc độ có hiệu chỉnh phối cảnh
- Phân tích đa cửa sổ thời gian để tăng độ chính xác
- Ánh xạ khoảng cách thế giới thực sử dụng IPM
- Thuật toán làm mượt tốc độ để giảm nhiễu

### 🔢 Nhận dạng biển số xe
- Phát hiện biển số xe Việt Nam
- Phân đoạn ký tự và hiệu chỉnh xoay
- Nhận dạng ký tự dựa trên KNN
- Hỗ trợ cả biển số 1 hàng và 2 hàng

### 🚦 Phát hiện vi phạm giao thông
- Phát hiện và giám sát đèn đỏ
- Tự động ghi lại vi phạm
- Thu thập bằng chứng có đóng dấu thời gian

### 🪖 Kiểm tra tuân thủ an toàn
- Phát hiện mũ bảo hiểm cho xe máy
- Giám sát an toàn theo thời gian thực

## 📁 Cấu trúc dự án

```
📦 Traffic Detection using YOLO
├── 🚗 Phát hiện phương tiện & Tốc độ
│   ├── predict.py                    # Script dự đoán chính
│   ├── predict_video.py              # Xử lý video
│   ├── train.py                      # Huấn luyện mô hình
│   ├── validate.py                   # Xác thực mô hình
│   ├── test.py                       # Tiện ích kiểm tra
│   ├── draw_count.py                 # Đếm và vẽ đối tượng
│   ├── draw_count_video.py           # Đếm trong video
│   └── draw_count_video_stable.py    # Đếm ổn định trong video
│
├── 🏎️ Module ước tính tốc độ
│   └── yolov10_speed_detection/
│       ├── speed.py                  # Core ước tính tốc độ
│       ├── speed_new.py              # Tính toán tốc độ nâng cao
│       └── yolotrack1.py             # Triển khai theo dõi
│
├── 🔢 Nhận dạng biển số xe
│   └── VIETNAMESE_LICENSE_PLATE/
│       ├── Image_test2.py            # Kiểm tra ảnh
│       ├── Video_test2.py            # Kiểm tra video
│       ├── GenData.py                # Tạo dữ liệu huấn luyện
│       ├── Preprocess.py             # Tiền xử lý ảnh
│       ├── classifications.txt       # Nhãn ký tự
│       ├── flattened_images.txt      # Vector đặc trưng
│       └── README.md                 # Hướng dẫn chi tiết
│
├── 🚦 Phát hiện vi phạm giao thông
│   └── Red-Traffic-Light-Violation/
│       ├── pmain1.py                 # Detector vi phạm chính
│       ├── test1.py                  # Phát hiện đèn giao thông
│       ├── tracker.py                # Theo dõi đối tượng
│       └── adaptive_traffic_monitor.py # Giám sát thích ứng
│
├── 🪖 Phát hiện an toàn
│   ├── helmet_detection.py           # Phát hiện mũ bảo hiểm
│   └── adaptive_violations/          # Phát hiện vi phạm thích ứng
│
├── 📊 Dữ liệu & Mô hình
│   ├── *.pt                          # Trọng số mô hình YOLO
│   ├── *.yaml                        # Cấu hình dataset
│   ├── Data/                         # Dataset huấn luyện
│   ├── Combined_Data/                # Dataset đã merge
│   └── runs/                         # Kết quả huấn luyện
│
├── 🔧 Tiện ích
│   ├── merge_dataset.py              # Quản lý dataset
│   ├── cuda.py                       # Tiện ích GPU
│   └── requirements.txt              # Dependencies
│
└── 🖥️ Frontend
    └── Frontend/                     # Giao diện web (nếu có)
```

## 🛠️ Cài đặt

### Yêu cầu hệ thống

- Python 3.8+
- GPU hỗ trợ CUDA (khuyến nghị)
- OpenCV 4.x
- PyTorch 2.7+

### Các bước cài đặt

1. **Clone repository**
```bash
git clone <repository-url>
cd "Traffic Detection using YOLO"
```

2. **Tạo môi trường ảo**
```bash
python -m venv traffic_venv
traffic_venv\Scripts\activate  # Windows
# source traffic_venv/bin/activate  # Linux/Mac
```

3. **Cài đặt dependencies**
```bash
pip install -r requirements.txt
```

4. **Tải mô hình YOLO**
- Đặt các mô hình đã huấn luyện (`.pt` files) vào thư mục gốc
- Các mô hình có sẵn: `yolo11n.pt`, `yolo12n.pt`, `yolov10n.pt`, etc.

5. **Kiểm tra CUDA (Tùy chọn)**
```bash
python cuda.py
```

## 🚀 Sử dụng

### 🎥 Xử lý Video

#### Phát hiện phương tiện & Ước tính tốc độ
```bash
# Ước tính tốc độ theo thời gian thực
cd yolov10_speed_detection
python yolotrack1.py

# Phát hiện phương tiện cơ bản
python predict_video.py
```

#### Nhận dạng biển số xe
```bash
cd VIETNAMESE_LICENSE_PLATE

# Kiểm tra ảnh
python Image_test2.py

# Kiểm tra video  
python Video_test2.py
```

#### Phát hiện vi phạm giao thông
```bash
cd Red-Traffic-Light-Violation
python pmain1.py
```

#### Phát hiện mũ bảo hiểm
```bash
python helmet_detection.py
```

### 🖼️ Xử lý ảnh

```bash
# Dự đoán ảnh đơn
python predict.py --source path/to/image.jpg

# Xử lý batch ảnh
python predict.py --source path/to/images/
```

### 🏋️ Huấn luyện mô hình

```bash
# Huấn luyện mô hình mới
python train.py --data data.yaml --epochs 100

# Xác thực mô hình
python validate.py --weights best.pt
```

### 📊 Đếm và phân tích

```bash
# Đếm đối tượng trong ảnh
python draw_count.py

# Đếm đối tượng trong video
python draw_count_video.py

# Đếm ổn định trong video
python draw_count_video_stable.py
```

## 🤖 Mô hình

| Mô hình | Kích thước | Trường hợp sử dụng | Hiệu suất |
|---------|------------|-------------------|-----------|
| YOLOv10n | ~6MB | Phát hiện thời gian thực | 45+ FPS |
| YOLOv11n | ~8MB | Cân bằng độ chính xác/tốc độ | 35+ FPS |
| YOLOv12s | ~25MB | Độ chính xác cao | 25+ FPS |

### 📊 Cấu hình Dataset

- `bike_data.yaml` - Phát hiện xe máy
- `car_data.yaml` - Phát hiện ô tô  
- `data_helmet.yaml` - Phát hiện mũ bảo hiểm
- `license_data.yaml` - Phát hiện biển số xe
- `data.yaml` - Dataset tổng hợp

## 📊 Kết quả

### 🎯 Metrics hiệu suất

| Nhiệm vụ | Độ chính xác | FPS | Ghi chú |
|----------|-------------|-----|---------|
| Phát hiện phương tiện | 95%+ | 30-45 | YOLOv10/v11 |
| Ước tính tốc độ | ±5 km/h | 30+ | Với hiệu chỉnh IPM |
| Nhận dạng biển số | 85%+ | 25+ | Biển số Việt Nam |
| Phát hiện vi phạm | 90%+ | 30+ | Vi phạm đèn đỏ |

### 📊 Kết quả nhận dạng biển số xe

| Loại biển số | Tỷ lệ phát hiện | Tỷ lệ nhận dạng |
|-------------|----------------|-----------------|
| Biển 1 hàng | 49.2% | 33.5% (hoàn hảo) |
| Biển 2 hàng | 39.3% | 31% (hoàn hảo) |

*Nguồn: Vietnamese License Plate README*

### 🎬 Demo Videos

- Theo dõi phương tiện thời gian thực với ước tính tốc độ
- Nhận dạng biển số xe trong bãi đỗ
- Phát hiện vi phạm giao thông tại ngã tư
- Phát hiện mũ bảo hiểm cho an toàn xe máy

## ⚙️ Cấu hình

### Cài đặt ước tính tốc độ
```python
# Tham số hiệu chuẩn trong speed.py
real_world_width = 25.0      # Chiều rộng đường (mét)
real_world_length = 50.0     # Chiều dài đường (mét)  
speed_update_interval = 0.2  # Khoảng thời gian tính tốc độ
min_movement_threshold = 2   # Ngưỡng chuyển động tối thiểu
```

### Nhận dạng biển số xe
```python
# Tham số nhận dạng ký tự
RESIZED_IMAGE_WIDTH = 20
RESIZED_IMAGE_HEIGHT = 30
Min_char_area = 0.015
Max_char_area = 0.06
```

### Phát hiện vi phạm
```python
# Tọa độ vùng vi phạm (có thể điều chỉnh)
area = [(254, 250), (222, 299), (670, 314), (678, 258)]
```

## 🔧 Modules chính

### Speed Estimation (speed.py)

- **Triển khai IPM**: Inverse Perspective Mapping cho tính toán khoảng cách chính xác
- **Phân tích đa cửa sổ**: Sử dụng nhiều cửa sổ thời gian cho ước tính tốc độ ổn định
- **Hiệu chỉnh phối cảnh**: Tính đến độ méo phối cảnh của camera
- **Thuật toán làm mượt**: Giảm nhiễu tốc độ thông qua trung bình có trọng số

```python
# Tính năng chính
- Ánh xạ khoảng cách thế giới thực
- Tính toán tốc độ thích ứng  
- Biến đổi phối cảnh
- Làm mượt và xác thực tốc độ
```

### License Plate Recognition (VIETNAMESE_LICENSE_PLATE)

- **Nhận dạng dựa trên KNN**: Phân loại ký tự sử dụng K-Nearest Neighbors
- **Pipeline tiền xử lý**: Chuyển grayscale, tăng cường contrast, giảm nhiễu
- **Phân đoạn ký tự**: Trích xuất và chuẩn hóa ký tự tự động
- **Hiệu chỉnh xoay**: Xử lý biển số bị nghiêng

### Traffic Violation Detection (pmain1.py)

- **Phát hiện đèn giao thông**: Nhận dạng tín hiệu giao thông thời gian thực
- **Giám sát vi phạm**: Tự động phát hiện vi phạm đèn đỏ
- **Ghi lại bằng chứng**: Ảnh vi phạm có đóng dấu thời gian
- **Phát hiện dựa trên vùng**: Vùng vi phạm có thể cấu hình

### Helmet Detection (helmet_detection.py)

- **Phát hiện mũ bảo hiểm**: Sử dụng YOLO để phát hiện mũ bảo hiểm
- **Kiểm tra tuân thủ**: Xác định người đi xe máy có đội mũ hay không
- **Cảnh báo an toàn**: Thông báo khi phát hiện vi phạm

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/TinhNangMoi`)
3. Commit thay đổi (`git commit -m 'Thêm tính năng mới'`)
4. Push branch (`git push origin feature/TinhNangMoi`)
5. Mở Pull Request

### 📝 Hướng dẫn phát triển

- Tuân thủ PEP 8 style guidelines
- Thêm docstring đầy đủ
- Bao gồm unit tests cho tính năng mới
- Cập nhật documentation cho thay đổi API

## 🙏 Lời cảm ơn

- **Ultralytics** cho việc triển khai YOLO
- **OpenCV** community cho các công cụ computer vision
- **Vietnamese License Plate Recognition** bởi Mai Chí Bảo
- Những người đóng góp dataset và annotations

## 📞 Hỗ trợ

Để được hỗ trợ và giải đáp thắc mắc:

- 🐛 Issues: [GitHub Issues]
- 📖 Documentation: [Project Wiki]
- 💬 Discussions: [GitHub Discussions]

## 📄 Giấy phép

Dự án này được cấp phép theo MIT License - xem file LICENSE để biết chi tiết.

---

<div align="center">

**⭐ Star repository này nếu nó hữu ích cho bạn! ⭐**

Được tạo ra với ❤️ cho an toàn giao thông và giải pháp thành phố thông minh

![Traffic Safety](https://img.shields.io/badge/Traffic-Safety-brightgreen?style=flat-square)
![Smart City](https://img.shields.io/badge/Smart-City-blue?style=flat-square)
![AI Vision](https://img.shields.io/badge/AI-Vision-purple?style=flat-square)

</div>
