"""Editable SVG design boards and an offline review gallery. No app code is changed."""
from pathlib import Path
from html import escape
import json

ROOT = Path(__file__).resolve().parent
SVG_DIR = ROOT / "figma-import"
SVG_DIR.mkdir(exist_ok=True)
C = dict(bg="#F5F7FA", white="#FFFFFF", ink="#172B3A", muted="#607486", line="#E3EAF0", brand="#116A73", soft="#EAF5F4", navy="#142D3D", green="#207653", greenbg="#EAF6EE", amber="#94600E", amberbg="#FFF5DF", red="#B14343", redbg="#FDEEEE")

class Board:
    def __init__(self, title, w=1440, h=1000):
        self.w, self.h, self.title = w, h, title
        self.parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-label="{escape(title)}"><title>{escape(title)}</title>']
        self.rect(0, 0, w, h, C["bg"], 0)
    def rect(self,x,y,w,h,fill=C["white"],r=12,stroke=None):
        self.parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}"'+(f' stroke="{stroke}"' if stroke else '')+'/>')
    def text(self,x,y,s,size=14,fill=None,weight=400,anchor="start"):
        self.parts.append(f'<text x="{x}" y="{y}" font-family="Segoe UI, Arial, sans-serif" font-size="{size}" font-weight="{weight}" fill="{fill or C["ink"]}" text-anchor="{anchor}">{escape(str(s))}</text>')
    def line(self,x1,y1,x2,y2,color=None):
        self.parts.append(f'<path d="M{x1} {y1}H{x2}" stroke="{color or C["line"]}"/>' if y1==y2 else f'<path d="M{x1} {y1}L{x2} {y2}" stroke="{color or C["line"]}"/>')
    def icon(self,x,y,name,color=None,size=20):
        paths={"building":'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h1m4 0h1M9 11h1m4 0h1M10 21v-5h4v5"/>',"users":'<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-16a3 3 0 0 1 0 6m4 10v-3a6 6 0 0 0-4-5"/>',"search":'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',"plus":'<path d="M12 5v14M5 12h14"/>',"arrow":'<path d="M5 12h14m-5-5 5 5-5 5"/>',"chevron":'<path d="m8 5 7 7-7 7"/>',"down":'<path d="m6 9 6 6 6-6"/>',"download":'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',"shield":'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z"/><path d="m8 12 3 3 5-6"/>',"wallet":'<rect x="3" y="5" width="18" height="15" rx="3"/><path d="M3 8V5a2 2 0 0 1 2-2h12m0 9h5v5h-5z"/>',"user":'<circle cx="12" cy="8" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2"/>',"logout":'<path d="M9 4H4v16h5m4-12 4 4-4 4m-5-4h13"/>',"check":'<path d="m5 12 4 4L20 5"/>',"close":'<path d="m6 6 12 12M6 18 18 6"/>',"edit":'<path d="m4 16 12-12 4 4L8 20H4zm10-10 4 4"/>',"dots":'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',"clock":'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',"mail":'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',"lock":'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/>'}
        self.parts.append(f'<g transform="translate({x} {y}) scale({size/24})" fill="none" stroke="{color or C["muted"]}" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">{paths.get(name,paths["building"])}</g>')
    def button(self,x,y,w,label,kind="primary",icon=None,h=42):
        fill=C["brand"] if kind=="primary" else (C["redbg"] if kind=="danger" else C["white"])
        color=C["white"] if kind=="primary" else (C["red"] if kind=="danger" else C["ink"])
        self.rect(x,y,w,h,fill,8,None if kind=="primary" else C["line"])
        if icon:self.icon(x+13,y+(h-18)/2,icon,color,18)
        self.text(x+(w/2 if not icon else 39),y+h/2+5,label,14,color,600,"middle" if not icon else "start")
    def input(self,x,y,w,label,icon=None,h=44):
        self.rect(x,y,w,h,C["white"],8,C["line"])
        if icon:self.icon(x+14,y+12,icon,size=20)
        self.text(x+(44 if icon else 14),y+28,label,14,C["muted"])
    def badge(self,x,y,label,kind="green",w=None):
        w=w or max(64,len(label)*7.2+22)
        bg,fg={"green":(C["greenbg"],C["green"]),"amber":(C["amberbg"],C["amber"]),"neutral":(C["bg"],C["muted"]),"brand":(C["soft"],C["brand"])}[kind]
        self.rect(x,y,w,28,bg,6);self.text(x+11,y+19,label,12,fg,600)
    def header(self,title,sub,action=None,active="Căn hộ",resident=False,finance=False):
        self.rect(0,0,224,self.h,C["white"],0)
        self.line(224,0,224,self.h)
        self.rect(24,28,38,38,C["brand"],11)
        self.text(43,55,"b",29,C["white"],700,"middle")
        self.text(74,48,"bluemoon",22,C["navy"],700)
        self.text(74,66,"QUẢN LÝ CHUNG CƯ",8,C["muted"],600)
        self.text(24,112,"KHÔNG GIAN CƯ DÂN" if resident else "QUẢN LÝ",10,C["muted"],600)
        nav=[("Căn hộ của tôi","building"),("Hồ sơ cá nhân","user")] if resident else [("Căn hộ","building"),("Hộ và nhân khẩu","users"),("Tài khoản cư dân","shield"),("Tài khoản BQT","shield")]
        if finance:nav += [("Thu phí & công nợ","wallet"),("Quỹ tự nguyện","wallet")]
        for i,(label,ic) in enumerate(nav):
            y=132+i*51;on=label==active
            if on:self.rect(12,y-6,200,42,C["soft"],8)
            self.icon(26,y+5,ic,C["brand"] if on else C["muted"])
            self.text(58,y+21,label,14,C["brand"] if on else C["muted"],600 if on else 400)
        if not resident:
            self.text(24,484,"CÁ NHÂN",10,C["muted"],600)
            self.icon(26,510,"user");self.text(58,526,"Hồ sơ cá nhân",14,C["muted"])
        self.rect(16,self.h-128,192,52,C["bg"],10)
        self.text(30,self.h-106,"BlueMoon · SE09",12,C["ink"],600)
        self.text(30,self.h-88,"Không gian làm việc chung",10,C["muted"])
        self.icon(27,self.h-50,"logout",size=18);self.text(58,self.h-35,"Đăng xuất",13,C["muted"])
        self.rect(225,0,self.w-225,82,C["white"],0)
        self.line(225,82,self.w,82)
        self.text(260,47,"BlueMoon",14,C["muted"])
        self.text(348,47,"/",14,C["line"])
        self.text(369,47,title,14,C["ink"],600)
        self.text(self.w-110,38,"Nguyễn Văn An" if resident else "Lê Tuấn Vĩ",13,C["ink"],600,"end")
        self.text(self.w-110,57,"Cư dân · Phòng 050" if resident else "Quản trị viên",11,C["muted"],400,"end")
        self.rect(self.w-92,23,36,36,C["soft"],18)
        self.text(self.w-74,47,"AN" if resident else "TV",12,C["brand"],700,"middle")
        self.text(260,141,title,28,C["ink"],700)
        self.text(260,170,sub,14,C["muted"])
        if action:self.button(self.w-36-action[0],118,action[0],action[1],icon="plus")
    def metric(self,x,y,w,label,value,foot,accent=False):
        self.rect(x,y,w,102,C["brand"] if accent else C["white"],12,None if accent else C["line"])
        self.text(x+20,y+27,label,12,"#D1ECEB" if accent else C["muted"])
        self.text(x+20,y+64,value,28,C["white"] if accent else C["ink"],700)
        self.text(x+w-20,y+64,foot,12,"#D1ECEB" if accent else C["muted"],400,"end")
    def table(self,y,headers,rows,rowfn,height=66):
        self.rect(260,y,1144,48+len(rows)*height,C["white"],12,C["line"])
        self.rect(261,y+1,1142,46,"#F9FBFC",11)
        for x,label in headers:self.text(x,y+29,label,12,C["muted"],600)
        for i,row in enumerate(rows):
            ry=y+48+i*height;self.line(260,ry,1404,ry)
            rowfn(self,ry,row)
        self.text(260,y+78+len(rows)*height,f"Hiển thị {len(rows)} kết quả",12,C["muted"])
    def save(self,name):
        content=''.join(self.parts)+'</svg>'
        (SVG_DIR/f"{name}.svg").write_text(content,encoding="utf-8")
        return content

