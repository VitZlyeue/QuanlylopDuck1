# CLASS ARENA 3.4 — ThreeUI Header

Bản này giữ ThreeUI làm thư viện giao diện cho header.

## ThreeUI components

- `TextAnimationCollection` với variant `threeui-intro` tạo hiệu ứng typography động ở cạnh tiêu đề.
- `LumenCta` tạo nút CTA của ThreeUI; sự kiện `onClick` gọi `startPresentation` để mở trình chiếu.
- Không dùng `PocketQuestCtaButton`: component này không có trong package ThreeUI Community trên npm nên gây lỗi TS2305.

## Cài đặt và chạy

```bash
npm install
npm run build
npm run dev
```

Dependency `@designcodeio/threeui` được khai báo trong `package.json`. CSS chung được import trong `src/App.tsx`.
