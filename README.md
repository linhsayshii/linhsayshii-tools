# linhsayshii-tools — Self-Deployment Guide

Hướng dẫn triển khai hoàn chỉnh cho **hnglinh Tools** (URL Shortener, Pastebin, QR Code, IP Checker, Downloader) bằng **Docker Compose** + **Nginx Proxy Manager**.

---

## 🗂️ Kiến trúc hệ thống

```
Internet
   │
   ▼
Nginx Proxy Manager  (port 80/443)
   │
   ├── hnglinh.io.vn  ──────► Frontend container (nginx, port 80 bên trong)
   │                              │
   │                              └── /api/* ──► Backend container (uvicorn, port 8000 bên trong)
   │                                            (proxy_pass nội bộ qua Docker network)
   └── (các domain/service khác)
```

**Lưu ý kiến trúc quan trọng:**
- Frontend container **tự proxy `/api/`** sang backend qua Docker internal network — không cần NPM xử lý riêng route `/api/`.
- Backend **không expose ra Internet** trực tiếp, chỉ giao tiếp nội bộ qua Docker network.
- Database SQLite được lưu trên **volume mount** tại `./backend/data/` — persist qua các lần restart.

---

## 📋 Yêu cầu

- Docker + Docker Compose v2 (lệnh `docker compose`, không phải `docker-compose`)
- Nginx Proxy Manager (hoặc reverse proxy khác)
- Domain đã trỏ A record về IP server

```bash
# Cài Docker (nếu chưa có)
curl -fsSL https://get.docker.com | sh
```

---

## ⚠️ Kiểm tra xung đột port TRƯỚC KHI deploy

> **Đây là bước quan trọng nhất hay bị bỏ qua.**

Kiểm tra xem các port bạn định dùng có bị service khác chiếm không:

```bash
sudo ss -tlnp | grep -E '8000|3000|3737|3738'
```

Ví dụ thực tế: **Portainer** thường chiếm port `8000` và `9443`. Nếu deploy backend lên `8000:8000` trong khi Portainer đang dùng port `8000` → backend sẽ bị **chặn hoàn toàn**, mọi API call sẽ ra Portainer thay vì FastAPI.

**Giải pháp**: Chọn port host chưa bị dùng, ví dụ `3737:8000` và `3738:80`.

---

## 🛠️ Bước 1: Cấu hình file môi trường

### Backend — `backend/.env`

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

```env
# Cloudflare Turnstile (bảo vệ form)
# Lấy tại: https://dash.cloudflare.com/ → Turnstile
# Khi test local: để giá trị mặc định 1x0000000000000000000000000000000AA
TURNSTILE_SECRET_KEY=your_cloudflare_turnstile_secret_key

# CORS — liệt kê tất cả origin mà trình duyệt có thể gửi request từ đó
# Không thiếu domain nào → sẽ bị CORS error
CORS_ORIGINS=https://hnglinh.io.vn,https://www.hnglinh.io.vn,http://localhost:5173

# Domain hiển thị trong link rút gọn và link share pastebin
BASE_DOMAIN=https://hnglinh.io.vn
```

### Frontend — `frontend/.env`

```bash
cp frontend/.env.example frontend/.env
nano frontend/.env
```

```env
# QUAN TRỌNG: Phải là /api (relative path), KHÔNG phải URL tuyệt đối
# Lý do: Frontend nginx sẽ tự proxy /api/ sang backend nội bộ
# Nếu đặt http://localhost:8000/api → browser của user sẽ gọi localhost của họ, không phải server
VITE_API_URL=/api

# Cloudflare Turnstile Site Key
VITE_TURNSTILE_SITE_KEY=your_cloudflare_turnstile_site_key

# Domain hiển thị trong URL Shortener (phải khớp với BASE_DOMAIN ở backend)
VITE_SHORT_URL_BASE=https://hnglinh.io.vn
```

---

## 🚀 Bước 2: Cấu hình Docker Compose

Mở `docker-compose.yml` và **chỉnh port host** theo port thực tế còn trống trên server:

```yaml
version: '3.8'

networks:
  app-network:
    driver: bridge

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: backend          # Tên cố định → frontend nginx dùng để proxy
    ports:
      - "3737:8000"                  # Đổi 3737 thành port host còn trống trên server của bạn
    volumes:
      - ./backend/data:/app/data     # SQLite DB persist tại đây — KHÔNG xóa thư mục này
    environment:
      - CORS_ORIGINS=https://hnglinh.io.vn,https://www.hnglinh.io.vn
      - TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
    restart: always
    networks:
      - app-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: frontend
    ports:
      - "3738:80"                    # Đổi 3738 thành port host còn trống trên server của bạn
    depends_on:
      - backend
    restart: always
    networks:
      - app-network
```

> **Tại sao cần `container_name` và `networks`?**
> - `container_name: backend` → đảm bảo DNS hostname trong Docker network luôn là `backend`, không bị đổi thành `projectname-backend-1`.
> - Explicit `networks` → đảm bảo 2 container giao tiếp được với nhau qua service name.

---

## 🌐 Bước 3: Cấu hình Nginx Proxy Manager

Trong NPM, tạo **Proxy Host** mới cho domain của bạn:

| Trường | Giá trị |
|--------|---------|
| Domain Names | `hnglinh.io.vn`, `www.hnglinh.io.vn` |
| Scheme | `http` |
| Forward Hostname/IP | `localhost` (hoặc IP server) |
| Forward Port | `3738` (port host của frontend) |
| Websockets Support | ✅ Bật |
| Block Common Exploits | ✅ Bật |

**SSL**: Dùng tab SSL → Request Let's Encrypt certificate → Force SSL.

