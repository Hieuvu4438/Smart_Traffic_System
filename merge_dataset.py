import os
import shutil
import glob

# Đường dẫn nguồn
dataset1_train_images = r"D:\JUPYTER NOTEBOOK\Traffic Detection using YOLO\AIP490_Defense.v1i.yolov11\AIP490_Defense.v1i.yolov11\train\images"
dataset1_valid_images = r"D:\JUPYTER NOTEBOOK\Traffic Detection using YOLO\AIP490_Defense.v1i.yolov11\AIP490_Defense.v1i.yolov11\valid\images"
dataset1_train_labels = dataset1_train_images.replace("images", "labels")
dataset1_valid_labels = dataset1_valid_images.replace("images", "labels")

dataset2_train_images = r"D:\JUPYTER NOTEBOOK\Traffic Detection using YOLO\Data\train\images"
dataset2_valid_images = r"D:\JUPYTER NOTEBOOK\Traffic Detection using YOLO\Data\valid\images"
dataset2_test_images = r"D:\JUPYTER NOTEBOOK\Traffic Detection using YOLO\Data\test\images"
dataset2_train_labels = dataset2_train_images.replace("images", "labels")
dataset2_valid_labels = dataset2_valid_images.replace("images", "labels")
dataset2_test_labels = dataset2_test_images.replace("images", "labels")

# Đường dẫn đích
output_base = r"D:\JUPYTER NOTEBOOK\Traffic Detection using YOLO\Combined_Data"
output_train_images = os.path.join(output_base, "train", "images")
output_train_labels = os.path.join(output_base, "train", "labels")
output_valid_images = os.path.join(output_base, "valid", "images")
output_valid_labels = os.path.join(output_base, "valid", "labels")
output_test_images = os.path.join(output_base, "test", "images")
output_test_labels = os.path.join(output_base, "test", "labels")

# Tạo các thư mục đích nếu chưa tồn tại
for folder in [output_train_images, output_train_labels, output_valid_images, output_valid_labels, output_test_images, output_test_labels]:
    os.makedirs(folder, exist_ok=True)

# Hàm ánh xạ nhãn từ Dataset 1
def remap_dataset1_label(line):
    parts = line.strip().split()
    if not parts:
        return line
    class_id = int(parts[0])
    if class_id == 0:  # Helmet -> 2
        parts[0] = "2"
    elif class_id == 1:  # bike -> 0
        parts[0] = "0"
    elif class_id == 2:  # Non_helmet -> 3
        parts[0] = "3"
    return " ".join(parts)

# Hàm ánh xạ nhãn từ Dataset 2 (giữ nguyên)
def remap_dataset2_label(line):
    parts = line.strip().split()
    if not parts:
        return line
    class_id = int(parts[0])
    return " ".join(parts)  # Giữ nguyên 0 cho bike, 1 cho car

# Copy và remap Dataset 1
for src_folder, dst_folder in [
    (dataset1_train_images, output_train_images),
    (dataset1_train_labels, output_train_labels),
    (dataset1_valid_images, output_valid_images),
    (dataset1_valid_labels, output_valid_labels)
]:
    for img_file in glob.glob(os.path.join(src_folder, "*.jpg")):
        shutil.copy(img_file, os.path.join(dst_folder, os.path.basename(img_file)))
    for label_file in glob.glob(os.path.join(src_folder, "*.txt")):
        with open(label_file, 'r') as f_src:
            lines = f_src.readlines()
        with open(os.path.join(dst_folder, os.path.basename(label_file)), 'w') as f_dst:
            for line in lines:
                f_dst.write(remap_dataset1_label(line) + "\n")

# Copy và remap Dataset 2
for src_folder, dst_folder in [
    (dataset2_train_images, output_train_images),
    (dataset2_train_labels, output_train_labels),
    (dataset2_valid_images, output_valid_images),
    (dataset2_valid_labels, output_valid_labels),
    (dataset2_test_images, output_test_images),
    (dataset2_test_labels, output_test_labels)
]:
    for img_file in glob.glob(os.path.join(src_folder, "*.jpg")):
        shutil.copy(img_file, os.path.join(dst_folder, os.path.basename(img_file)))
    for label_file in glob.glob(os.path.join(src_folder, "*.txt")):
        with open(label_file, 'r') as f_src:
            lines = f_src.readlines()
        with open(os.path.join(dst_folder, os.path.basename(label_file)), 'w') as f_dst:
            for line in lines:
                f_dst.write(remap_dataset2_label(line) + "\n")

print("Đã merge thành công hai dataset vào thư mục Combined!")