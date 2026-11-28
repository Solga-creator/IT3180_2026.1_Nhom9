# Báo cáo thực thi kiểm thử Sprint 2

Cập nhật mẫu 28/11/2026. **Chưa thực thi Sprint 2; chưa có kết quả PASS hoặc nghiệm thu DB thật.** Đây là sổ kết quả, không thay thế [test plan](test-plan-and-cases-s2.md).

## 1. Thông tin lần chạy

| Trường | Giá trị |
|---|---|
| Run ID / ngày giờ VN / người chạy | Chưa ghi nhận |
| Commit / branch / working tree hoặc diff đính kèm | Chưa ghi nhận |
| OS / Node / npm / phiên bản MySQL hoặc TiDB | Chưa ghi nhận |
| Môi trường frontend/backend / DB thử (không secret) | Chưa ghi nhận |
| Migration và mốc lịch sử đã áp dụng | Chưa ghi nhận |
| Bộ fixture / clock thử / quyết định đã chốt | Chưa ghi nhận |
| Lệnh chạy / cấu hình đã che secret | Chưa ghi nhận |
| Log, ảnh, request/response, Excel/PDF | Chưa ghi nhận |

Không ghi password, token, chuỗi kết nối có secret hoặc CCCD thật. DB thử phải được xác minh trước khi chạy migration/reset/restore.

## 2. Tổng hợp hiện tại

| Phạm vi | Đã thực thi | Pass | Fail | Blocked | Chưa thực thi |
|---|---:|---:|---:|---:|---:|
| 43 ca chức năng FTC-S2 trong phạm vi | 0 | 0 | 0 | 0 | 43 |
| E2E / OPS / PERF / UX | 0 | 0 | 0 | 0 | 4 |

Đây là số **ca nghiệm thu trong kế hoạch**, không phải số unit test trong runner. Không báo tỷ lệ thành công khi chưa chạy. FTC-S2-27 và FTC-S2-30 nằm ngoài phạm vi, không tính vào 43 ca chức năng và 4 ca nghiệm thu (47 ca cần thực thi). Test mới bổ sung ngoài 47 ca phải được ghi riêng, cập nhật cả test plan và tổng số trước khi tổng hợp.

## 3. Kết quả từng ca

| TC | Trạng thái | Run ID / kết quả thực tế | Bằng chứng / Bug ID |
|---|---|---|---|
| `FTC-S2-01` | Chưa thực thi | — | — |
| `FTC-S2-02` | Chưa thực thi | — | — |
| `FTC-S2-03` | Chưa thực thi | — | — |
| `FTC-S2-04` | Chưa thực thi | — | — |
| `FTC-S2-05` | Chưa thực thi | — | — |
| `FTC-S2-06` | Chưa thực thi | — | — |
| `FTC-S2-07` | Chưa thực thi | — | — |
| `FTC-S2-08` | Chưa thực thi | — | — |
| `FTC-S2-09` | Chưa thực thi | — | — |
| `FTC-S2-10` | Chưa thực thi | — | — |
| `FTC-S2-11` | Chưa thực thi | — | — |
| `FTC-S2-12` | Chưa thực thi | — | — |
| `FTC-S2-13` | Chưa thực thi | — | — |
| `FTC-S2-14` | Chưa thực thi | — | — |
| `FTC-S2-15` | Chưa thực thi | — | — |
| `FTC-S2-16` | Chưa thực thi | — | — |
| `FTC-S2-17` | Chưa thực thi | — | — |
| `FTC-S2-18` | Chưa thực thi | — | — |
| `FTC-S2-19` | Chưa thực thi | — | — |
| `FTC-S2-20` | Chưa thực thi | — | — |
| `FTC-S2-21` | Chưa thực thi | — | — |
| `FTC-S2-22` | Chưa thực thi | — | — |
| `FTC-S2-23` | Chưa thực thi | — | — |
| `FTC-S2-24` | Chưa thực thi | — | — |
| `FTC-S2-25` | Chưa thực thi | — | — |
| `FTC-S2-26` | Chưa thực thi | — | — |
| `FTC-S2-27` | Ngoài phạm vi v1.0 | DEC-02/03, chốt 28/11/2026 | Không tính vào tổng cần thực thi |
| `FTC-S2-28` | Chưa thực thi | — | — |
| `FTC-S2-29` | Chưa thực thi | — | — |
| `FTC-S2-30` | Ngoài phạm vi v1.0 | DEC-02/03, chốt 28/11/2026 | Không tính vào tổng cần thực thi |
| `FTC-S2-31` | Chưa thực thi | — | — |
| `FTC-S2-32` | Chưa thực thi | — | — |
| `FTC-S2-33` | Chưa thực thi | — | — |
| `FTC-S2-34` | Chưa thực thi | — | — |
| `FTC-S2-35` | Chưa thực thi | — | — |
| `FTC-S2-36` | Chưa thực thi | — | — |
| `FTC-S2-37` | Chưa thực thi | — | — |
| `FTC-S2-38` | Chưa thực thi | — | — |
| `FTC-S2-39` | Chưa thực thi | — | — |
| `FTC-S2-40` | Chưa thực thi | — | — |
| `FTC-S2-41` | Chưa thực thi | — | — |
| `FTC-S2-42` | Chưa thực thi | — | — |
| `FTC-S2-43` | Chưa thực thi | — | — |
| `FTC-S2-44` | Chưa thực thi | — | — |
| `FTC-S2-45` | Chưa thực thi | — | — |
| `E2E-S2-01` | Chưa thực thi | — | — |
| `OPS-S2-01` | Chưa thực thi | — | — |
| `PERF-S2-01` | Chưa thực thi | — | — |
| `UX-S2-01` | Chưa thực thi | — | — |