> **Lưu ý quan trọng với NPM:**
> - **KHÔNG** cần tạo custom location rule riêng cho `/api/` trong NPM.
> - Frontend nginx container đã tự xử lý proxy `/api/` sang backend nội bộ.
> - Nếu bạn thêm custom location `/api/` trong NPM, có thể gây xung đột.

---

## 🔧 Bước 4: Build và Deploy

```bash
# Clone repo
git clone https://github.com/linhsayshii/linhsayshii-tools.git
cd linhsayshii-tools

# Tạo thư mục data (nếu chưa có)
mkdir -p backend/data

# Build và chạy
docker compose up -d --build
```

Kiểm tra container đã chạy:
```bash
docker compose ps
```

Kiểm tra API hoạt động:
```bash
curl http://localhost:3737/
# Kết quả mong đợi: {"message":"Welcome to Personal Tools API"}

curl http://localhost:3737/api/paste/create \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"content":"test","title":"Test","language":"plaintext"}'
# Kết quả mong đợi: {"id":"...","expires_at":"...","share_url":"..."}
```

---

## 🔄 Bước 5: Cập nhật code mới

```bash
cd ~/linhsayshii-tools

# Pull code mới
git pull origin main

# Rebuild và restart (chỉ rebuild service thay đổi)
docker compose up -d --build frontend   # Nếu chỉ đổi frontend
docker compose up -d --build backend    # Nếu chỉ đổi backend
docker compose up -d --build            # Rebuild tất cả
```

---

## 📊 Quản lý và Debug

```bash
# Xem trạng thái containers
docker compose ps

# Xem logs real-time
docker compose logs -f
docker compose logs -f backend    # Chỉ xem backend
docker compose logs -f frontend   # Chỉ xem nginx access log

# Vào trong container kiểm tra
docker exec -it backend bash
docker exec -it frontend sh

# Kiểm tra database
docker exec backend python3 -c "
import sqlite3
conn = sqlite3.connect('/app/data/shortener.db')
print('Tables:', conn.execute(\"SELECT name FROM sqlite_master WHERE type='table'\").fetchall())
print('Paste count:', conn.execute('SELECT COUNT(*) FROM pastes').fetchone())
conn.close()
"

# Restart service
docker compose restart backend
docker compose restart frontend

# Dừng toàn bộ
docker compose down

# Dừng và xóa cả volumes (XÓA DATABASE — cẩn thận!)
docker compose down -v
```

---

## ❓ Troubleshooting

### Trang share pastebin ra blank page
**Triệu chứng**: Tạo paste thành công, click link share → trang trắng hoàn toàn.

**Nguyên nhân**: Frontend nginx không có rule proxy `/api/` → browser gọi API nhưng nginx không biết route đó đi đâu.

**Kiểm tra**: Xem `frontend/nginx.conf` có block `location /api/` không:
```nginx
location /api/ {
    proxy_pass http://backend:8000/api/;
    ...
}
```

**Kiểm tra log**: `docker compose logs -f frontend` xem có lỗi `502 Bad Gateway` không.

---

### API trả về "Not found" (text/plain) thay vì JSON
**Nguyên nhân**: Port `8000` bị service khác chiếm (thường là Portainer).

**Kiểm tra**:
```bash
# Xem service nào đang dùng port 8000
sudo ss -tlnp | grep 8000

# Xem container nào đang map port 8000
docker ps | grep 8000
```

**Giải pháp**: Đổi port host trong `docker-compose.yml`:
```yaml
ports:
  - "3737:8000"   # Dùng port 3737 (hoặc bất kỳ port nào còn trống)
```

---

### Lỗi CORS trên trình duyệt
**Triệu chứng**: API trả về lỗi 403 hoặc browser console báo CORS error.

**Kiểm tra**: `CORS_ORIGINS` trong `docker-compose.yml` environment phải bao gồm **đúng URL** mà user dùng để truy cập (kể cả `www.` nếu có):
```yaml
environment:
  - CORS_ORIGINS=https://hnglinh.io.vn,https://www.hnglinh.io.vn
```

Sau khi sửa, phải **restart backend**:
```bash
docker compose restart backend
```

---

### Dữ liệu bị mất sau khi restart
**Nguyên nhân**: Thư mục `backend/data/` không tồn tại hoặc volume mount sai.

**Kiểm tra**:
```bash
ls -la backend/data/
# Phải thấy file shortener.db ở đây
```

**Giải pháp**: Tạo thư mục trước khi deploy:
```bash
mkdir -p backend/data
```

---

### Link rút gọn redirect sai
**Triệu chứng**: Click link rút gọn → redirect đến URL sai hoặc 404.

**Nguyên nhân**: `BASE_DOMAIN` trong backend không khớp với domain thực tế.

**Giải pháp**: Cập nhật biến môi trường:
```yaml
environment:
  - BASE_DOMAIN=https://hnglinh.io.vn
```

---

### Downloader báo lỗi FFmpeg
**Triệu chứng**: Tính năng tải video/audio không hoạt động.

**Giải thích**: FFmpeg đã được cài trong Dockerfile backend. Nếu lỗi:
```bash
docker compose logs backend | grep -i ffmpeg
```

Thường là do rate limit của YouTube/TikTok, không phải lỗi cài đặt.

---

## 🧹 Dọn dẹp

```bash
# Xóa images cũ không dùng (giải phóng disk space)
docker image prune -a

# Xóa toàn bộ tài nguyên Docker không dùng
docker system prune -a --volumes
```

---

*Xem hướng dẫn deploy thủ công (không dùng Docker) tại [manual_deploy.md](manual_deploy.md)*
