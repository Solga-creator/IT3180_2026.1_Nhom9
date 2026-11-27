# BlueMoon — Bộ thiết kế Sprint 2

Ngày cập nhật: 28/11/2026. Có **34 board Sprint 2 mới**, phủ 11 US, cùng phong cách teal/navy và typography với bộ Sprint 1. Thiết kế đang được bàn giao bằng SVG và gallery HTML vì quota Figma MCP Starter vẫn chặn ghi vào file Figma native.

## Mở bản xem trước

- Gallery: `index.html`, hoặc `http://localhost:5175/#12-bang-thu` khi server xem trước còn chạy.
- ZIP riêng S2: `bluemoon-sprint2-figma-import.zip`; giải nén rồi kéo SVG vào Figma Design.
- Bấm các nút chính trên màn hình mẫu để chuyển bước, hoặc chọn trực tiếp ở thanh trái. Các scene là độc lập, không phải ứng dụng có state nghiệp vụ.
- Không in/thu tiền/cập nhật quyền/xuất Excel thật trong prototype; chỉ nút tải SVG bên ngoài gallery tải artifact thiết kế.

## Phủ User Story

| User Story | Board | Luồng / trạng thái |
|---|---|---|
| `US-006` | 10 | Chốt đơn giá, ngày hiệu lực, lịch sử giá |
| `US-007` | 19–21, 34, 41 | Danh sách quỹ, tạo đợt, chi tiết, xác nhận đóng và trạng thái đã đóng |
| `US-008` | 11–12, 29, 32 | Preview, phát hành, bảng thu, hủy/thay hóa đơn sai, preview cũ/thiếu dữ liệu |
| `US-009` | 24, 27–28, 39, 43 | Xem giấy báo, bản in, lối vào in nhiều bản, cư dân xem giấy báo |
| `US-010` | 12–16, 27, 31, 37, 42 | Thu tiền, phân bổ, xác nhận, biên lai, hủy thu, mất phản hồi, chứng từ đã hủy |
| `US-011` | 19, 21–23, 33–34, 38 | Ghi ủng hộ, biên nhận, hủy ghi nhầm, chặn thu khi đóng đợt |
| `US-012` | 12, 17, 27–28, 30, 36, 43 | Công nợ theo hộ/kỳ, hộ cũ/hộ mới, cư dân xem phần của mình, không có kết quả |
| `US-013` | 18, 23, 27–28, 37–38, 42 | Lịch sử hợp lệ/hủy, chứng từ của hộ và trên điện thoại |
| `US-014` | 24, 40 | Báo cáo theo kỳ hóa đơn và theo tháng thực thu |
| `US-018` | 25, 35 | Phân quyền tài khoản và xác nhận đổi vai trò |
| `US-019` | 16, 18, 26, 29–30, 33, 35, 42 | Audit trước/sau/lý do, các thao tác có lưu vết |

## Danh mục màn hình

| Board | File SVG |
|---|---|
| 10 · Đơn giá | `10-don-gia.svg` |
| 11 · Xem trước/phát hành | `11-preview-bang-thu.svg` |
| 12 · Bảng thu | `12-bang-thu.svg` |
| 13 · Thu tiền | `13-thu-tien.svg` |
| 14 · Xác nhận thu | `14-xac-nhan-thu.svg` |
| 15 · Biên lai | `15-bien-lai.svg` |
| 16 · Hủy thu | `16-huy-thu.svg` |
| 17 · Công nợ | `17-cong-no.svg` |
| 18 · Lịch sử | `18-lich-su.svg` |
| 19 · Các quỹ | `19-quy-tu-nguyen.svg` |
| 20 · Tạo đợt | `20-tao-dot-quy.svg` |
| 21 · Chi tiết quỹ | `21-chi-tiet-quy.svg` |
| 22 · Ghi đóng góp | `22-ghi-dong-gop.svg` |
| 23 · Biên nhận quỹ | `23-bien-nhan-quy.svg` |
| 24 · Báo cáo theo kỳ | `24-bao-cao.svg` |
| 25 · Phân quyền | `25-phan-quyen.svg` |
| 26 · Audit | `26-nhat-ky.svg` |
| 27 · Cư dân xem phí | `27-cu-dan-hoa-don.svg` |
| 28 · Cư dân trên điện thoại | `28-mobile-hoa-don.svg` |
| 29 · Thay hóa đơn sai | `29-thay-hoa-don.svg` |
| 30 · Chuyển hộ | `30-chuyen-ho.svg` |
| 31 · Mất phản hồi | `31-mat-ket-noi.svg` |
| 32 · Preview lỗi thời | `32-preview-cu.svg` |
| 33 · Hủy đóng góp | `33-huy-dong-gop.svg` |
| 34 · Đợt đã đóng | `34-quy-da-dong.svg` |
| 35 · Xác nhận quyền | `35-xac-nhan-quyen.svg` |
| 36 · Không có kết quả | `36-khong-ket-qua.svg` |
| 37 · Biên lai của cư dân | `37-cu-dan-bien-lai.svg` |
| 38 · Biên nhận quỹ của cư dân | `38-cu-dan-bien-nhan.svg` |
| 39 · Giấy báo phí | `39-giay-bao.svg` |
| 40 · Tháng thực thu | `40-bao-cao-thuc-thu.svg` |
| 41 · Xác nhận đóng đợt | `41-xac-nhan-dong-quy.svg` |
| 42 · Biên lai đã hủy | `42-bien-lai-da-huy.svg` |
| 43 · Giấy báo của cư dân | `43-cu-dan-giay-bao.svg` |

## Luồng nên xem trước

1. 10 → 11 → 12: giá → preview → phát hành.
2. 12 → 13 → 14 → 15: chọn phòng → thu → xác nhận → biên lai.
3. 15 → 16 → 42 → 18: hủy thu → chứng từ hủy → lịch sử.
4. 19 → 20 → 21 → 22 → 23: quỹ → đợt → ghi nhận → biên nhận.
5. 21 → 41 → 34; 23 → 33: đóng đợt, hủy đóng góp.
6. 24 ↔ 40: phân biệt kỳ hóa đơn và tháng thực thu.
7. 25 → 35 → 25; 26: quyền có xác nhận và audit trước/sau.
8. 27 → 37/38/43, 28: cư dân xem chứng từ của hộ; có mẫu điện thoại.

## Giới hạn và bàn giao tiếp theo

- Bao phủ 11 US ở mức thiết kế các màn hình/trạng thái chính, không có nghĩa mọi tổ hợp lỗi hoặc breakpoint đã có board riêng.
- Scene dùng dữ liệu mẫu độc lập. Có luồng bấm được để rà soát thao tác, chưa có xử lý form, tính tiền, lưu dữ liệu hoặc kiểm quyền thực tế.
- Dữ liệu trên một số trạng thái là trước/sau giao dịch để mô tả kết quả; không dùng việc nhảy scene làm bằng chứng số dư được tính bởi prototype.
- Figma native, Auto Layout, component/variable bindings và liên kết prototype trong Figma chưa được tạo do quota. SVG không được coi là sản phẩm tương đương hoàn toàn với file Figma native.
- Chưa áp dụng vào frontend. Khi triển khai phải nối API, quyền và logic ở thiết kế kỹ thuật Sprint 2; không chỉ sao chép hình thức.