boards=[]
def add(key,title,b,phase="Sprint 1"):
    svg=b.save(key);boards.append(dict(key=key,title=title,phase=phase,svg=svg))

b=Board("Căn hộ · Tra cứu nhanh")
b.header("Căn hộ","Tìm đúng căn hộ. Xem thành viên và cập nhật ngay trên danh sách.",(166,"Thêm căn hộ"))
for x,label,val,foot in [(260,"Căn hộ đã lưu","6","căn hộ"),(650,"Nhân khẩu","10","người"),(1040,"Diện tích đã ghi nhận","435 m²","6 căn hộ")]:b.metric(x,204,364,label,val,foot)
b.input(260,338,680,"Tìm số phòng, ví dụ 050 hoặc 101","search")
b.text(260,418,"Danh mục căn hộ",18,weight=650)
b.text(1404,418,"6 căn hộ",12,C["muted"],anchor="end")
apts=[("050","60","27/11/2026"),("101","75,5","27/11/2026"),("102","68","27/11/2026"),("201","82","27/11/2026"),("202","54,5","27/11/2026"),("301","95","27/11/2026")]
def aptrow(d,y,r):
    d.rect(280,y+13,40,40,C["soft"],8);d.icon(290,y+23,"building",C["brand"])
    d.text(336,y+39,r[0],16,weight=650);d.text(560,y+39,r[1]+" m²");d.text(780,y+39,r[2],14,C["muted"])
    d.button(1055,y+14,153,"Xem nhân khẩu","secondary",h=38);d.button(1220,y+14,70,"Sửa","secondary",h=38);d.icon(1337,y+23,"dots")
