# Spec Template

Mỗi Spec phải tuân theo template này. Không viết tự do — tiết kiệm token.

## Template (≤200 tokens)

### Mục tiêu
[1 câu: kết quả cuối cùng user muốn]

### Phạm vi
- [ ] [Việc 1]
- [ ] [Việc 2]
- [ ] [Việc 3]

### Cách kiểm tra
1. [Bước verify 1]
2. [Bước verify 2]

### Ngoài phạm vi
[1 câu: những gì KHÔNG làm]

---

## Ví dụ

### Mục tiêu
Thêm nút "Xuất PDF" ở trang báo cáo, click ra file PDF.

### Phạm vi
- [ ] Thêm button "Xuất PDF" vào ReportPage
- [ ] API endpoint POST /api/export/pdf
- [ ] Generate PDF bằng pdfkit

### Cách kiểm tra
1. Click "Xuất PDF" → tải được file .pdf
2. PDF chứa đúng dữ liệu báo cáo hiện tại

### Ngoài phạm vi
Không làm xuất Excel, không làm preview PDF.

---

## Rules
- Mục tiêu: 1 câu duy nhất
- Phạm vi: max 5 mục, mỗi mục ≤10 từ
- Cách kiểm tra: max 3 bước
- Ngoài phạm vi: 1 câu
- Tổng Spec ≤200 tokens
- Không thêm sections khác
