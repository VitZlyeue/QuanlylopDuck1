# CLASS ARENA — Classroom Game Show

Ứng dụng React + TypeScript + Vite quản lý lớp, mini-game và quiz. Không sử dụng Telegram, bot token, Chat ID hoặc máy chủ Telegram.

## Cài đặt

Yêu cầu Node.js 18 trở lên.

```bash
npm install
npm run dev
```

Mở địa chỉ Vite hiển thị trong terminal. Tạo bản production bằng `npm run build`.

## Quiz Arena và ngân hàng câu hỏi JSON

Mở **Quiz Arena → Nạp cauhoi.json**. Có thể nhập trực tiếp một mảng JSON hoặc object có thuộc tính `questions` / `cauhoi`. Chọn số câu muốn lấy cho lượt chơi; ứng dụng xáo trộn ngân hàng và lấy đúng số câu đã chọn. Điểm mỗi câu lấy từ `points` (mặc định 1). Điểm được cộng cho tổ đang chọn khi trả lời đúng.

Các dạng hỗ trợ:
- `multiple`: ABCD / trắc nghiệm; `options` là mảng chuỗi hoặc object có `key` và `text`. `correctAnswer` có thể là nội dung đáp án hoặc chữ cái A-D.
- `truefalse` (hoặc `true_false`): Đúng/Sai; `correctAnswer` nhận `true`, `false`, `Đúng`, `Sai`, `1` hoặc `0`.
- `fill`: điền/kéo từ vào chỗ trống; dùng `sentence` có dấu `____`, `words` là mảng từ lựa chọn và `correctAnswer` là từ đúng. Có thể chạm chọn từ hoặc kéo thả từ vào vùng trống.

Ví dụ đầy đủ nằm trong `cauhoi-mau.json`.

## Quản lý tổ

Mở **Quản lý tổ** để tạo không giới hạn tổ. Tên tổ mới được lưu trên trình duyệt; vào **Học sinh** để gán học sinh vào tổ bằng trường Tổ/Nhóm. Quiz Arena lấy danh sách tổ hiện có để chọn đội thi và hiển thị bảng điểm.

## Random popup

Bong bóng xúc xắc ở góc màn hình có thể mở/đóng bảng random nhanh. Có thể ẩn bong bóng trong bảng popup.

## Game Center

- Mystery Box, Lucky Wheel, Number Hunt.
- Pure Random, No Repeat, Fairness.
- Chọn nhiều người, tùy chỉnh thời gian random.
- Sân khấu trình chiếu, pháo giấy và hiệu ứng công bố người thắng.

## Lưu trữ

Danh sách học sinh, lịch sử và cài đặt được lưu cục bộ bằng IndexedDB. Sao lưu định kỳ trong **Cài đặt → Dữ liệu & sao lưu**. Tên các tổ bổ sung và điểm quiz hiện được lưu ở bộ nhớ trình duyệt của thiết bị.

## Lưu ý quản trị

Trang quản trị riêng tư có thể được bổ sung để điều chỉnh điểm với xác thực và nhật ký kiểm toán. Bản này không có cơ chế bí mật làm giả kết quả hoặc thay đổi điểm mà không để lại dấu vết.

## Quiz Arena – chế độ thi đấu theo tổ

1. Mở mục **Thiết lập Quiz**, tạo thêm các tổ cần tham gia và nạp ngân hàng câu hỏi `.json`.
2. Chọn số câu cho trận (ví dụ 10). CLASS ARENA sẽ rút ngẫu nhiên số câu đó từ ngân hàng.
3. Nhấn **Tạo trận & vào Quiz Arena** để chuyển sang trang thi đấu riêng.
4. Mỗi câu được hiển thị cho tất cả các tổ cùng trả lời. Quản trò có thể bật/tắt phần đáp án tham khảo.
5. Sau khi nghe câu trả lời, quản trò nhập điểm muốn cộng cho từng tổ và nhấn **Cộng điểm**. Mỗi tổ chỉ được cộng điểm một lần trong một câu.
6. Nhấn **Câu tiếp theo** để chuyển câu. Hết câu cuối, chọn kết thúc để xem bảng xếp hạng và vinh danh đội thắng.

Điểm được nhập thủ công; ứng dụng không tự chấm và không tự cộng điểm theo đáp án trong JSON. Đáp án trong JSON chỉ dùng làm đáp án tham khảo khi quản trò bật hiển thị.

### Điểm thưởng theo câu hỏi JSON
Mỗi câu hỏi có thể khai báo trường `points` để đặt số điểm của câu đó. Khi quản trò bấm nút cúp của một tổ trong Quiz Arena, hệ thống cộng đúng giá trị `points` của câu hiện tại cho tổ đó. Ví dụ: `"points": 10` thì mỗi lần bấm cúp sẽ cộng 10 điểm. Nếu thiếu `points`, hệ thống mặc định cộng 1 điểm. Các bí danh `score` và `diem` cũng được hỗ trợ.