b.table(440,[(280,"CĂN HỘ"),(560,"DIỆN TÍCH"),(780,"NGÀY TẠO"),(1055,"THAO TÁC")],apts,aptrow)
add("01-can-ho","Căn hộ",b)

b=Board("Hộ và nhân khẩu · Danh sách")
b.header("Hộ và nhân khẩu","Tra cứu hồ sơ, đổi cư trú và xem lịch sử tại cùng một nơi.",(170,"Thêm cư dân"),active="Hộ và nhân khẩu")
b.input(260,211,664,"Tìm số phòng hoặc họ tên cư dân","search")
b.button(940,211,128,"Tìm kiếm","secondary")
b.button(1222,211,182,"Xuất Excel","secondary","download")
b.rect(260,280,1144,48,C["soft"],8);b.text(280,310,"Đang xem phòng 050",14,C["brand"],600);b.text(504,310,"3 thành viên",13,C["muted"]);b.text(1384,310,"Xem tất cả phòng",13,C["brand"],600,"end")
b.text(260,375,"Danh sách nhân khẩu",18,weight=650)
b.text(1404,375,"Chủ hộ: Nguyễn Văn An",13,C["muted"],anchor="end")
people=[("NA","Nguyễn Văn An","15/05/1985","Chủ hộ"),("TB","Trần Thị Bình","20/09/1988","Vợ/chồng"),("MK","Nguyễn Minh Khôi","12/10/2015","Con")]
def personrow(d,y,r):
    d.text(282,y+44,"050",15,weight=650);d.rect(365,y+19,40,40,C["bg"],20);d.text(385,y+44,r[0],12,C["muted"],650,"middle")
    d.text(420,y+34,r[1],15,weight=600);d.text(420,y+57,r[2],12,C["muted"]);d.text(752,y+44,r[3],14)
    d.badge(914,y+26,"Thường trú");d.button(1114,y+20,129,"Đổi cư trú","secondary",h=38);d.text(1264,y+44,"Sửa",13,C["brand"],600);d.icon(1352,y+30,"dots")
