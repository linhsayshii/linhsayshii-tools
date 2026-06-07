# Hướng dẫn triển khai thủ công (Manual Deployment Guide)

Tài liệu này hướng dẫn chi tiết cách triển khai **hnglinh Tools** thủ công lên máy chủ Linux (Ubuntu/Debian) không sử dụng Docker.

---

## 📋 Yêu cầu hệ thống

- Hệ điều hành: Ubuntu 22.04 LTS hoặc Debian 12
- Tên miền (Domain): Đã trỏ bản ghi A về IP của Server (ví dụ: `hnglinh.io.vn` và `www.hnglinh.io.vn`)
- Quyền truy cập: Tài khoản `root` hoặc tài khoản có quyền `sudo`

---

## 🚀 Bước 1: Chuẩn bị Server và Cài đặt Dependency

### 1.1 Cập nhật hệ thống
Kết nối SSH vào server và chạy lệnh sau:
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Cài đặt các gói phần mềm cần thiết
Cài đặt Node.js 20.x, Python 3, Nginx, FFmpeg, Git và Certbot:
```bash
# Cài đặt Node.js 20.x LTS từ NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs

# Cài đặt Python 3, pip và venv
sudo apt install -y python3 python3-pip python3-venv

# Cài đặt Nginx
sudo apt install -y nginx

# Cài đặt FFmpeg (bắt buộc cho chức năng Video/Audio Downloader)
sudo apt install -y ffmpeg

# Cài đặt Git
sudo apt install -y git

# Cài đặt Certbot và Nginx plugin cho SSL
sudo apt install -y certbot python3-certbot-nginx
```

### 1.3 Tạo User chạy ứng dụng (Khuyến nghị bảo mật)
Để bảo mật, không nên chạy ứng dụng trực tiếp bằng quyền `root`. Hãy tạo user riêng tên là `hnglinh`:
```bash
# Tạo user mới
sudo adduser hnglinh --disabled-password --gecos ""

# Thêm user vào group sudo nếu cần thiết
sudo usermod -aG sudo hnglinh

# Chuyển sang user hnglinh
sudo su - hnglinh
```

---

## 🗂️ Bước 2: Tải Source Code và Cấu hình Dự án

### 2.1 Clone Repository
Clone mã nguồn của dự án về thư mục home của user `hnglinh`:
```bash
cd ~
git clone https://github.com/yourusername/hnglinh-tool.git
cd hnglinh-tool
```

### 2.2 Cấu hình và Cài đặt Backend (Python FastAPI)
1. Di chuyển vào thư mục backend và tạo môi trường ảo (virtual environment):
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   ```
2. Cài đặt các thư viện Python:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```
3. Tạo file cấu hình môi trường `.env`:
   ```bash
   cp .env.example .env
   nano .env
   ```
   **Cập nhật các biến môi trường:**
   ```env
   # API Configuration
   API_HOST=127.0.0.1
   API_PORT=8000

   # CORS Origins (Comma-separated list)
   CORS_ORIGINS=https://hnglinh.io.vn,https://www.hnglinh.io.vn,http://localhost:5173

   # Cloudflare Turnstile Secret Key (Thay bằng key thật của bạn hoặc để mặc định để test localhost)
   TURNSTILE_SECRET_KEY=your_cloudflare_turnstile_secret_key
   ```
4. Thoát khỏi môi trường ảo:
   ```bash
   deactivate
   ```

### 2.3 Cấu hình và Build Frontend (React + Vite)
1. Di chuyển vào thư mục frontend:
   ```bash
   cd ../frontend
   ```
2. Tạo file cấu hình môi trường `.env`:
   ```bash
   cp .env.example .env
   nano .env
   ```
   **Cập nhật các biến môi trường:**
   ```env
   # URL của API Backend (sẽ được proxy qua Nginx)
   VITE_API_URL=https://hnglinh.io.vn/api

   # Cloudflare Turnstile Site Key (Thay bằng key thật của bạn)
   VITE_TURNSTILE_SITE_KEY=your_cloudflare_turnstile_site_key
   ```
3. Cài đặt các dependencies và build production:
   ```bash
   npm install
   npm run build
   ```
   *Lưu ý: Kết quả sau khi build thành công sẽ nằm trong thư mục `frontend/dist/`.*

---

## ⚙️ Bước 3: Cấu hình Systemd Service cho Backend

Để ứng dụng Backend tự động chạy nền và tự khởi động lại khi hệ thống restart, hãy tạo một Systemd service.

1. Tạo file service (cần quyền root/sudo):
   ```bash
   sudo nano /etc/systemd/system/hnglinh-api.service
   ```
2. Thêm nội dung cấu hình sau (chú ý đường dẫn tuyệt đối chính xác theo user):
   ```ini
   [Unit]
   Description=hnglinh Tools API Service
   After=network.target

   [Service]
   Type=simple
   User=hnglinh
   WorkingDirectory=/home/hnglinh/hnglinh-tool/backend
   Environment="PATH=/home/hnglinh/hnglinh-tool/backend/venv/bin"
   EnvironmentFile=/home/hnglinh/hnglinh-tool/backend/.env
   ExecStart=/home/hnglinh/hnglinh-tool/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --workers 2
   Restart=always
   RestartSec=3

   [Install]
   WantedBy=multi-user.target
   ```
