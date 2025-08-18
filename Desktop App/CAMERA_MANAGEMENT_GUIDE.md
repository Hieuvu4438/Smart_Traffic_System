# Camera Management Feature Guide

## Chức năng Quản lý Camera

Ứng dụng Traffic Camera Monitor đã được cập nhật với tính năng quản lý camera hoàn chỉnh.

### Tính năng đã triển khai:

#### 1. **Thêm Camera Mới**
- **Nút thêm**: Nút tròn màu xanh với icon "+" ở góc dưới bên phải màn hình
- **Form thêm camera** bao gồm:
  - Tên camera (bắt buộc)
  - Địa chỉ (bắt buộc) 
  - Thành phố (bắt buộc) - dropdown với các thành phố Việt Nam
  - Quận/Huyện (bắt buộc)
  - Loại giao lộ (tùy chọn) - major/medium/minor
  - Số làn đường (tùy chọn) - mặc định 3
  - URL Video/Stream (tùy chọn) - hỗ trợ HTTP, HLS, RTSP, WebSocket
  - Loại Stream (tùy chọn) - dropdown cho các loại stream

#### 2. **Chỉnh sửa Camera**
- **Nút edit**: Icon bút chì màu vàng trên mỗi camera card (hiện khi hover)
- Form tương tự như thêm camera nhưng đã điền sẵn thông tin hiện tại

#### 3. **Xóa Camera** 
- **Nút delete**: Icon thùng rác màu đỏ trên mỗi camera card (hiện khi hover)
- Có xác nhận trước khi xóa

#### 4. **Test Stream**
- **Nút Test**: Kiểm tra tính khả dụng của URL stream
- Hiển thị kết quả test với thông tin latency, chất lượng, FPS

#### 5. **Lưu Database**
- **Nút Save**: Icon đĩa màu xanh lá xuất hiện sau khi có thay đổi
- Lưu thay đổi vào file cameras.json

### Cách sử dụng:

1. **Thêm camera mới:**
   - Click nút "+" ở góc dưới phải
   - Điền thông tin bắt buộc (tên, địa chỉ, thành phố, quận)
   - Tùy chọn: thêm URL stream và test
   - Click "Thêm Camera"

2. **Chỉnh sửa camera:**
   - Hover chuột lên camera card
   - Click icon bút chì (edit)
   - Chỉnh sửa thông tin
   - Click "Cập Nhật"

3. **Xóa camera:**
   - Hover chuột lên camera card  
   - Click icon thùng rác (delete)
   - Xác nhận xóa

4. **Test stream:**
   - Trong form thêm/sửa camera
   - Nhập URL stream
   - Click nút "Test"
   - Xem kết quả test

### Files đã cập nhật:

- **main.js**: Thêm IPC handlers cho CRUD operations
- **preload.js**: Expose camera management APIs
- **index.html**: Thêm modal và nút quản lý camera
- **styles.css**: Thêm styles cho modal và nút actions
- **renderer.js**: Thêm class CameraManager với đầy đủ functionality

### Debugging:

Nếu chức năng không hoạt động:

1. **Kiểm tra Console**: Mở DevTools (F12) và xem Console tab
2. **Kiểm tra nút Add Camera**: Phải có nút tròn xanh ở góc dưới phải
3. **Kiểm tra modal**: Click nút "+" phải mở modal thêm camera
4. **Kiểm tra action buttons**: Hover lên camera card phải thấy nút edit/delete

### Lỗi thường gặp:

- **Nút không xuất hiện**: Kiểm tra z-index trong CSS
- **Modal không mở**: Kiểm tra event listeners trong console
- **Form không submit**: Kiểm tra validation và required fields
- **Không lưu được**: Kiểm tra IPC communication với main process

### Test Data:

App khởi động với 4 camera mẫu:
- CAM-HN001: Ngã tư Hàng Xanh (HCM)
- CAM-HN002: Cầu Sài Gòn (HCM) 
- CAM-DN003: Cầu Rồng (Đà Nẵng)
- CAM-HN004: Vòng xuyến Cầu Giấy (Hà Nội)

Camera mới sẽ có ID tự động với format: CAM-{CityPrefix}{3digits}