b.table(398,[(282,"PHÒNG"),(365,"CƯ DÂN"),(752,"QUAN HỆ"),(914,"CƯ TRÚ"),(1114,"THAO TÁC")],people,personrow,height=80)
b.rect(260,742,1144,74,"#EEF2F6",10);b.icon(280,767,"shield");b.text(316,769,"Hồ sơ chi tiết được mở khi cần",13,weight=600);b.text(316,792,"CCCD và lịch sử cư trú nằm trong hồ sơ từng người, giúp bảng chính dễ đọc hơn.",13,C["muted"])
residents_svg=b.save("02-nhan-khau");boards.append(dict(key="02-nhan-khau",title="Hộ và nhân khẩu",phase="Sprint 1",svg=residents_svg))

# A distinct state of the same screen: focused form, no navigation away.
b.rect(0,0,1440,1000,"#172B3A",0);b.parts[-1]=b.parts[-1].replace('/>',' opacity="0.30"/>')
b.rect(445,155,550,650,C["white"],16)
b.text(477,202,"Cập nhật cư trú",23,weight=700);b.icon(945,181,"close")
b.text(477,234,"Trần Thị Bình · Phòng 050",15,C["muted"])
b.line(477,257,963,257)
b.text(477,289,"Trạng thái hiện tại",12,C["muted"]);b.badge(477,303,"Thường trú")
b.text(477,374,"Trạng thái mới",13,weight=600);b.input(477,389,486,"Tạm vắng");b.icon(925,402,"down")
b.text(477,470,"Ngày bắt đầu",13,weight=600);b.input(477,485,486,"28/11/2026")
b.text(477,566,"Ngày kết thúc",13,weight=600);b.input(477,581,486,"Chưa xác định")
b.text(477,650,"Để trống nếu chưa biết ngày kết thúc.",12,C["muted"])
b.line(477,688,963,688);b.button(477,719,102,"Hủy","secondary");b.button(795,719,168,"Lưu thay đổi")
add("03-doi-cu-tru","Đổi cư trú · Hộp thoại",b)

b=Board("Tài khoản cư dân · Duyệt và tra cứu")
b.header("Tài khoản cư dân","Ưu tiên yêu cầu chờ duyệt. Cấp và quản lý tài khoản tại một nơi.",(178,"Cấp tài khoản"),active="Tài khoản cư dân")
b.rect(260,208,1144,146,C["white"],12,C["line"])
b.text(284,242,"Yêu cầu chờ duyệt",17,weight=650);b.badge(488,222,"1 yêu cầu","amber")
b.text(284,290,"Đặng Quốc Bảo",16,weight=650);b.text(284,318,"cudan102 · Phòng 102",13,C["muted"])
b.button(1106,274,112,"Từ chối","secondary");b.button(1230,274,150,"Duyệt yêu cầu")
b.input(260,385,740,"Tìm tên đăng nhập, họ tên hoặc phòng","search")
b.text(260,477,"Tài khoản đang hoạt động",18,weight=650)
accounts=[("cudan050","Nguyễn Văn An","050"),("cudan201","Vũ Thị Mai","201")]
def accountrow(d,y,r):
    d.text(282,y+39,r[0],15,weight=600);d.text(520,y+39,r[1]);d.text(810,y+39,r[2]);d.badge(930,y+20,"Hoạt động");d.button(1120,y+14,184,"Đặt lại mật khẩu","secondary",h=38);d.icon(1352,y+22,"dots")
