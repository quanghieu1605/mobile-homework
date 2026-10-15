# BÀI TẬP LẬP TRÌNH MOBILE APP - COURSE MANAGEMENT

## 1. Thông tin đồ án
- **Đề tài**: Xây dựng ứng dụng Quản lý khóa học (Course Management)
- **Nền tảng**: React Native (Expo Router)
- **Backend MockAPI**: [https://6ace005bf338359cf1c2d88e.mockapi.io/api/v1](https://6ace005bf338359cf1c2d88e.mockapi.io/api/v1)
  - Resources `categories`: `https://6ace005bf338359cf1c2d88e.mockapi.io/api/v1/categories`
  - Resources `courses`: `https://6ace005bf338359cf1c2d88e.mockapi.io/api/v1/courses`

---

## 2. Các chức năng đã hoàn thiện

### 2.1. Danh sách khóa học (`/` - Tab "Khóa học")
- Lấy và hiển thị toàn bộ khóa học từ MockAPI: ảnh bìa, tên khóa học, tên giảng viên, danh mục (map động từ API categories), học phí (format chuẩn VNĐ), thời lượng.
- Tìm kiếm tức thì theo tên khóa học (không phân biệt hoa thường).
- Lọc khóa học theo danh mục động (hiển thị số lượng khóa học trong từng danh mục).
- Kéo xuống để làm mới danh sách (Pull-to-refresh).
- Tự động làm mới dữ liệu khi thêm, sửa hoặc xóa khóa học quay về màn hình chính.
- Xử lý các trạng thái: Đang tải (Loading), Danh sách rỗng (Empty state), Lỗi kết nối (Error handling with Retry).
- Ảnh bìa có fallback placeholder khi URL lỗi hoặc không tải được.

### 2.2. Chi tiết khóa học (`/course-detail?id=...`)
- Hiển thị đầy đủ thông tin: Ảnh bìa, Tiêu đề, Badge danh mục, Học phí, Giảng viên, Thời lượng, Ngày tạo (`createdAt`), Mô tả khóa học.
- **Phát video trailer**:
  - Hỗ trợ phát video MP4 trực tiếp qua `expo-video` (có trình phát kèm controls đầy đủ, nút Phát / Tạm dừng).
  - Tự động nhận diện liên kết YouTube và hỗ trợ mở trên ứng dụng YouTube / trình duyệt.
- Thao tác chỉnh sửa: Chuyển sang form chỉnh sửa với dữ liệu được nạp sẵn.
- Thao tác xóa: Hiển thị hộp thoại xác nhận (Alert confirm), xóa trên MockAPI và tự động đồng bộ quay về trang chủ.

### 2.3. Thêm & Chỉnh sửa khóa học (`/course-form`)
- Form nhập liệu trực quan với đầy đủ các trường:
  - Tên khóa học (bắt buộc)
  - Danh mục: chọn từ Dropdown / Modal selector lấy dữ liệu trực tiếp từ API categories
  - Giảng viên (bắt buộc)
  - Học phí (bắt buộc, kiểm tra số không âm $\ge 0$ VNĐ)
  - Thời lượng (bắt buộc, kiểm tra số $> 0$ giờ)
  - Mô tả khóa học (bắt buộc)
  - URL ảnh bìa (có xem trước Preview ảnh và báo lỗi khi link hỏng)
  - URL video trailer
- Kiểm tra dữ liệu (validation) chặt chẽ trước khi gửi request.
- Hỗ trợ cả 2 chế độ: Thêm mới (POST) và Cập nhật (PUT).

### 2.4. Quản lý danh mục (`/explore` - Tab "Danh mục")
- Hiển thị danh sách danh mục kèm số lượng khóa học trực thuộc.
- Thêm mới danh mục qua Modal popup với validation tên bắt buộc.
- Chỉnh sửa tên và mô tả danh mục đã có.
- **Ràng buộc kiểm tra phía ứng dụng (Client-side validation)**:
  - **Không cho phép xóa danh mục đang có khóa học**: Nếu danh mục có khóa học liên kết, ứng dụng sẽ hiện cảnh báo ngăn chặn xóa và yêu cầu xóa/chuyển khóa học trước.
  - Cho phép xóa khi danh mục không còn khóa học nào sau khi người dùng xác nhận.

---

## 3. Hướng dẫn chạy ứng dụng

### Yêu cầu môi trường:
- Node.js $\ge 18$
- Trình quản lý gói `npm` hoặc `yarn`
- Điện thoại cài ứng dụng **Expo Go** (Android/iOS) hoặc máy ảo Android Emulator / iOS Simulator / Trình duyệt Web.

### Các bước khởi chạy:

1. **Cài đặt thư viện phụ thuộc:**
   ```bash
   npm install
   ```

2. **Khởi động dự án Expo:**
   ```bash
   npx expo start
   ```

3. **Mở ứng dụng:**
   - **Android / iOS**: Quét mã QR hiển thị trên Terminal bằng ứng dụng **Expo Go** hoặc camera điện thoại.
   - **Chạy trên Web**: Nhấn phím `w` trong Terminal.
   - **Chạy trên Android Emulator**: Nhấn phím `a`.
