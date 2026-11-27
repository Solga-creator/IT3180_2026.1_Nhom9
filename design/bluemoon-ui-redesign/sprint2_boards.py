"""Sprint 2 vector screens and navigable review states; never call app APIs."""
def add_sprint2(Board, C, add, boards):
    phase = "Sprint 2 · Thiết kế"
    def link(b,x,y,w,h,key,label):
        from html import escape
        b.parts.append(f'<a href="#{key}" data-screen="{key}" aria-label="{escape(label)}"><title>{escape(label)}</title><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="transparent"/></a>')
    def button(b,x,y,w,label,key=None,kind="primary",h=42,icon=None):
        b.button(x,y,w,label,kind,icon,h)
        if key:link(b,x,y,w,h,key,label)
    def screen(title,sub,active="Thu phí & công nợ",resident=False):
        b=Board(title);b.header(title,sub,active=active,resident=resident,finance=not resident)
        if not resident:
            b.icon(26,444,"clock",C["brand"] if active=="Nhật ký" else None)
            b.text(58,461,"Nhật ký",14,C["brand"] if active=="Nhật ký" else C["muted"])
            for y,key in [(126,"01-can-ho"),(177,"02-nhan-khau"),(228,"04-tai-khoan-cu-dan"),(279,"25-phan-quyen"),(330,"12-bang-thu"),(381,"19-quy-tu-nguyen"),(433,"26-nhat-ky")]:link(b,14,y,197,43,key,"Mở màn hình")
        return b
    def note(b,y,title,desc,kind="brand"):
        bg,fg=(C["soft"],C["brand"]) if kind=="brand" else (C["amberbg"],C["amber"])
        b.rect(260,y,1144,68,bg,10);b.text(280,y+26,title,14,fg,600);b.text(280,y+49,desc,12,C["muted"])
    def field(b,x,y,w,label,value,select=False):
        b.text(x,y,label,13,weight=600);b.input(x,y+14,w,value)
        if select:b.icon(x+w-33,y+28,"down",size=17)
    def card(b,x,y,w,h,title):
        b.rect(x,y,w,h,C["white"],12,C["line"]);b.text(x+24,y+36,title,18,weight=650)
    def modal(title,sub,base="12-bang-thu",w=600,y=145,h=690):
        b=screen("Thu phí & công nợ","Phòng 050 · Nguyễn Văn An · Tháng 11/2026")
        b.rect(260,208,1144,650,C["white"],12,C["line"])
        b.text(286,245,"Phòng 050",18,weight=650);b.text(286,277,"Kỳ tháng 11/2026 · Còn nợ 310.000 ₫",14,C["muted"])
        b.rect(0,0,1440,1000,C["navy"],0);b.parts[-1]=b.parts[-1].replace('/>',' opacity="0.28"/>')
        x=(1440-w)/2;b.rect(x,y,w,h,C["white"],16);b.text(x+30,y+43,title,23,weight=700);b.text(x+30,y+75,sub,14,C["muted"]);b.icon(x+w-48,y+25,"close");link(b,x+w-58,y+16,42,42,base,"Đóng hộp thoại");b.line(x+30,y+99,x+w-30,y+99)
        return b,x,y
    def save(key,title,b,us):
        add(key,title,b,phase)
        boards[-1]["stories"]=us
    def money(n):return f"{n:,}".replace(",",".")+" ₫"

    b=screen("Đơn giá & kỳ thu","Giá có ngày hiệu lực. Chứng từ đã phát hành luôn giữ nguyên.")
    card(b,260,210,552,388,"Đơn giá áp dụng")
    field(b,284,292,504,"Phí dịch vụ / m² / tháng","6.000 ₫")
    field(b,284,385,504,"Phí quản lý / m² / tháng","7.500 ₫")
    field(b,284,478,504,"Áp dụng từ","01/12/2026")
    button(b,611,535,177,"Xem trước kỳ thu","11-preview-bang-thu")
    card(b,836,210,568,388,"Lịch sử đơn giá")
    for i,(date,a,c) in enumerate([("01/11/2026","6.000 ₫","7.500 ₫"),("01/10/2026","5.500 ₫","7.000 ₫")]):
        y=287+i*115;b.text(860,y,date,16,weight=650);b.text(860,y+31,"Dịch vụ: "+a,14,C["muted"]);b.text(1110,y+31,"Quản lý: "+c,14,C["muted"]);b.line(860,y+55,1380,y+55)
    note(b,637,"Kiểm tra trước khi lưu","Phí dịch vụ 2.500–16.500 ₫/m²; phí quản lý từ 7.000 ₫/m². Đơn giá cũ vẫn được lưu.")
    button(b,260,743,184,"Lưu đơn giá","11-preview-bang-thu")
    save("10-don-gia","Đơn giá & ngày hiệu lực",b,["US-006"])

    b=screen("Xem trước bảng thu","Kiểm tra một lần trước khi phát hành. Chưa tạo hóa đơn ở bước này.")
    field(b,260,222,260,"Kỳ thu","Tháng 12/2026",True)
    button(b,1198,235,206,"Xem lại đơn giá","10-don-gia","secondary")
    for x,label,val,foot in [(260,"Căn đủ điều kiện","6","căn hộ"),(650,"Căn bỏ qua","0","căn trống đầu kỳ"),(1040,"Tổng dự kiến","5.872.500 ₫","kỳ 12/2026")]:b.metric(x,315,364,label,val,foot)
    note(b,446,"Chốt dữ liệu tại ngày 01/12/2026","Dịch vụ 6.000 ₫/m² · Quản lý 7.500 ₫/m² · Diện tích và hộ chịu phí theo lịch sử đầu kỳ.")
    def previewrow(d,y,r):
        for x,t in zip([282,470,730,940,1170],r):d.text(x,y+38,t,14,weight=600 if x==282 else 400)
    b.table(548,[(282,"PHÒNG"),(470,"HỘ CHỊU PHÍ"),(730,"DIỆN TÍCH"),(940,"ĐƠN GIÁ DV / QL"),(1170,"PHẢI THU")],[("050","Nguyễn Văn An","60 m²","6.000 / 7.500","810.000 ₫"),("101","Lê Hoàng Nam","75,5 m²","6.000 / 7.500","1.019.250 ₫"),("102","Đặng Quốc Bảo","68 m²","6.000 / 7.500","918.000 ₫")],previewrow)
    b.text(260,856,"Đang hiển thị 3 / 6 căn minh họa. Bản xem trước có hiệu lực 10 phút.",12,C["muted"])
    button(b,260,895,126,"Quay lại","10-don-gia","secondary");button(b,1124,895,280,"Xác nhận phát hành","12-bang-thu")
    save("11-preview-bang-thu","Xem trước & phát hành",b,["US-008"])

    b=screen("Thu phí & công nợ","Tìm căn hộ, kiểm tra số dư và thu tiền tại cùng một nơi.")
    b.input(260,211,184,"Tháng 11/2026");b.icon(410,225,"down");b.input(460,211,550,"Tìm số phòng hoặc chủ hộ","search")
    button(b,1026,211,162,"Chuẩn bị kỳ mới","10-don-gia","secondary");button(b,1204,211,200,"Xuất báo cáo","24-bao-cao","secondary",icon="download")
    for x,label,val,foot,accent in [(260,"Phải thu kỳ này","5.872.500 ₫","6 hóa đơn",False),(650,"Đã thu kỳ này","2.500.000 ₫","giao dịch hợp lệ",False),(1040,"Còn nợ kỳ này","3.372.500 ₫","4 căn chưa đủ",True)]:b.metric(x,285,364,label,val,foot,accent)
    for x,w,t,key in [(260,140,"Tất cả · 6","12-bang-thu"),(410,170,"Chưa nộp đủ · 4","17-cong-no"),(590,170,"Lịch sử giao dịch","18-lich-su")]:button(b,x,420,w,t,key,"secondary",h=36)
    def billrow(d,y,r):
        room,name,due,paid=r;debt=due-paid;d.text(282,y+25,room,16,weight=650);d.text(350,y+25,name,13);d.text(700,y+25,money(due),13);d.text(894,y+25,money(paid),13);d.text(1080,y+25,money(debt),14,C["amber"] if debt else C["green"],600)
        button(d,1250,y+9,130,"Thu tiền" if debt else "Biên lai","13-thu-tien" if debt else "15-bien-lai","primary" if debt else "secondary",h=36)
    b.table(480,[(282,"PHÒNG / CHỦ HỘ"),(700,"PHẢI THU"),(894,"ĐÃ THU"),(1080,"CÒN NỢ"),(1250,"THAO TÁC")],[("050","Nguyễn Văn An",810000,500000),("101","Lê Hoàng Nam",1019250,0),("102","Đặng Quốc Bảo",918000,918000),("201","Vũ Thị Mai",1107000,1082000),("202","Nguyễn Minh Anh",735750,0),("301","Bùi Thanh Tùng",1282500,0)],billrow,height=58)
    button(b,260,936,180,"Xem nợ các kỳ trước","17-cong-no","secondary");button(b,1160,936,244,"In nhiều giấy báo","24-bao-cao","secondary")
    save("12-bang-thu","Bảng thu & tra cứu nhanh",b,["US-008","US-010","US-012"])

    b=screen("Thu tiền phòng 050","Giữ nguyên căn hộ và kỳ thu. Chỉ xác nhận một khoản thu mỗi lần.")
    card(b,260,210,540,610,"Nguyễn Văn An · Phòng 050")
    b.text(284,289,"Kỳ đang thu",13,C["muted"]);b.text(775,289,"Tháng 11/2026",15,weight=600,anchor="end")
    for y,l,v in [(347,"Phải thu","810.000 ₫"),(395,"Đã thu","500.000 ₫"),(443,"Còn nợ","310.000 ₫")]:b.text(284,y,l,14,C["muted"]);b.text(775,y,v,20 if y==443 else 15,C["brand"] if y==443 else C["ink"],650,"end")
    b.line(284,480,776,480);b.text(284,521,"Các kỳ của hộ",16,weight=650);b.badge(284,544,"11/2026 · 310.000 ₫","amber",210);b.badge(284,588,"10/2026 · Đã nộp đủ","neutral",210)
    button(b,284,696,210,"Xem lịch sử / giấy báo","18-lich-su","secondary")
    card(b,824,210,580,610,"Ghi nhận khoản thu")
    field(b,848,294,532,"Số tiền cư dân nộp","200.000 ₫")
    b.text(848,376,"Hình thức",13,weight=600);button(b,848,392,245,"Tiền mặt",None,"secondary");button(b,1105,392,275,"Chuyển khoản",None,"primary")
    field(b,848,482,532,"Người nộp","Nguyễn Văn An")
    b.rect(848,566,532,100,C["soft"],10);b.text(868,596,"Phân bổ khoản thu",14,C["brand"],600);b.text(868,625,"Dịch vụ: 0 ₫   ·   Quản lý: 200.000 ₫",14);b.text(868,650,"Sau lần thu này còn nợ: 110.000 ₫",13,C["muted"])
    button(b,848,728,120,"Quay lại","12-bang-thu","secondary");button(b,1110,728,270,"Kiểm tra & xác nhận","14-xac-nhan-thu")
    save("13-thu-tien","Thu tiền · Giữ ngữ cảnh",b,["US-010"])

    b,x,y=modal("Xác nhận khoản thu","Kiểm tra phòng, kỳ và số tiền trước khi lưu.")
    for yy,l,v in [(y+148,"Căn hộ / hộ chịu phí","050 · Nguyễn Văn An"),(y+199,"Kỳ thu","Tháng 11/2026"),(y+250,"Hình thức","Chuyển khoản"),(y+307,"Số tiền ghi nhận","200.000 ₫")]:b.text(x+30,yy,l,13,C["muted"]);b.text(x+570,yy,v,20 if "tiền" in l else 15,weight=650,anchor="end")
    b.rect(x+30,y+345,540,88,C["soft"],10);b.text(x+48,y+378,"DV: 0 ₫   ·   QL: 200.000 ₫",15,C["brand"],600);b.text(x+48,y+408,"Còn nợ sau thu: 110.000 ₫",14,C["muted"])
    b.text(x+30,y+473,"Chỉ ghi nhận chuyển khoản sau khi đối chiếu tiền đã nhận.",13,C["muted"])
    button(b,x+30,y+552,126,"Quay lại","13-thu-tien","secondary");button(b,x+330,y+552,240,"Xác nhận đã thu tiền","15-bien-lai")
    save("14-xac-nhan-thu","Xác nhận trước khi thu",b,["US-010"])

    b=screen("Biên lai thu tiền","Khoản thu đã lưu. In lại không tạo thêm khoản thu.")
    note(b,206,"Đã ghi nhận 200.000 ₫","Phòng 050 · Kỳ 11/2026 · Còn nợ 110.000 ₫. Có thể in ngay hoặc quay về danh sách.")
    card(b,432,310,800,506,"BIÊN LAI THU PHÍ")
    b.text(456,386,"BL-202611-0051",17,C["brand"],650);b.text(1208,386,"28/11/2026 · 09:42",13,C["muted"],anchor="end")
    for yy,l,v in [(442,"Người nộp / căn hộ","Nguyễn Văn An · 050"),(490,"Nội dung","Phí quản lý tháng 11/2026"),(538,"Hình thức","Chuyển khoản"),(586,"Người ghi nhận","Trần Thu Hà · Thủ quỹ")]:b.text(456,yy,l,13,C["muted"]);b.text(1208,yy,v,14,weight=600,anchor="end")
    b.line(456,621,1208,621);b.text(456,663,"TỔNG TIỀN",14,weight=600);b.text(1208,669,"200.000 ₫",28,C["brand"],700,"end");b.text(456,715,"Hai trăm nghìn đồng.",14,C["muted"])
    button(b,432,853,186,"Về bảng thu","12-bang-thu","secondary");button(b,630,853,184,"Xem lịch sử","18-lich-su","secondary");button(b,1008,853,224,"In / in lại biên lai",None)
    button(b,432,915,204,"Hủy khoản thu nhầm","16-huy-thu","danger")
    save("15-bien-lai","Biên lai & in lại",b,["US-010"])

    b,x,y=modal("Hủy khoản thu nhầm","Biên lai BL-202611-0051 · Phòng 050",h=650)
    b.rect(x+30,y+125,540,101,C["amberbg"],10);b.text(x+48,y+158,"Khoản thu 200.000 ₫ sẽ được đánh dấu đã hủy.",15,C["amber"],600);b.text(x+48,y+191,"Công nợ tăng lại từ 110.000 ₫ lên 310.000 ₫.",14,C["muted"])
    b.text(x+30,y+278,"Lý do hủy *",13,weight=600);b.rect(x+30,y+295,540,115,C["white"],8,C["line"]);b.text(x+46,y+327,"Nhập nhầm số tiền chuyển khoản.",14)
    b.text(x+30,y+447,"Chứng từ và người thao tác vẫn được giữ trong lịch sử.",13,C["muted"]);b.text(x+30,y+475,"Hủy ghi nhận không thực hiện hoàn tiền tự động.",13,C["muted"])
    button(b,x+30,y+544,126,"Giữ khoản thu","15-bien-lai","secondary");button(b,x+330,y+544,240,"Xác nhận hủy khoản thu","42-bien-lai-da-huy","danger")
    save("16-huy-thu","Hủy thu nhầm · Có lý do",b,["US-010","US-019"])

    b=screen("Công nợ theo căn & hộ","Phân biệt nợ kỳ này, kỳ trước và hộ cũ. Không tự chuyển nợ sang hộ mới.")
    b.input(260,211,215,"Kỳ 11/2026");b.input(490,211,690,"Tìm phòng hoặc người chịu phí","search");button(b,1196,211,208,"Xuất công nợ","24-bao-cao","secondary")
    for x,l,v,f in [(260,"Nợ kỳ hiện tại","3.372.500 ₫","4 căn"),(650,"Nợ các kỳ trước","500.000 ₫","hộ cũ phòng 101"),(1040,"Tổng nội bộ","3.872.500 ₫","không gộp nghĩa vụ")]:b.metric(x,286,364,l,v,f)
    def debtrow(d,y,r):
        for xx,t in zip([282,405,733,1000],r):d.text(xx,y+38,t,14,weight=600 if xx==282 else 400)
        button(d,1215,y+15,165,"Xem / thu tiền","13-thu-tien","secondary",h=36)
    b.table(436,[(282,"PHÒNG"),(405,"HỘ CHỊU PHÍ"),(733,"PHẠM VI"),(1000,"CÒN NỢ"),(1215,"THAO TÁC")],[("050","Nguyễn Văn An","Kỳ hiện tại","310.000 ₫"),("101","Lê Hoàng Nam","Hộ hiện tại","1.019.250 ₫"),("101","Nguyễn Văn Minh","Hộ cũ · 10/2026","500.000 ₫"),("201","Vũ Thị Mai","Kỳ hiện tại","25.000 ₫")],debtrow)
    note(b,826,"Quyền của cư dân mới","Cư dân chỉ thấy nghĩa vụ của hộ mình. Nhân sự nội bộ được xem riêng lịch sử nợ hộ cũ.")
    save("17-cong-no","Công nợ · Hộ hiện tại và hộ cũ",b,["US-012"])

    b=screen("Lịch sử phòng 050","Xem chứng từ hợp lệ và đã hủy, không mất dấu vết thao tác.")
    b.input(260,211,270,"Phòng 050 · Nguyễn Văn An");b.input(546,211,260,"Tất cả loại giao dịch");button(b,1194,211,210,"Về bảng thu","12-bang-thu","secondary")
    card(b,260,300,1144,468,"Các giao dịch gần đây")
    history=[("28/11 · 09:42","BL-202611-0051","Thu phí quản lý","200.000 ₫","Đã hủy","neutral"),("20/11 · 14:10","BL-202611-0038","Thu phí dịch vụ / quản lý","500.000 ₫","Hợp lệ","green"),("12/11 · 08:30","Q-202611-0011","Ủng hộ quỹ khuyến học","200.000 ₫","Hợp lệ","green")]
    for i,(date,ref,desc,amount,state,kind) in enumerate(history):
        yy=376+i*115;b.rect(284,yy-24,38,38,C["bg"],19);b.icon(293,yy-15,"clock");b.text(340,yy,ref,15,weight=650);b.text(340,yy+27,desc,13,C["muted"]);b.text(340,yy+51,date,12,C["muted"]);b.text(906,yy+9,amount,16,weight=650);b.badge(1085,yy-10,state,kind);button(b,1220,yy-15,160,"Xem chứng từ","42-bien-lai-da-huy" if i==0 else "15-bien-lai" if i==1 else "23-bien-nhan-quy","secondary",h=36)
    save("18-lich-su","Lịch sử giao dịch & dấu hủy",b,["US-013","US-019"])

    b=screen("Quỹ tự nguyện","Mỗi khoản ủng hộ được ghi riêng, không cộng vào công nợ bắt buộc.",active="Quỹ tự nguyện")
    button(b,1214,118,190,"Tạo đợt vận động","20-tao-dot-quy")
    b.input(260,211,750,"Tìm tên quỹ hoặc đợt vận động","search");button(b,1026,211,176,"Đang mở · 2",None,"secondary");button(b,1218,211,186,"Xem báo cáo","24-bao-cao","secondary")
    for i,(title,dates,total,count,state) in enumerate([("Khuyến học 2026","01/11 – 30/11/2026","8.400.000 ₫","28 lượt ủng hộ","Đang mở"),("Vì người nghèo","01/11 – 31/12/2026","12.600.000 ₫","42 lượt ủng hộ","Đang mở"),("Từ thiện tháng 10","01/10 – 31/10/2026","6.000.000 ₫","20 lượt ủng hộ","Đã đóng")]):
        yy=300+i*176;card(b,260,yy,1144,150,title);b.text(284,yy+70,dates,13,C["muted"]);b.badge(520,yy+18,state,"green" if i<2 else "neutral");b.text(850,yy+60,total,25,C["brand"],700);b.text(850,yy+91,count,13,C["muted"]);button(b,1184,yy+49,196,"Xem đợt vận động","21-chi-tiet-quy" if i<2 else "34-quy-da-dong","secondary")
    save("19-quy-tu-nguyen","Các đợt quỹ tự nguyện",b,["US-007","US-011"])

    b,x,y=modal("Tạo đợt vận động","Tách riêng quỹ tự nguyện và các khoản phí bắt buộc.",base="19-quy-tu-nguyen",h=690)
    field(b,x+30,y+145,540,"Tên đợt vận động","Khuyến học tháng 12/2026")
    field(b,x+30,y+245,540,"Quỹ","Khuyến học",True)
    field(b,x+30,y+345,258,"Ngày bắt đầu","01/12/2026");field(b,x+312,y+345,258,"Ngày kết thúc","31/12/2026")
    field(b,x+30,y+445,540,"Ghi chú","Ủng hộ học sinh có hoàn cảnh khó khăn")
    button(b,x+30,y+577,126,"Hủy","19-quy-tu-nguyen","secondary");button(b,x+330,y+577,240,"Tạo đợt vận động","21-chi-tiet-quy")
    save("20-tao-dot-quy","Tạo đợt vận động",b,["US-007"])

    b=screen("Quỹ khuyến học 2026","01/11–30/11/2026 · Đóng góp tự nguyện",active="Quỹ tự nguyện")
    button(b,1222,118,182,"Ghi nhận ủng hộ","22-ghi-dong-gop")
    for x,l,v,f in [(260,"Tổng đã ủng hộ","8.400.000 ₫","giao dịch hợp lệ"),(650,"Số lượt đóng góp","28","lượt ủng hộ"),(1040,"Trạng thái đợt","Đang mở","đến 30/11/2026")]:b.metric(x,210,364,l,v,f)
    b.input(260,347,750,"Tìm phòng hoặc người ủng hộ","search");button(b,1222,347,182,"Đóng đợt này","41-xac-nhan-dong-quy","secondary")
    def contribrow(d,y,r):
        for xx,t in zip([282,450,800,1040],r):d.text(xx,y+39,t,14,weight=600 if xx==282 else 400)
        button(d,1230,y+15,150,"Biên nhận","23-bien-nhan-quy","secondary",h=36)
    b.table(432,[(282,"PHÒNG"),(450,"NGƯỜI ỦNG HỘ"),(800,"SỐ TIỀN"),(1040,"NGÀY GHI NHẬN"),(1230,"CHỨNG TỪ")],[("050","Nguyễn Văn An","200.000 ₫","28/11/2026"),("101","Lê Hoàng Nam","300.000 ₫","27/11/2026"),("102","Đặng Quốc Bảo","200.000 ₫","27/11/2026")],contribrow)
    note(b,764,"Phí bắt buộc không thay đổi","Số tiền ủng hộ không được phân bổ vào tiền dịch vụ, quản lý hoặc nợ các kỳ trước.")
    save("21-chi-tiet-quy","Chi tiết quỹ & các khoản ủng hộ",b,["US-007","US-011"])

    b,x,y=modal("Ghi nhận ủng hộ","Quỹ khuyến học 2026 · Đang mở",base="21-chi-tiet-quy",h=720)
    field(b,x+30,y+145,540,"Căn hộ / hộ gia đình","050 · Nguyễn Văn An",True)
    field(b,x+30,y+245,540,"Người ủng hộ","Nguyễn Văn An")
    field(b,x+30,y+345,540,"Số tiền tự nguyện","200.000 ₫")
    field(b,x+30,y+445,540,"Hình thức","Chuyển khoản",True)
    b.text(x+30,y+550,"Xác nhận: 200.000 ₫ · Phòng 050 · Quỹ khuyến học.",14,C["brand"],600)
    button(b,x+30,y+610,126,"Hủy","21-chi-tiet-quy","secondary");button(b,x+330,y+610,240,"Xác nhận đã nhận tiền","23-bien-nhan-quy")
    save("22-ghi-dong-gop","Ghi nhận đóng góp tự nguyện",b,["US-011"])

    b=screen("Biên nhận ủng hộ","Khoản đóng góp đã lưu vào quỹ khuyến học, không làm thay đổi công nợ.",active="Quỹ tự nguyện")
    card(b,432,210,800,524,"BIÊN NHẬN ĐÓNG GÓP TỰ NGUYỆN")
    b.text(456,290,"Q-202611-0029",17,C["brand"],650);b.text(1208,290,"28/11/2026 · 10:05",13,C["muted"],anchor="end")
    for yy,l,v in [(355,"Quỹ / đợt vận động","Khuyến học 2026"),(411,"Người ủng hộ","Nguyễn Văn An · Phòng 050"),(467,"Hình thức","Chuyển khoản"),(523,"Người ghi nhận","Trần Thu Hà")]:b.text(456,yy,l,13,C["muted"]);b.text(1208,yy,v,15,weight=600,anchor="end")
    b.line(456,563,1208,563);b.text(456,611,"SỐ TIỀN ỦNG HỘ",14,weight=600);b.text(1208,618,"200.000 ₫",28,C["brand"],700,"end")
    button(b,432,780,192,"Về đợt vận động","21-chi-tiet-quy","secondary");button(b,1000,780,232,"In / in lại biên nhận",None);button(b,432,850,204,"Hủy ghi nhận nhầm","33-huy-dong-gop","danger")
    save("23-bien-nhan-quy","Biên nhận quỹ tự nguyện",b,["US-011","US-013"])

    b=screen("Báo cáo thu & công nợ","Bảng tổng hợp và file Excel dùng cùng kỳ, phạm vi và trạng thái hợp lệ.")
    button(b,260,211,254,"Theo kỳ hóa đơn",None);button(b,530,211,254,"Theo tháng thực thu","40-bao-cao-thuc-thu","secondary")
    field(b,260,306,270,"Kỳ / tháng","Tháng 11/2026",True);field(b,550,306,400,"Phạm vi","Tất cả căn hộ / hộ",True)
    button(b,1188,320,216,"Tải báo cáo Excel",None,"primary",icon="download")
    def reportrow(d,y,r):
        for xx,t in zip([282,620,860,1120],r):d.text(xx,y+40,t,15,weight=600 if xx==282 else 400)
    b.table(420,[(282,"LOẠI PHÍ"),(620,"PHẢI THU"),(860,"ĐÃ THU"),(1120,"CÒN NỢ")],[("Phí dịch vụ","2.610.000 ₫","1.260.000 ₫","1.350.000 ₫"),("Phí quản lý","3.262.500 ₫","1.240.000 ₫","2.022.500 ₫"),("Tổng phí bắt buộc","5.872.500 ₫","2.500.000 ₫","3.372.500 ₫")],reportrow)
    card(b,260,730,1144,116,"Quỹ tự nguyện — Báo cáo riêng")
    b.text(284,807,"Khuyến học: 8.400.000 ₫   ·   Vì người nghèo: 12.600.000 ₫",15,C["brand"],600)
    b.text(260,904,"Tháng thực thu có thể gồm tiền trả cho hóa đơn kỳ trước. Các chứng từ hủy không cộng vào tổng hợp.",13,C["muted"])
    button(b,260,935,206,"In nhiều giấy báo","39-giay-bao","secondary");button(b,1188,935,216,"Về bảng thu","12-bang-thu","secondary")
    save("24-bao-cao","Báo cáo & xuất Excel",b,["US-009","US-014"])

    b=screen("Phân quyền tài khoản","Chỉ quản trị viên được đổi vai trò; thay đổi có xác nhận và lưu nhật ký.",active="Tài khoản BQT")
    b.input(260,211,760,"Tìm tên đăng nhập hoặc họ tên","search")
    def rolerow(d,y,r):
        name,user,role=r;d.text(282,y+29,name,15,weight=600);d.text(282,y+51,user,12,C["muted"]);d.badge(690,y+21,role,"brand",146);d.input(950,y+15,230,"Chọn vai trò mới");d.icon(1145,y+28,"down",size=17);button(d,1240,y+15,140,"Lưu vai trò","35-xac-nhan-quyen","secondary",h=42)
    b.table(300,[(282,"THÀNH VIÊN"),(690,"VAI TRÒ HIỆN TẠI"),(950,"VAI TRÒ MỚI"),(1240,"THAO TÁC")],[("Lê Tuấn Vĩ","admin01","ADMIN"),("Nguyễn Quang Nhật","ketoan01","BQT"),("Trần Thu Hà","thuquy01","TREASURER")],rolerow,height=82)
    note(b,715,"Quyền mới có hiệu lực sau khi đăng nhập lại","Không thể hạ quyền quản trị viên cuối cùng. Phiên cũ của tài khoản được đổi quyền sẽ bị thu hồi.")
    save("25-phan-quyen","Gán vai trò tài khoản",b,["US-018"])

    b=screen("Nhật ký hệ thống","Theo dõi ai đã làm gì, vào lúc nào và thay đổi trước / sau.",active="Nhật ký")
    b.input(260,211,430,"Tìm người thực hiện hoặc chứng từ","search");b.input(706,211,286,"28/11/2026 – 28/11/2026");b.input(1008,211,396,"Tất cả loại thao tác")
    entries=[("09:44","Trần Thu Hà","Hủy khoản thu","BL-202611-0051","Nhập nhầm số tiền"),("09:42","Trần Thu Hà","Ghi nhận thu tiền","BL-202611-0051","200.000 ₫ · Phòng 050"),("09:30","Lê Tuấn Vĩ","Đổi vai trò","ketoan01","BQT → ACCOUNTANT")]
    def auditrow(d,y,r):
        for xx,t in zip([282,400,650,900],r[:4]):d.text(xx,y+34,t,13,weight=600 if xx==650 else 400)
        d.text(650,y+57,r[4],12,C["muted"])
    b.table(308,[(282,"THỜI GIAN"),(400,"NGƯỜI THỰC HIỆN"),(650,"HÀNH ĐỘNG"),(900,"ĐỐI TƯỢNG")],entries,auditrow,height=80)
    card(b,260,660,1144,200,"Chi tiết — Hủy BL-202611-0051")
    b.text(284,734,"Trước",12,C["muted"]);b.text(284,764,"Hợp lệ · Đã thu 700.000 ₫ · Còn nợ 110.000 ₫",14)
    b.text(850,734,"Sau",12,C["muted"]);b.text(850,764,"Đã hủy · Đã thu 500.000 ₫ · Còn nợ 310.000 ₫",14)
    b.text(284,817,"Lý do: Nhập nhầm số tiền chuyển khoản.",14,C["muted"])
    save("26-nhat-ky","Audit · Trước và sau thao tác",b,["US-019"])

    b=screen("Phí căn hộ của tôi","Phòng 050 · Nguyễn Văn An · Chỉ dữ liệu của hộ gia đình bạn.",active="Căn hộ của tôi",resident=True)
    b.rect(260,210,1144,173,C["navy"],14);b.text(288,248,"KỲ THÁNG 11/2026",11,"#AAC4D1",600);b.text(288,301,"Còn phải đóng 310.000 ₫",34,C["white"],700);b.text(288,348,"Tổng phí 810.000 ₫   ·   Đã đóng 500.000 ₫   ·   Nợ kỳ trước của hộ: 0 ₫",15,"#D6E6EE")
    card(b,260,421,552,294,"Chi tiết phí tháng 11")
    for yy,l,v in [(506,"Dịch vụ: 60 m² × 6.000 ₫","360.000 ₫"),(560,"Quản lý: 60 m² × 7.500 ₫","450.000 ₫")]:b.text(284,yy,l,14,C["muted"]);b.text(788,yy,v,16,weight=650,anchor="end")
    button(b,284,637,220,"Xem giấy báo","43-cu-dan-giay-bao","secondary")
    card(b,836,421,568,294,"Biên lai đã nộp")
    b.text(860,504,"BL-202611-0038",16,weight=650);b.text(860,535,"20/11/2026 · 500.000 ₫ · Hợp lệ",14,C["muted"]);button(b,860,637,222,"Xem / in biên lai","37-cu-dan-bien-lai","secondary")
    card(b,260,751,1144,124,"Ủng hộ tự nguyện của hộ")
    b.text(284,827,"Khuyến học 2026 · 200.000 ₫ · 12/11/2026",15);button(b,1160,796,220,"Xem biên nhận","38-cu-dan-bien-nhan","secondary")
    save("27-cu-dan-hoa-don","Cư dân · Phí và biên lai",b,["US-009","US-010","US-012","US-013"])

    b=Board("Phí căn hộ của tôi · Điện thoại",390,1000)
    b.rect(0,0,390,84,C["white"],0);b.text(20,31,"9:41",13,weight=650);b.text(20,68,"bluemoon",23,C["brand"],700)
    b.text(20,131,"Phí căn hộ của tôi",25,weight=700);b.text(20,160,"Phòng 050 · Tháng 11/2026",14,C["muted"])
    b.rect(20,190,350,174,C["navy"],14);b.text(40,224,"CÒN PHẢI ĐÓNG",11,"#AAC4D1",600);b.text(40,273,"310.000 ₫",37,C["white"],700);b.text(40,313,"Đã đóng 500.000 / 810.000 ₫",14,"#D6E6EE");b.text(40,340,"Nợ kỳ trước của hộ: 0 ₫",13,"#D6E6EE")
    card(b,20,388,350,190,"Chi tiết từng khoản")
    b.text(40,460,"Dịch vụ",14,C["muted"]);b.text(348,460,"360.000 ₫",15,weight=600,anchor="end");b.text(40,505,"Quản lý",14,C["muted"]);b.text(348,505,"450.000 ₫",15,weight=600,anchor="end");b.text(40,550,"Diện tích tính phí: 60 m²",12,C["muted"])
    card(b,20,602,350,192,"Biên lai gần nhất")
    b.text(40,675,"BL-202611-0038",15,weight=650);b.text(40,705,"20/11/2026 · 500.000 ₫",13,C["muted"]);button(b,40,731,310,"Xem biên lai","37-cu-dan-bien-lai","secondary")
    b.text(20,840,"Xem lịch sử phí của hộ",14,C["brand"],600)
    b.rect(0,919,390,81,C["white"],0);b.icon(64,935,"wallet",C["brand"]);b.text(74,979,"Phí",11,C["brand"],600,"middle");b.icon(185,935,"building");b.text(195,979,"Căn hộ",11,C["muted"],anchor="middle");b.icon(306,935,"user");b.text(316,979,"Cá nhân",11,C["muted"],anchor="middle")
    save("28-mobile-hoa-don","Cư dân · Thu phí trên điện thoại",b,["US-009","US-012","US-013"])

    b,x,y=modal("Thay hóa đơn phát hành sai","Phòng 050 · Kỳ 12/2026 · Chưa có khoản thu hợp lệ",h=700)
    b.rect(x+30,y+124,540,120,C["amberbg"],10);b.text(x+48,y+158,"Bản cũ giữ nguyên và được đánh dấu ĐÃ HỦY.",15,C["amber"],600);b.text(x+48,y+193,"Bản mới có mã và phiên bản riêng, không cộng nợ hai lần.",13,C["muted"]);b.text(x+48,y+222,"Có khoản thu hợp lệ: phải xử lý khoản thu trước.",13,C["muted"])
    field(b,x+30,y+294,540,"Lý do sửa sai *","Ghi nhầm diện tích căn hộ.")
    b.text(x+30,y+410,"Bản cũ: 60 m² · 810.000 ₫",16,weight=600);b.text(x+30,y+456,"Bản xem trước mới: 65 m² · 877.500 ₫",16,C["brand"],650)
    button(b,x+30,y+586,126,"Quay lại","12-bang-thu","secondary");button(b,x+300,y+586,270,"Xác nhận phát hành thay thế","12-bang-thu")
    save("29-thay-hoa-don","Sửa sai · Hủy và thay hóa đơn",b,["US-008","US-019"])

    b,x,y=modal("Chuyển giao hộ gia đình","Phòng 101 · Hiệu lực 28/11/2026",base="17-cong-no",h=700)
    b.text(x+30,y+145,"Hộ cũ",13,C["muted"]);b.text(x+30,y+178,"Nguyễn Văn Minh · Còn nợ 500.000 ₫",17,weight=650)
    field(b,x+30,y+246,540,"Chủ hộ mới","Lê Hoàng Nam")
    field(b,x+30,y+346,540,"Lý do chuyển giao","Hộ cũ chuyển đi; hộ mới nhận căn hộ.")
    b.rect(x+30,y+434,540,110,C["soft"],10);b.text(x+48,y+467,"Nợ 500.000 ₫ vẫn thuộc hộ cũ.",15,C["brand"],650);b.text(x+48,y+498,"Hộ mới không xem chứng từ cũ; quyền hộ cũ bị thu hồi.",13,C["muted"]);b.text(x+48,y+526,"Đây là thay hộ, không chỉ đổi người đại diện trong gia đình.",12,C["muted"])
    button(b,x+30,y+590,126,"Hủy","17-cong-no","secondary");button(b,x+300,y+590,270,"Xác nhận chuyển giao","17-cong-no")
    save("30-chuyen-ho","Chuyển hộ & bảo toàn nợ cũ",b,["US-002","US-004","US-012","US-019"])

    b,x,y=modal("Chưa xác nhận được kết quả","Kết nối bị gián đoạn sau khi gửi khoản thu.",h=535)
    b.rect(x+30,y+128,540,110,C["amberbg"],10);b.text(x+48,y+163,"Không tạo khoản thu mới lúc này.",18,C["amber"],650);b.text(x+48,y+198,"Hệ thống sẽ kiểm tra lại đúng yêu cầu 200.000 ₫ vừa gửi.",13,C["muted"])
    b.text(x+30,y+291,"Phòng 050 · Kỳ 11/2026 · Chuyển khoản",15,weight=600);b.text(x+30,y+333,"Nếu khoản thu đã lưu, bạn sẽ nhận lại biên lai đã có.",14,C["muted"])
    button(b,x+30,y+419,165,"Xem lịch sử","18-lich-su","secondary");button(b,x+330,y+419,240,"Kiểm tra lại khoản thu","15-bien-lai")
    save("31-mat-ket-noi","Mất phản hồi · Thử lại an toàn",b,["US-010"])

    b=screen("Bản xem trước cần cập nhật","Dữ liệu vừa thay đổi. Hãy xem lại trước khi phát hành hóa đơn.")
    note(b,219,"Diện tích hoặc đơn giá đã đổi sau lần xem trước","Không phát hành bằng tổng cũ. Bảng thu chưa được tạo; bạn có thể tải lại để kiểm tra.","amber")
    card(b,260,331,1144,270,"Các thông tin cần kiểm tra lại")
    b.text(284,414,"Phòng 050",16,weight=650);b.text(650,414,"Diện tích: 60 → 65 m²",16,C["amber"],600);b.text(284,468,"Bản xem trước hết hạn sau 10 phút; thiếu lịch sử sẽ chỉ rõ căn và dữ liệu cần bổ sung.",14,C["muted"])
    button(b,284,523,240,"Tải bản xem trước mới","11-preview-bang-thu")
    save("32-preview-cu","Preview lỗi thời / thiếu dữ liệu",b,["US-008"])

    b,x,y=modal("Hủy đóng góp ghi nhầm","Q-202611-0029 · Quỹ khuyến học 2026",base="23-bien-nhan-quy",h=590)
    b.text(x+30,y+154,"Nguyễn Văn An · Phòng 050 · 200.000 ₫",17,weight=650)
    field(b,x+30,y+223,540,"Lý do hủy *","Ghi nhận trùng khoản ủng hộ.")
    b.rect(x+30,y+333,540,90,C["amberbg"],10);b.text(x+48,y+367,"Tổng quỹ giảm 200.000 ₫; công nợ phí không đổi.",14,C["amber"],600);b.text(x+48,y+399,"Biên nhận cũ vẫn có trong lịch sử với nhãn ĐÃ HỦY.",13,C["muted"])
    button(b,x+30,y+484,126,"Giữ lại","23-bien-nhan-quy","secondary");button(b,x+330,y+484,240,"Xác nhận hủy đóng góp","21-chi-tiet-quy","danger")
    save("33-huy-dong-gop","Hủy đóng góp · Không đổi công nợ",b,["US-011","US-019"])

    b=screen("Quỹ khuyến học 2026","Đợt đã đóng · Lịch sử và chứng từ vẫn được giữ lại.",active="Quỹ tự nguyện")
    note(b,210,"Đợt vận động đã đóng","Không thể ghi thêm khoản ủng hộ. Nhân sự có quyền vẫn xử lý được giao dịch ghi nhầm.","amber")
    b.metric(260,315,552,"Tổng quỹ đã ghi nhận","8.400.000 ₫","28 lượt");b.metric(836,315,568,"Trạng thái","Đã đóng","30/11/2026")
    button(b,260,465,208,"Xem lịch sử đợt","21-chi-tiet-quy","secondary");button(b,484,465,208,"Xuất báo cáo","24-bao-cao","secondary");button(b,708,465,208,"Về danh sách quỹ","19-quy-tu-nguyen","secondary")
    save("34-quy-da-dong","Quỹ đã đóng · Chặn thu mới",b,["US-007","US-011"])

    b,x,y=modal("Xác nhận thay đổi vai trò","Tài khoản ketoan01 · Nguyễn Quang Nhật",base="25-phan-quyen",h=540)
    b.text(x+30,y+163,"BQT",24,C["muted"],650);b.icon(x+240,y+139,"arrow",C["brand"],26);b.text(x+320,y+163,"ACCOUNTANT",24,C["brand"],700)
    b.rect(x+30,y+220,540,116,C["soft"],10);b.text(x+48,y+255,"Phiên đăng nhập cũ của tài khoản sẽ hết hiệu lực.",14,C["brand"],600);b.text(x+48,y+286,"Người dùng đăng nhập lại để sử dụng quyền mới.",13,C["muted"]);b.text(x+48,y+315,"Không cho phép hạ quyền quản trị viên cuối cùng.",13,C["muted"])
    button(b,x+30,y+427,126,"Hủy","25-phan-quyen","secondary");button(b,x+330,y+427,240,"Xác nhận đổi vai trò","25-phan-quyen")
    save("35-xac-nhan-quyen","Xác nhận đổi vai trò",b,["US-018","US-019"])

    b=screen("Không có kết quả phù hợp","Giữ bộ lọc rõ ràng và luôn có cách trở về danh sách.")
    b.input(260,211,750,"Phòng 999","search");button(b,1026,211,180,"Xóa bộ lọc","12-bang-thu","secondary")
    card(b,260,310,1144,390,"Không tìm thấy hóa đơn")
    b.icon(794,408,"search",C["muted"],44);b.text(832,505,"Chưa có hóa đơn phù hợp với bộ lọc này.",21,weight=650,anchor="middle");b.text(832,548,"Kiểm tra lại số phòng hoặc chọn kỳ khác. Không cần nhập lại các thông tin khác.",14,C["muted"],anchor="middle");button(b,712,594,240,"Xem toàn bộ kỳ hiện tại","12-bang-thu")
    save("36-khong-ket-qua","Không có kết quả · Giữ bộ lọc",b,["US-008","US-012"])

    for key,title,receipt,date,amount,description,stories in [
        ("37-cu-dan-bien-lai","Biên lai của hộ gia đình","BL-202611-0038","20/11/2026","500.000 ₫","Dịch vụ: 360.000 ₫ · Quản lý: 140.000 ₫",["US-010","US-013"]),
        ("38-cu-dan-bien-nhan","Biên nhận ủng hộ của hộ","Q-202611-0011","12/11/2026","200.000 ₫","Ủng hộ tự nguyện quỹ Khuyến học 2026",["US-011","US-013"]),
    ]:
        b=screen(title,"Phòng 050 · Nguyễn Văn An · Chứng từ của chính hộ gia đình bạn.",active="Căn hộ của tôi",resident=True)
        card(b,432,210,800,510,title.upper())
        b.text(456,293,receipt,18,C["brand"],650);b.text(1208,293,date,14,C["muted"],anchor="end")
        b.text(456,366,"Nguyễn Văn An · Phòng 050",20,weight=650);b.text(456,414,description,16,C["muted"])
        b.badge(456,451,"Hợp lệ");b.line(456,520,1208,520);b.text(456,580,"SỐ TIỀN ĐÃ GHI NHẬN",14,weight=600);b.text(1208,589,amount,30,C["brand"],700,"end")
        button(b,432,764,230,"Về phí căn hộ của tôi","27-cu-dan-hoa-don","secondary");button(b,1002,764,230,"In chứng từ",None)
        save(key,title,b,stories)

    b=screen("Giấy báo phí","Bản xem trước in · Thông tin được giữ theo kỳ phát hành.")
    card(b,432,210,800,620,"GIẤY BÁO PHÍ THÁNG 11/2026")
    b.text(456,295,"Căn hộ 050 · Nguyễn Văn An",23,weight=700);b.text(456,334,"Diện tích tính phí: 60 m²",15,C["muted"])
    for yy,l,v in [(416,"Phí dịch vụ · 60 m² × 6.000 ₫","360.000 ₫"),(475,"Phí quản lý · 60 m² × 7.500 ₫","450.000 ₫"),(534,"Tổng phải thu kỳ này","810.000 ₫"),(593,"Đã ghi nhận","500.000 ₫")]:b.text(456,yy,l,15,C["muted"]);b.text(1208,yy,v,16,weight=600,anchor="end")
    b.line(456,636,1208,636);b.text(456,695,"CÒN PHẢI ĐÓNG",15,weight=650);b.text(1208,705,"310.000 ₫",32,C["brand"],700,"end");b.text(456,766,"Nợ kỳ trước của hộ: 0 ₫. Thông tin thu nộp cập nhật tại thời điểm in.",13,C["muted"])
    button(b,432,873,212,"Về bảng thu","12-bang-thu","secondary");button(b,1000,873,232,"In giấy báo · A4 / A5",None)
    save("39-giay-bao","Giấy báo phí · Bản in",b,["US-009"])

    b=screen("Báo cáo theo tháng thực thu","Tính theo ngày nhận tiền Việt Nam, kể cả khoản trả cho hóa đơn kỳ trước.")
    button(b,260,211,254,"Theo kỳ hóa đơn","24-bao-cao","secondary");button(b,530,211,254,"Theo tháng thực thu",None)
    field(b,260,310,280,"Tháng nhận tiền","Tháng 11/2026",True);button(b,1188,324,216,"Tải Excel thực thu",None,icon="download")
    def cashrow(d,y,r):
        for xx,t in zip([282,560,820,1040,1230],r):d.text(xx,y+39,t,14,weight=600 if xx==282 else 400)
    b.table(420,[(282,"NGÀY NHẬN"),(560,"KỲ HÓA ĐƠN"),(820,"PHÒNG"),(1040,"SỐ TIỀN"),(1230,"PHƯƠNG THỨC")],[("28/11/2026","11/2026","050","200.000 ₫","Chuyển khoản"),("05/11/2026","10/2026","101","500.000 ₫","Tiền mặt")],cashrow)
    note(b,699,"Đừng nhầm tháng thu với kỳ hóa đơn","Khoản nhận ngày 05/11 cho hóa đơn tháng 10 xuất hiện trong thực thu tháng 11, dù thuộc kỳ hóa đơn 10.")
    save("40-bao-cao-thuc-thu","Báo cáo · Tháng thực thu",b,["US-014"])

    b,x,y=modal("Đóng đợt vận động","Khuyến học 2026 · Đang mở",base="21-chi-tiet-quy",h=510)
    b.text(x+30,y+163,"Sau khi đóng sẽ không nhận thêm khoản ủng hộ.",17,weight=650)
    b.text(x+30,y+218,"Lịch sử và biên nhận vẫn được giữ để tra cứu.",14,C["muted"])
    b.text(x+30,y+261,"Khoản ghi nhầm vẫn có thể hủy bằng quyền phù hợp.",14,C["muted"])
    button(b,x+30,y+393,126,"Tiếp tục mở","21-chi-tiet-quy","secondary");button(b,x+330,y+393,240,"Xác nhận đóng đợt","34-quy-da-dong")
    save("41-xac-nhan-dong-quy","Xác nhận đóng đợt quỹ",b,["US-007"])

    b=screen("Biên lai đã hủy","Chỉ đọc lịch sử. Chứng từ này không còn giá trị ghi nhận khoản thu.")
    card(b,432,210,800,490,"BIÊN LAI BL-202611-0051")
    b.rect(456,290,752,72,C["redbg"],10);b.text(832,337,"ĐÃ HỦY",30,C["red"],700,"middle")
    b.text(456,415,"Nguyễn Văn An · Phòng 050 · Kỳ 11/2026",19,weight=650);b.text(456,468,"Số tiền trước khi hủy: 200.000 ₫",17)
    b.text(456,522,"Lý do: Nhập nhầm số tiền chuyển khoản.",15,C["muted"])
    b.text(456,568,"Người hủy: Trần Thu Hà · 28/11/2026, 09:44",14,C["muted"])
    b.text(456,624,"Công nợ khôi phục còn 310.000 ₫; không xóa giao dịch gốc.",14,C["muted"])
    button(b,432,752,220,"Về lịch sử giao dịch","18-lich-su","secondary");button(b,1000,752,232,"In bản có dấu ĐÃ HỦY",None,"secondary")
    save("42-bien-lai-da-huy","Biên lai có dấu ĐÃ HỦY",b,["US-010","US-013","US-019"])

    b=screen("Giấy báo phí của hộ","Phòng 050 · Kỳ 11/2026 · Không bao gồm nghĩa vụ của hộ khác.",active="Căn hộ của tôi",resident=True)
    card(b,432,210,800,518,"GIẤY BÁO PHÍ THÁNG 11/2026")
    b.text(456,298,"Nguyễn Văn An · Phòng 050",22,weight=650);b.text(456,343,"Diện tích: 60 m²",15,C["muted"])
    for yy,l,v in [(409,"Phí dịch vụ","360.000 ₫"),(464,"Phí quản lý","450.000 ₫"),(519,"Đã ghi nhận","500.000 ₫")]:b.text(456,yy,l,15,C["muted"]);b.text(1208,yy,v,17,weight=600,anchor="end")
    b.line(456,566,1208,566);b.text(456,620,"CÒN PHẢI ĐÓNG",15,weight=650);b.text(1208,631,"310.000 ₫",32,C["brand"],700,"end")
    button(b,432,772,240,"Về phí căn hộ của tôi","27-cu-dan-hoa-don","secondary");button(b,1002,772,230,"In giấy báo",None)
    save("43-cu-dan-giay-bao","Cư dân · Xem giấy báo",b,["US-009","US-012"])