b.table(500,[(282,"TÊN ĐĂNG NHẬP"),(520,"CƯ DÂN"),(810,"PHÒNG"),(930,"TRẠNG THÁI"),(1120,"THAO TÁC")],accounts,accountrow)
add("04-tai-khoan-cu-dan","Tài khoản cư dân",b)

b=Board("Hồ sơ cá nhân · Cập nhật thông tin")
b.header("Hồ sơ cá nhân","Quản lý thông tin liên hệ và bảo mật tài khoản.",active="Hồ sơ cá nhân")
b.rect(260,210,552,556,C["white"],12,C["line"]);b.text(284,249,"Thông tin cá nhân",18,weight=650)
b.rect(284,274,60,60,C["soft"],30);b.text(314,313,"TV",20,C["brand"],650,"middle");b.text(362,297,"Lê Tuấn Vĩ",17,weight=650);b.text(362,322,"bqt01 · Thành viên BQT",13,C["muted"])
for y,label,value in [(379,"Họ và tên","Lê Tuấn Vĩ"),(480,"Số điện thoại","Nhập số điện thoại liên hệ")]:b.text(284,y,label,13,weight=600);b.input(284,y+16,504,value)
b.button(612,683,176,"Lưu thông tin")
b.rect(836,210,568,556,C["white"],12,C["line"]);b.text(860,249,"Đổi mật khẩu",18,weight=650)
b.text(860,282,"Xác minh mật khẩu hiện tại trước khi đổi.",13,C["muted"])
for y,label in [(334,"Mật khẩu hiện tại"),(435,"Mật khẩu mới"),(536,"Nhập lại mật khẩu mới")]:b.text(860,y,label,13,weight=600);b.input(860,y+16,520,"Nhập mật khẩu","lock")
b.button(1196,683,184,"Đổi mật khẩu")
add("05-ho-so-ca-nhan","Hồ sơ cá nhân",b)

b=Board("Căn hộ của tôi · Cư dân")
b.header("Căn hộ của tôi","Thông tin gia đình của bạn, rõ ràng và dễ tra cứu.",active="Căn hộ của tôi",resident=True)
b.rect(260,210,1144,158,C["navy"],14)
b.text(288,245,"CHÀO NGUYỄN VĂN AN",11,"#AAC4D1",600);b.text(288,290,"Phòng 050",34,C["white"],700);b.text(288,332,"60 m²   ·   Chủ hộ: Nguyễn Văn An   ·   3 thành viên",15,"#D6E6EE")
b.badge(1237,235,"Thường trú","green",138)
b.text(260,430,"Thành viên gia đình",20,weight=650);b.text(1404,430,"3 người",13,C["muted"],anchor="end")
def memberrow(d,y,r):
    d.rect(284,y+18,42,42,C["soft"],21);d.text(305,y+45,r[0],12,C["brand"],650,"middle");d.text(345,y+44,r[1],16,weight=600);d.text(800,y+44,r[3]);d.badge(1150,y+24,"Thường trú")
b.table(454,[(284,"HỌ VÀ TÊN"),(800,"QUAN HỆ"),(1150,"TRẠNG THÁI")],people,memberrow,height=78)
b.rect(260,790,1144,72,C["white"],10,C["line"]);b.icon(282,814,"shield");b.text(318,821,"Hồ sơ hành chính & lịch sử cư trú",15,weight=600);b.text(1330,821,"Xem chi tiết",13,C["brand"],600,"end");b.icon(1360,810,"chevron")
add("06-can-ho-cua-toi","Căn hộ của tôi",b)

