# linhsayshii-tools - Docker Deployment Guide

Tài liệu này hướng dẫn chi tiết cách triển khai toàn bộ ứng dụng **hnglinh Tools** bằng **Docker** và **Docker Compose**, hỗ trợ cấu hình tùy chỉnh cổng chạy (expose port) theo nhu cầu của bạn.

---

## 📋 Yêu cầu chuẩn bị

Trước khi bắt đầu, hãy cài đặt Docker và Docker Compose trên Server của bạn bằng lệnh nhanh sau:

```bash
# Cài đặt Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

---

## 🛠️ Bước 1: Cấu hình biến môi trường (.env)

Ứng dụng cần cấu hình các tham số kết nối và bảo mật thông qua các file môi trường.

### 1.1 Cấu hình Backend `.env`
Tạo file `.env` trong thư mục `backend/`:
```bash
cp backend/.env.example backend/.env
nano backend/.env
```
*Lưu ý quan trọng:*
- **CORS_ORIGINS**: Danh sách các URL frontend được phép truy cập API (ví dụ: `http://localhost:<frontend_port>,https://hnglinh.io.vn`).
- **TURNSTILE_SECRET_KEY**: Điền key bí mật Cloudflare Turnstile của bạn (nếu chạy thử nghiệm ở localhost, hệ thống sẽ tự dùng key test mặc định).

### 1.2 Cấu hình Frontend `.env`
Tạo file `.env` trong thư mục `frontend/`:
```bash
cp frontend/.env.example frontend/.env
nano frontend/.env
```
*Lưu ý quan trọng:*
- **VITE_API_URL**: URL trỏ tới API Backend mà trình duyệt có thể truy cập được (ví dụ: `http://localhost:<backend_port>/api` hoặc `https://hnglinh.io.vn/api`).
- **VITE_TURNSTILE_SITE_KEY**: Điền site key Cloudflare Turnstile của bạn.

---

## 🚀 Cách 1: Triển khai bằng Docker Compose (Khuyên dùng)

Docker Compose giúp khởi chạy cả hai container Backend và Frontend cùng lúc và liên kết chúng một cách dễ dàng.

### 1.1 Cấu hình cổng chạy tùy chọn (Expose Port)
Mở file `docker-compose.yml` ở thư mục gốc của dự án:
```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      # Định dạng: "<Cổng_Host>:<Cổng_Container_Mặc_Định_8000>"
      - "8000:8000"  # Đổi số 8000 bên trái thành cổng bạn mong muốn ở máy Host
    volumes:
      - ./backend/data:/app/data
    environment:
      - CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://hnglinh.io.vn
      - TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
    restart: always

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      # Định dạng: "<Cổng_Host>:<Cổng_Container_Mặc_Định_80>"
      - "3000:80"    # Đổi số 3000 bên trái thành cổng bạn mong muốn ở máy Host
    depends_on:
      - backend
    restart: always
```

> ⚠️ **Lưu ý về đồng bộ cổng:**
> Nếu bạn thay đổi cổng host của Backend (ví dụ sang `8500`) hoặc Frontend (ví dụ sang `80` hoặc `8080`), hãy nhớ:
> 1. Cập nhật `VITE_API_URL=http://localhost:8500/api` trong `frontend/.env`.
> 2. Cập nhật `CORS_ORIGINS` tương ứng trong phần `environment` của `backend` hoặc trong `backend/.env`.

### 1.2 Khởi chạy ứng dụng
Để build image và chạy các container dưới dạng background (chạy ngầm):
```bash
docker compose up --build -d
```

### 1.3 Quản lý các containers
- **Xem trạng thái**: `docker compose ps`
- **Xem logs**: `docker compose logs -f` (hoặc xem chi tiết dịch vụ: `docker compose logs -f backend`)
- **Dừng ứng dụng**: `docker compose down`

---

## 🐳 Cách 2: Triển khai bằng lệnh Docker độc lập (Docker CLI)

Nếu không muốn dùng Docker Compose, bạn có thể tự build và run từng container bằng tay.

### 2.1 Chuẩn bị mạng ảo chung cho Docker
Tạo một network để các container có thể giao tiếp nội bộ (nếu cần thiết):
```bash
docker network create hnglinh-network
```

### 2.2 Triển khai Backend
1. **Build Docker Image cho Backend**:
   ```bash
   cd backend
   docker build -t hnglinh-backend .
   cd ..
   ```
2. **Khởi chạy Container Backend** (Ví dụ muốn mở cổng máy host là **8080**):
   ```bash
   docker run -d \
     --name hnglinh-api \
     --network hnglinh-network \
     -p 8080:8000 \
     -v $(pwd)/backend/data:/app/data \
     -e CORS_ORIGINS="http://localhost:3000,https://hnglinh.io.vn" \
     -e TURNSTILE_SECRET_KEY="your_cloudflare_turnstile_secret_key" \
     --restart always \
     hnglinh-backend
   ```
   *Giải thích tham số:*
   - `-p 8080:8000`: Ánh xạ cổng `8080` của máy host vào cổng `8000` của container.
   - `-v ...`: Lưu trữ database SQLite bền vững ở máy host.

### 2.3 Triển khai Frontend
1. Đảm bảo cấu hình file `frontend/.env` đã trỏ đúng đến cổng Backend vừa chạy (ví dụ: `VITE_API_URL=http://localhost:8080/api`).
2. **Build Docker Image cho Frontend**:
   ```bash
   cd frontend
   docker build -t hnglinh-frontend .
   cd ..
   ```
3. **Khởi chạy Container Frontend** (Ví dụ muốn mở cổng máy host là **3000**):
   ```bash
   docker run -d \
     --name hnglinh-web \
     --network hnglinh-network \
     -p 3000:80 \
     --restart always \
     hnglinh-frontend
   ```
   *Giải thích tham số:*
   - `-p 3000:80`: Ánh xạ cổng `3000` của máy host vào cổng `80` (Nginx phục vụ file tĩnh) của container.

---

## 🧹 Dọn dẹp tài nguyên
Để giải phóng dung lượng đĩa từ các image cũ hoặc container không sử dụng:
```bash
docker system prune -a --volumes
```

---

## ❓ Troubleshooting (Xử lý sự cố)

### Lỗi CORS trên trình duyệt
- **Triệu chứng**: Frontend tải được giao diện nhưng các nút chức năng (rút gọn link, check IP, pastebin) báo lỗi hoặc không có phản hồi.
- **Cách sửa**: Kiểm tra biến môi trường `CORS_ORIGINS` của Backend. Đảm bảo chứa đúng địa chỉ URL và cổng mà Frontend đang sử dụng để truy cập (ví dụ: `http://localhost:3000`).

### Không tải được Video / Audio (Lỗi FFmpeg)
- **Triệu chứng**: Tính năng Downloader trả về lỗi khi tải file.
- **Giải thích**: Dockerfile của backend đã tự động cài đặt gói `ffmpeg` trong môi trường Debian-slim. Hãy kiểm tra logs backend xem có lỗi phân quyền hoặc lỗi mạng khi tải từ YouTube/TikTok không:
  ```bash
  docker compose logs -f backend
  ```

---

*Lưu ý: Nếu bạn muốn xem hướng dẫn cài đặt thủ công trực tiếp lên OS (không dùng Docker), vui lòng đọc hướng dẫn tại file [manual_deploy.md](manual_deploy.md).*