## 4. Lỗi và lần chạy lại

| Bug ID / mức ảnh hưởng | TC/FX liên quan | Bước tái hiện và thực tế | Mong đợi | Bằng chứng | Người xử lý / phiên bản sửa | Kết quả chạy lại |
|---|---|---|---|---|---|---|
| Chưa ghi nhận | — | — | — | — | — | Chưa thực thi |

Giữ kết quả cũ và thêm Run ID mới khi chạy lại; không ghi đè Fail thành Pass mà mất bằng chứng. Mỗi ca Pass/Fail phải có kết quả thực tế, không sao chép cột mong đợi làm bằng chứng.

## 5. Nghiệm thu DB thật, vận hành và giao diện

- [ ] Transaction/unique/khóa dòng: thu đồng thời, trùng key cùng/khác payload, replay sau commit/hủy.
- [ ] Audit lỗi rollback thao tác; phát hành lỗi giữa batch không để kỳ nửa vời.
- [ ] Migration 6 bảng chạy lại và tiếp tục sau lỗi; đổi đại diện cùng hộ giữ snapshot, chặn xóa dữ liệu có chứng từ. Không nghiệm thu chuyển giao hộ/lịch sử diện tích.
- [ ] Backup trước migration/nghiệm thu và restore ít nhất một lần trên DB riêng: thời gian và đối chiếu dữ liệu/tổng tiền; ghi nhận kết quả thực tế. Chưa yêu cầu backup tự động/RPO/RTO.
- [ ] Hiệu năng DEC-10/PERF-S2-01: 100 căn/400 nhân khẩu/6 kỳ/1.000 khoản thu/3 phiên, >=100 request sau warm-up; p95 API <2s, sinh kỳ/Excel <10s; kiểm hai người cùng thu, ghi máy/mạng/DB; chưa đo không ghi đạt.
- [ ] UI desktop/390px, bàn phím/focus/Escape, retry, in A4/A5, Excel cùng bộ lọc.
- [ ] Hồi quy S1 được chạy lại theo code tích hợp; không lấy báo cáo baseline cũ làm kết quả mới.

Checkbox trống nghĩa chưa có bằng chứng. Chỉ kết luận S2 Done theo [Definition of Done](sprint2-implementation-plan.md) khi đủ tiêu chí và người review xác nhận.

## 6. Kết luận lần chạy

**Hiện tại: Chưa đủ bằng chứng nghiệm thu Sprint 2.**

Khi thực thi, ghi phạm vi đã đạt, ca fail/blocked/chưa chạy, rủi ro còn lại và người review/ngày/bằng chứng. Không dùng một dòng “all tests pass” thay cho kết quả chi tiết.