b=Board("Đăng nhập BlueMoon")
b.rect(0,0,680,1000,C["navy"],0)
b.rect(60,58,42,42,C["brand"],12);b.text(81,87,"b",30,C["white"],700,"middle");b.text(116,88,"bluemoon",28,C["white"],700)
b.text(60,289,"Quản lý gọn gàng.",44,C["white"],700);b.text(60,350,"Mỗi ngày nhẹ nhàng hơn.",38,C["white"],700)
b.text(60,409,"Căn hộ, cư dân và hồ sơ ở cùng một nơi.",19,"#BDD0DB")
for y,label in [(499,"Tìm thông tin nhanh"),(562,"Cập nhật ngay tại hồ sơ"),(625,"Phân quyền rõ cho từng người")]:b.rect(60,y-26,34,34,"#244653",9);b.icon(67,y-19,"check","#B9E3DC");b.text(110,y,label,18,"#E5EEF2",500)
b.text(60,934,"BlueMoon · Nhóm 09 · HUST",13,"#AAC4D1")
b.text(794,253,"Chào mừng trở lại",32,weight=700);b.text(794,292,"Đăng nhập để tiếp tục công việc của bạn.",16,C["muted"])
for y,label,placeholder,ic in [(364,"Tên đăng nhập","Nhập tên đăng nhập","user"),(469,"Mật khẩu","Nhập mật khẩu","lock")]:b.text(794,y,label,14,weight=600);b.input(794,y+18,492,placeholder,ic,h=50)
b.button(794,584,492,"Đăng nhập",h=50)
b.text(1040,681,"Bạn là cư dân chưa có tài khoản?",14,C["muted"],anchor="middle");b.button(794,706,492,"Đăng ký tài khoản cư dân","secondary",h=48)
b.text(1040,813,"Tài khoản cư dân cần được Ban quản trị phê duyệt.",12,C["muted"],anchor="middle")
add("07-dang-nhap","Đăng nhập",b)

b=Board("Thu phí & công nợ · Thiết kế Sprint 2")
b.header("Thu phí & công nợ","Theo dõi đúng số dư, ghi nhận khoản thu ngay tại căn hộ.",active="Thu phí & công nợ",finance=True)
b.input(260,205,174,"Tháng 11/2026");b.icon(402,218,"down");b.input(450,205,610,"Tìm số phòng hoặc chủ hộ","search");b.button(1224,205,180,"Xuất báo cáo","secondary","download")
for x,label,val,foot,accent in [(260,"Tổng phải thu","48.600.000 ₫","60 hóa đơn",False),(650,"Đã thu","36.450.000 ₫","45 căn đủ phí",False),(1040,"Còn phải thu","12.150.000 ₫","15 căn chưa đủ",True)]:b.metric(x,278,364,label,val,foot,accent)
b.text(260,432,"Bảng thu theo căn hộ",18,weight=650)
b.rect(260,453,1144,410,C["white"],12,C["line"])
for x,t in [(282,"PHÒNG / CHỦ HỘ"),(650,"PHẢI THU"),(840,"ĐÃ THU"),(1030,"CÒN NỢ"),(1232,"THAO TÁC")]:b.text(x,483,t,12,C["muted"],600)
for i,(room,name,paid,debt) in enumerate([("050","Nguyễn Văn An","500.000 ₫","310.000 ₫"),("101","Lê Hoàng Nam","0 ₫","810.000 ₫"),("102","Đặng Quốc Bảo","810.000 ₫","0 ₫"),("201","Vũ Thị Mai","810.000 ₫","0 ₫")]):
    y=503+i*83;b.line(260,y,1404,y);b.text(282,y+32,"Phòng "+room,16,weight=650);b.text(282,y+56,name,12,C["muted"]);b.text(650,y+43,"810.000 ₫");b.text(840,y+43,paid);b.text(1030,y+43,debt,15,C["amber"] if debt!="0 ₫" else C["green"],650);b.button(1232,y+22,146,"Thu tiền" if debt!="0 ₫" else "Xem biên lai","primary" if debt!="0 ₫" else "secondary",h=38)
b.text(260,914,"Chuẩn bị kỳ mới",14,C["brand"],600);b.text(260,942,"Chốt giá và xem trước bảng thu khi cần phát hành kỳ tiếp theo.",13,C["muted"])
add("08-thu-phi-sprint-2","Thu phí & công nợ",b,"Sprint 2 · Đề xuất")