3. Kích hoạt và khởi chạy service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable hnglinh-api
   sudo systemctl start hnglinh-api
   ```
4. Kiểm tra trạng thái của service:
   ```bash
   sudo systemctl status hnglinh-api
   ```

---

## 🌍 Bước 4: Cấu hình Nginx Web Server

Nginx sẽ đóng vai trò phục vụ file tĩnh cho Frontend React và làm Reverse Proxy để chuyển tiếp các API requests `/api/` tới Backend FastAPI (cổng 8000).

1. Tạo file cấu hình Nginx mới cho site:
   ```bash
   sudo nano /etc/nginx/sites-available/hnglinh.io.vn
   ```
2. Thêm cấu hình sau:
   ```nginx
   server {
       listen 80;
       listen [::]:80;
       server_name hnglinh.io.vn www.hnglinh.io.vn;

       # Đường dẫn tuyệt đối tới thư mục dist của Frontend
       root /home/hnglinh/hnglinh-tool/frontend/dist;
       index index.html;

       # Chuyển tiếp các request /api/ tới Backend FastAPI
       location /api/ {
           proxy_pass http://127.0.0.1:8000/api/;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
           
           # Cấu hình timeouts cho tiến trình download video/audio chạy lâu
           proxy_read_timeout 300s;
           proxy_connect_timeout 300s;
           proxy_send_timeout 300s;
           
           # Giới hạn dung lượng upload tối đa (ví dụ cho pastebin hoặc chia sẻ file)
           client_max_body_size 100M;
       }

       # Phục vụ Frontend React (SPA Routing)
       location / {
           try_files $uri $uri/ /index.html;
       }

       # Cấu hình Cache cho static assets
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }

       # Các header bảo mật cơ bản
       add_header X-Frame-Options "SAMEORIGIN" always;
       add_header X-Content-Type-Options "nosniff" always;
       add_header X-XSS-Protection "1; mode=block" always;

       # Bật nén Gzip giảm băng thông
       gzip on;
       gzip_vary on;
       gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
   }
   ```
3. Kích hoạt cấu hình và restart Nginx:
   ```bash
   # Tạo symlink kích hoạt site
   sudo ln -s /etc/nginx/sites-available/hnglinh.io.vn /etc/nginx/sites-enabled/

   # Xóa file default cấu hình mặc định của Nginx nếu có để tránh xung đột
   sudo rm -f /etc/nginx/sites-enabled/default

   # Kiểm tra cú pháp cấu hình Nginx xem có lỗi không
   sudo nginx -t

   # Khởi động lại Nginx
   sudo systemctl restart nginx
   ```

---

## 🔒 Bước 5: Cấu hình SSL (HTTPS) với Let's Encrypt

1. Chạy Certbot để tự động đăng ký chứng chỉ SSL và cấu hình chuyển hướng HTTP sang HTTPS cho Nginx:
   ```bash
   sudo certbot --nginx -d hnglinh.io.vn -d www.hnglinh.io.vn
   ```
2. Thực hiện theo hướng dẫn trên màn hình (nhập email và đồng ý điều khoản). Certbot sẽ tự động sửa cấu hình Nginx của bạn để kích hoạt HTTPS.
3. Kiểm tra tính năng tự động gia hạn chứng chỉ (auto-renewal):
   ```bash
   sudo certbot renew --dry-run
   ```

---

## 🛡️ Bước 6: Cấu hình Firewall và Fail2ban

### 6.1 Cấu hình Firewall (UFW)
Chỉ mở các cổng SSH (22), HTTP (80) và HTTPS (443):
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

### 6.2 Cài đặt Fail2ban (Chống tấn công brute-force)
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 🧹 Bước 7: Setup Cron Job tự dọn dẹp bộ nhớ tạm

Do chức năng Downloader sẽ tải các video tạm thời về thư mục `/tmp` trên hệ thống, ta cần đặt một lịch dọn dẹp các tệp cũ này để tránh đầy ổ cứng.

1. Mở trình biên tập cron job:
   ```bash
   crontab -e
   ```
2. Thêm dòng lệnh sau vào cuối file (tự động xóa các file tạm có định dạng `download_*.mp4` cũ hơn 60 phút, chạy mỗi 30 phút một lần):
   ```cron
   */30 * * * * find /tmp -name "download_*.mp4" -mmin +60 -delete
   ```

---

## 🔄 Quy trình Cập nhật Phiên bản mới (Update Code)

Mỗi khi có code mới trên Git, thực hiện các bước sau để cập nhật ứng dụng:

```bash
# Chuyển sang user hnglinh
sudo su - hnglinh
cd ~/hnglinh-tool

# Pull code mới nhất
git pull origin main

# Cập nhật backend (nếu có thư viện mới)
cd backend
source venv/bin/activate
pip install -r requirements.txt
deactivate
# Khởi động lại service Backend
sudo systemctl restart hnglinh-api

# Cập nhật frontend
cd ../frontend
npm install
npm run build
# Frontend được phục vụ trực tiếp qua Nginx nên không cần restart Nginx trừ khi đổi cấu hình nginx config.
```

---

## 📊 Quản lý và Xem Logs

### Xem log của Backend (Real-time logs)
```bash
sudo journalctl -u hnglinh-api.service -f
```

### Xem log lỗi của Nginx
```bash
sudo tail -f /var/log/nginx/error.log
```
