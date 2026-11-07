# 📚 Truyen - Ứng Dụng Đọc Truyện Tranh & Truyện Chữ Cá Nhân

Dự án đọc truyện tranh (Manga, Manhwa, Manhua) và truyện chữ (tiểu thuyết) offline / cá nhân được xây dựng trên nền tảng **Next.js 16 (App Router)** và **Tailwind CSS**.

---

## 🚀 Khởi Chạy Ứng Dụng

Cài đặt các gói phụ thuộc (nếu chưa có):
```bash
npm install
```

Khởi chạy máy chủ phát triển:
```bash
npm run dev
```

Mở trình duyệt truy cập: [http://localhost:3000](http://localhost:3000)

- **Trang chủ / Online:** [http://localhost:3000](http://localhost:3000)
- **Thư viện truyện đã cào về máy:** [http://localhost:3000/thu-vien](http://localhost:3000/thu-vien)

---

## 🕷️ Hướng Dẫn Cào Truyện Về Thư Viện Cá Nhân (Crawler Scripts)

Dự án cung cấp sẵn 5 công cụ cào truyện tự động từ các nguồn phổ biến vào thư mục `data/library/<slug>/`:

### 1. HiNetTruyen (`hinettruyen.com`)
*Script cào truyện tranh Manga/Manhwa/Manhua từ HiNetTruyen, hỗ trợ tự động lấy đầy đủ danh sách hàng trăm chương thông qua API, tải bìa WebP và vượt tường lửa chặn hotlink ảnh.*

- **Script:** `scripts/crawl-hinettruyen.mjs`
- **Cú pháp:**
  ```bash
  node scripts/crawl-hinettruyen.mjs <url-hoac-slug-truyen> [slug-thu-vien] "[Tên hiển thị]" [--limit=N]
  ```
- **Ví dụ cào full truyện:**
  ```bash
  node scripts/crawl-hinettruyen.mjs "https://hinettruyen.com/truyen-tranh/do-de-cua-ta-deu-la-dai-phan-phai" do-de-phan-phai "Đồ Đệ Của Ta Đều Là Đại Phản Phái"
  ```
- **Ví dụ cào thử 5 chương đầu:**
  ```bash
  node scripts/crawl-hinettruyen.mjs "https://hinettruyen.com/truyen-tranh/do-de-cua-ta-deu-la-dai-phan-phai" do-de-phan-phai "Đồ Đệ Của Ta" --limit=5
  ```

---

### 2. TruyenQQ (`truyenqq.com.vn`)
*Script cào truyện tranh từ TruyenQQ, tự động trích xuất thông tin tác giả, thể loại, tình trạng, tải bìa WebP và chuyển tiếp ảnh qua proxy hotlink.*

- **Script:** `scripts/crawl-truyenqq.mjs`
- **Cú pháp:**
  ```bash
  node scripts/crawl-truyenqq.mjs <url-truyenqq> [slug-thu-vien] "[Tên hiển thị]"
  ```
- **Ví dụ:**
  ```bash
  node scripts/crawl-truyenqq.mjs "https://truyenqq.com.vn/o-long-vien" o-long-vien "Ô Long Viện"
  ```
  *(Nếu không nhập slug và tên truyện, script sẽ tự động trích xuất từ liên kết)*

---

### 3. NetTruyen (`nettruyen.cx`)
*Script cào truyện tranh từ NetTruyen, hỗ trợ tự động phát hiện mirror ảnh server chất lượng cao.*

- **Script:** `scripts/crawl-manga.mjs`
- **Cú pháp:**
  ```bash
  node scripts/crawl-manga.mjs <url-truyen> [slug-thu-vien] "[Tên hiển thị]" [--limit=N] [--start=N]
  ```
- **Ví dụ:**
  ```bash
  node scripts/crawl-manga.mjs https://nettruyen.cx/truyen-tranh/berserk berserk "Berserk"
  ```
- **Tùy chọn hữu ích:**
  - `--limit=10`: Chỉ tải 10 chương.
  - `--start=50`: Bắt đầu tải từ chương index 50 trở đi.

---

### 4. Diễn Đàn TuThienBao (`tuthienbao.com`)
*Script cào trọn bộ các tập truyện tranh được upload tuần tự trong các chuyên mục diễn đàn TuThienBao (ví dụ: Tý Quậy, truyện scan thiếu nhi).*

- **Script:** `scripts/crawl-tuthienbao.mjs`
- **Cú pháp:**
  ```bash
  node scripts/crawl-tuthienbao.mjs <url-thread-hoac-forum> [slug-thu-vien] "[Tên hiển thị]"
  ```
- **Ví dụ cào full Tý Quậy (10 tập):**
  ```bash
  node scripts/crawl-tuthienbao.mjs "https://tuthienbao.com/forum/showthread.php?p=385299" ty-quay "Tý Quậy"
  ```

---

### 5. Blogspot (Truyện chữ / Tiểu thuyết)
*Script cào tiểu thuyết, truyện dài kỳ theo dạng bài đăng nối tiếp trên Blogspot (đi theo nút bài đăng mới hơn).*

- **Script:** `scripts/crawl-blogspot.mjs`
- **Cú pháp:**
  ```bash
  node scripts/crawl-blogspot.mjs <url-chuong-1> <slug-thu-vien> "<Tên hiển thị>"
  ```
- **Ví dụ cào truyện Tán Gái Sư Phạm:**
  ```bash
  node scripts/crawl-blogspot.mjs "https://truyentinhcambuon.blogspot.com/2017/02/tan-gai-su-pham-chap-1.html" tan-gai-su-pham "Tán Gái Sư Phạm"
  ```

---

## 💡 Cơ Chế Hoạt Động & Lưu Ý

1. **Tính năng Resume (Chống tải trùng):**
   - Tất cả script đều lưu dữ liệu vào `data/library/<slug>/story.json` và từng chương tại `data/library/<slug>/chapters/<chuong>.json`.
   - Khi chạy lại, crawler sẽ tự động kiểm tra xem chương nào đã có trên ổ cứng thì **bỏ qua**, giúp tiết kiệm thời gian và tài nguyên khi tiếp tục các bộ truyện dài.

2. **Xử lý ảnh chống Hotlink (403 Forbidden):**
   - Các trang như TruyenQQ và HiNetTruyen sử dụng CDN chặn truy cập trực tiếp nếu thiếu trường HTTP `Referer`.
   - Dự án đã tích hợp route proxy [`app/api/proxy-image/route.ts`](app/api/proxy-image/route.ts) tự động chèn header Referer phù hợp và cache ảnh 7 ngày (`immutable`), đảm bảo hiển thị mượt mà trên giao diện đọc truyện.

3. **Ảnh bìa truyện:**
   - Ảnh bìa được tải và nén tự động thành định dạng hiện đại `.webp` lưu tại thư mục `public/covers/<slug>.webp`.

---

## 🛠️ Build & Kiểm Tra Dự Án

Kiểm tra lỗi mã nguồn và build production:
```bash
npm run build
```
Chạy bản production:
```bash
npm run start
```