b=Board("Căn hộ của tôi · Điện thoại",390,844)
b.rect(0,0,390,80,C["white"],0);b.text(20,30,"9:41",13,weight=650);b.text(20,66,"bluemoon",23,C["brand"],700);b.rect(334,41,32,32,C["soft"],16);b.text(350,62,"AN",10,C["brand"],650,"middle")
b.text(20,128,"Căn hộ của tôi",25,weight=700);b.text(20,157,"Xin chào, Nguyễn Văn An",14,C["muted"])
b.rect(20,186,350,160,C["navy"],14);b.text(40,220,"PHÒNG CỦA BẠN",10,"#BDD0DB",600);b.text(40,262,"050",40,C["white"],700);b.text(40,296,"60 m² · 3 thành viên",14,"#D6E6EE");b.text(40,324,"Chủ hộ: Nguyễn Văn An",13,"#D6E6EE")
b.text(20,390,"Thành viên gia đình",19,weight=650)
for i,r in enumerate(people):
    y=411+i*86;b.rect(20,y,350,74,C["white"],10,C["line"]);b.rect(34,y+17,40,40,C["soft"],20);b.text(54,y+43,r[0],11,C["brand"],650,"middle");b.text(88,y+29,r[1],14,weight=600);b.text(88,y+52,r[3]+" · Thường trú",12,C["muted"])
b.text(20,716,"Xem hồ sơ & lịch sử cư trú",14,C["brand"],600);b.icon(343,700,"chevron",C["brand"])
b.rect(0,766,390,78,C["white"],0);b.line(0,766,390,766);b.icon(87,779,"building",C["brand"]);b.text(97,822,"Căn hộ",11,C["brand"],600,"middle");b.icon(281,779,"user");b.text(291,822,"Cá nhân",11,C["muted"],400,"middle")
add("09-mobile-cu-dan","Cư dân · Điện thoại",b)

from sprint2_boards import add_sprint2
add_sprint2(Board, C, add, boards)

groups = [
    ("Sprint 1 · Quản lý cư dân", [d for d in boards if d["phase"] == "Sprint 1"]),
    ("Sprint 2 · Thu phí & vận hành", [d for d in boards if d.get("stories")]),
    ("Lưu trữ · Phác thảo ban đầu", [d for d in boards if d["key"] == "08-thu-phi-sprint-2"]),
]
options=''
for group_title, items in groups:
    options += f'<section class="screen-group"><p>{escape(group_title)} · {len(items)}</p>'
    for d in items:
        d["group"] = group_title
        options += f'<button data-key="{d["key"]}">{escape(d["title"])}<small>{escape(d["phase"])}'+(' · '+', '.join(d['stories']) if d.get('stories') else '')+'</small></button>'
    options += '</section>'
data=json.dumps({d["key"]:dict(title=d["title"],phase=d["phase"],svg=d["svg"]) for d in boards},ensure_ascii=False).replace('</','<\\/')
html='''<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BlueMoon — Bộ thiết kế giao diện</title><style>*{box-sizing:border-box}body{margin:0;font:14px "Segoe UI",sans-serif;background:#e8edf2;color:#172b3a}header{height:74px;background:#142d3d;color:white;display:flex;align-items:center;justify-content:space-between;padding:0 28px}header strong{font-size:20px}header span{color:#b8cbd6;font-size:12px}.layout{display:grid;grid-template-columns:230px 1fr;min-height:calc(100vh - 74px)}aside{background:white;padding:22px 14px;border-right:1px solid #d9e2e9}aside p{padding:0 10px;color:#607486;font-size:12px}button{font:inherit}aside button{display:block;width:100%;border:0;background:none;padding:12px;text-align:left;border-radius:8px;color:#243e50;cursor:pointer;margin:4px 0}aside button.active{background:#eaf5f4;color:#116a73;font-weight:600}small{display:block;font-size:10px;font-weight:400;color:#607486;margin-top:4px}main{padding:24px;overflow:auto}.toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;gap:16px}.toolbar strong{font-size:18px}a{color:#116a73;text-decoration:none;font-weight:600}.preview{max-width:1440px;background:white;box-shadow:0 12px 36px #142d3d12;border-radius:10px;overflow:hidden}.preview svg{display:block;width:100%;height:auto}.preview.mobile{max-width:390px;margin:auto}.note{font-size:12px;color:#607486;line-height:1.8;max-width:1000px;margin-top:20px}.download{padding:10px 14px;background:#fff;border:1px solid #ccd9e1;border-radius:8px;white-space:nowrap}@media(max-width:800px){.layout{grid-template-columns:1fr}aside{display:flex;overflow:auto;padding:8px}aside p{display:none}aside button{min-width:160px}main{padding:12px}header{padding:16px}.toolbar{align-items:start}.toolbar strong{font-size:15px}}</style><header><div><strong>BlueMoon / UI Redesign</strong><br><span>Rõ thông tin · Ít thao tác · Giữ ngữ cảnh</span></div><span>Bản thiết kế — chưa triển khai vào ứng dụng</span></header><div class="layout"><aside><p>CÁC MÀN HÌNH</p>OPTIONS</aside><main><div class="toolbar"><strong id="title"></strong><a id="download" class="download" download>Tải SVG để nhập Figma</a></div><div id="preview" class="preview"></div><p class="note">Dữ liệu minh họa để đánh giá bố cục. Sprint 1 và phần đề xuất Sprint 2 được ghi riêng. Bản xem trước cho phép chuyển màn hình; các nút bên trong màn hình là thiết kế tĩnh, không ghi dữ liệu vào ứng dụng. Figma SVG có thể cần chọn lại font Segoe UI khi nhập.</p></main></div><script>const screens=DATA;function show(key){const d=screens[key];document.getElementById('title').textContent=d.title+' · '+d.phase;const p=document.getElementById('preview');p.innerHTML=d.svg;p.classList.toggle('mobile',key.includes('mobile'));document.getElementById('download').href='figma-import/'+key+'.svg';document.querySelectorAll('button[data-key]').forEach(b=>b.classList.toggle('active',b.dataset.key===key));location.hash=key}document.querySelectorAll('button[data-key]').forEach(b=>b.onclick=()=>show(b.dataset.key));show(screens[location.hash.slice(1)]?location.hash.slice(1):Object.keys(screens)[0]);</script></html>'''.replace('OPTIONS',options).replace('DATA',data)
html=html.replace('aside{background:white;', 'aside{position:sticky;top:0;height:calc(100vh - 74px);overflow-y:auto;background:white;')
html=html.replace("show(screens[location.hash.slice(1)]?location.hash.slice(1):Object.keys(screens)[0]);", "document.getElementById('preview').addEventListener('click',e=>{const a=e.target.closest('a[data-screen]');if(a){e.preventDefault();if(screens[a.dataset.screen])show(a.dataset.screen)}});window.addEventListener('hashchange',()=>{const key=location.hash.slice(1);if(screens[key])show(key)});show(screens[location.hash.slice(1)]?location.hash.slice(1):'01-can-ho');")
html=html.replace('các nút bên trong màn hình là thiết kế tĩnh, không ghi dữ liệu vào ứng dụng.', 'một số nút chính cho bấm chuyển bước theo dữ liệu mẫu, không thu tiền, xuất file hay ghi dữ liệu thật. Các trạng thái là độc lập để rà soát giao diện.')
(ROOT/'index.html').write_text(html,encoding='utf-8')
(ROOT/'manifest.json').write_text(json.dumps([{k:v for k,v in d.items() if k!='svg'} for d in boards],ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Created {len(boards)} SVG boards and preview gallery in {ROOT}')
