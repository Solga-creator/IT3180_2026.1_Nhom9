from pathlib import Path
import shutil, json, xml.etree.ElementTree as E
from html import escape
from urllib.parse import quote
import heapq
E.register_namespace('', 'http://www.w3.org/2000/svg')

PROJECT=Path(__file__).resolve().parents[2]
OUT=PROJECT.parent/'BlueMoon_Documents_v2_2026-11-28'
ORIGINAL=Path(__file__).resolve().parent/'originals'
UI=PROJECT/'design/bluemoon-ui-redesign'
for p in ['01_Tai_lieu','02_Giao_dien','03_So_do/Nguon_Drawio','03_So_do/SVG','03_So_do/PNG','99_Nguon_goc_Drawio']:(OUT/p).mkdir(parents=True,exist_ok=True)
for f in (PROJECT/'docs').glob('*.md'):shutil.copy2(f,OUT/'01_Tai_lieu'/f.name)
for f in ORIGINAL.glob('*.drawio'):shutil.copy2(f,OUT/'99_Nguon_goc_Drawio'/f.name)
for name in ['index.html','manifest.json','README.md','DESIGN-OVERVIEW.md','SPRINT2-DESIGN.md']:
    shutil.copy2(UI/name,OUT/'02_Giao_dien'/name)
shutil.copytree(UI/'figma-import',OUT/'02_Giao_dien/figma-import',dirs_exist_ok=True)
for f in UI.glob('*.zip'):shutil.copy2(f,OUT/'02_Giao_dien'/f.name)

INK='#172B3A'; MUTED='#607486'; BRAND='#116A73'; LINE='#CBD7DF'; PRESENT='#EAF0FC'; PLANNED='#EAF5F4'
def route_grid(start,end,boxes,w,h):
    step=10
    a=tuple(round(v/step) for v in start);b=tuple(round(v/step) for v in end)
    blocked=set()
    for _,x,y,bw,bh in boxes:
        for xx in range(int((x-8)//step),int((x+bw+8)//step)+1):
            for yy in range(int((y-8)//step),int((y+bh+8)//step)+1):blocked.add((xx,yy))
    blocked.discard(a);blocked.discard(b);todo=[(0,0,a)];cost={a:0};parent={}
    while todo:
        _,g,p=heapq.heappop(todo)
        if p==b:break
        if g!=cost.get(p):continue
        for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)]:
            n=(p[0]+dx,p[1]+dy)
            if n in blocked or not (2<=n[0]<w//step-2 and 11<=n[1]<h//step-6):continue
            ng=g+1
            if ng<cost.get(n,10**9):cost[n]=ng;parent[n]=p;heapq.heappush(todo,(ng+abs(n[0]-b[0])+abs(n[1]-b[1]),ng,n))
    if b not in parent and b!=a:return [start,(start[0],end[1]),end]
    chain=[b]
    while chain[-1]!=a:chain.append(parent[chain[-1]])
    pts=[(x*step,y*step) for x,y in reversed(chain)];result=[pts[0]]
    for i in range(1,len(pts)-1):
        if (pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1])!=(pts[i+1][0]-pts[i][0],pts[i+1][1]-pts[i][1]):result.append(pts[i])
    result.append(pts[-1]);return [start]+result+[end]
class Diagram:
    def __init__(self,name,title,subtitle,w=1800,h=1100):
        self.name,self.title,self.subtitle,self.w,self.h=name,title,subtitle,w,h
        self.page=E.Element('diagram',{'name':name,'id':name})
        self.model=E.SubElement(self.page,'mxGraphModel',{'dx':str(w),'dy':str(h),'grid':'1','gridSize':'10','page':'1','pageWidth':str(w),'pageHeight':str(h)})
        self.root=E.SubElement(self.model,'root');E.SubElement(self.root,'mxCell',{'id':'0'});E.SubElement(self.root,'mxCell',{'id':'1','parent':'0'})
        self.n=1;self.boxes={};self.svg=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><defs><marker id="arrow" markerWidth="9" markerHeight="9" refX="8" refY="4" orient="auto"><path d="M0 0L8 4L0 8" fill="none" stroke="{MUTED}"/></marker></defs><rect width="100%" height="100%" fill="#FFFFFF"/>']
        self.text(40,48,title,28,True)
        self.text(40,82,subtitle,15,False,MUTED)
        self.text(40,h-26,'BlueMoon SE09 · 28/11/2026 · Xanh lam: hiện có S1 / Xanh teal: thiết kế S2 · Chưa triển khai S2',13,False,MUTED)
    def cell(self,value,style,x,y,w,h):
        self.n+=1;node=E.SubElement(self.root,'mxCell',{'id':f'n{self.n}','value':value,'style':style,'vertex':'1','parent':'1'})
        E.SubElement(node,'mxGeometry',{'x':str(x),'y':str(y),'width':str(w),'height':str(h),'as':'geometry'})
        return node.get('id')
    def text(self,x,y,s,size=16,bold=False,color=INK):
        self.cell(s,f'text;html=0;align=left;verticalAlign=middle;fontFamily=Segoe UI;fontSize={size};fontColor={color};fontStyle={1 if bold else 0};',x,y-size,1650,size+10)
        self.svg.append(f'<text x="{x}" y="{y}" font-family="Segoe UI,Arial,sans-serif" font-size="{size}" font-weight="{650 if bold else 400}" fill="{color}">{escape(s)}</text>')
    def box(self,key,x,y,w,h,title,lines=(),planned=False,shape='rect'):
        fill=PLANNED if planned else PRESENT;dash='dashed=1;' if planned else ''
        shapeStyle='rhombus;' if shape=='diamond' else 'ellipse;' if shape=='ellipse' else 'rounded=1;arcSize=8;'
        val=title+'\n'+'\n'.join(lines) if lines else title
        cid=self.cell(val,f'{shapeStyle}whiteSpace=wrap;html=0;fillColor={fill};strokeColor={BRAND if planned else "#607DB1"};{dash}fontFamily=Segoe UI;fontSize=16;align=center;verticalAlign=middle;',x,y,w,h)
        self.boxes[key]=(cid,x,y,w,h)
        self.svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" fill="{fill}" stroke="{BRAND if planned else "#607DB1"}"'+(' stroke-dasharray="6 4"' if planned else '')+'/>')
        n=len(lines)+1;yy=y+(h-n*23)/2+18
        for i,s in enumerate([title]+list(lines)):
            self.svg.append(f'<text x="{x+w/2}" y="{yy+i*23}" font-family="Segoe UI,Arial,sans-serif" font-size="{17 if i==0 else 14}" font-weight="{650 if i==0 else 400}" text-anchor="middle" fill="{INK}">{escape(s)}</text>')
        return key
    def edge(self,a,b,label='',dashed=False,points=None):
        aid,ax,ay,aw,ah=self.boxes[a];bid,bx,by,bw,bh=self.boxes[b]
        if abs((ay+ah/2)-(by+bh/2))<90:
            if bx>ax:s=(ax+aw,ay+ah/2);t=(bx,by+bh/2)
            else:s=(ax,ay+ah/2);t=(bx+bw,by+bh/2)
        else:
            if by>ay:s=(ax+aw/2,ay+ah);t=(bx+bw/2,by)
            else:s=(ax+aw/2,ay);t=(bx+bw/2,by+bh)
        so=(s[0]+(20 if s[0]==ax+aw else -20 if s[0]==ax else 0),s[1]+(20 if s[1]==ay+ah else -20 if s[1]==ay else 0))
        to=(t[0]+(20 if t[0]==bx+bw else -20 if t[0]==bx else 0),t[1]+(20 if t[1]==by+bh else -20 if t[1]==by else 0))
        pts=[s]+(points if points else route_grid(so,to,self.boxes.values(),self.w,self.h))+[t]
        self.n+=1;edge=E.SubElement(self.root,'mxCell',{'id':f'e{self.n}','value':label,'edge':'1','parent':'1','source':aid,'target':bid,'style':f'edgeStyle=orthogonalEdgeStyle;rounded=0;html=0;endArrow=block;fontSize=12;strokeColor={MUTED};'+('dashed=1;' if dashed else '')})
        edge.set('style',edge.get('style').replace('edgeStyle=orthogonalEdgeStyle;','edgeStyle=none;')+f'exitX={(s[0]-ax)/aw};exitY={(s[1]-ay)/ah};entryX={(t[0]-bx)/bw};entryY={(t[1]-by)/bh};')
        geom=E.SubElement(edge,'mxGeometry',{'relative':'1','as':'geometry'})
        if len(pts)>2:
            array=E.SubElement(geom,'Array',{'as':'points'})
            for x,y in pts[1:-1]:E.SubElement(array,'mxPoint',{'x':str(x),'y':str(y)})
        self.svg.append(f'<polyline points="'+ ' '.join(f'{x},{y}' for x,y in pts)+f'" fill="none" stroke="{MUTED}" stroke-width="1.5" marker-end="url(#arrow)"'+(' stroke-dasharray="5 4"' if dashed else '')+'/>')
        if label:
            p,q=max(zip(pts,pts[1:]),key=lambda pq:abs(pq[1][0]-pq[0][0])+abs(pq[1][1]-pq[0][1]));mx,my=(p[0]+q[0])/2,(p[1]+q[1])/2
            self.svg.append(f'<text x="{mx+7}" y="{my-8}" font-family="Segoe UI,Arial,sans-serif" font-size="12" fill="{MUTED}" stroke="#FFFFFF" stroke-width="4" paint-order="stroke">{escape(label)}</text>')
    def export(self):
        file=OUT/'03_So_do/SVG'/f'{self.name}.svg';file.write_text(''.join(self.svg)+'</svg>',encoding='utf-8');return self.page

catalog=[]
def write_source(name,diagrams,preserve=True):
    root=E.Element('mxfile',{'host':'app.diagrams.net','type':'device','version':'28.0.0'})
    for d in diagrams:root.append(d.export());catalog.append({'source':name,'page':d.name,'title':d.title,'kind':'updated'})
    old=ORIGINAL/name
    if preserve and old.exists():
        for page in E.parse(old).getroot().findall('diagram'):
            page.set('name','ARCHIVE_20261124__'+page.get('name','Page'));page.set('id','archive_'+page.get('id','page'));root.append(page)
    E.ElementTree(root).write(OUT/'03_So_do/Nguon_Drawio'/name,encoding='utf-8',xml_declaration=True)

# Current and planned use cases: preserve original detail pages as archives.
d=Diagram('UC_S1_Current','Use cases Sprint 1 — Chức năng hiện có','8 US hiện có; nghiệm thu toàn bộ suite vẫn cần cập nhật bằng chứng.')
d.box('staff',60,150,240,105,'ADMIN / BQT',['Thao tác nội bộ'])
d.box('resident',60,510,240,105,'RESIDENT',['Xem hộ của mình'])
for i,(key,title,lines) in enumerate([('apt','Căn hộ / nhân khẩu',['US-001 · US-002','Thêm/sửa/xóa theo ràng buộc']),('lookup','Tra cứu / Excel',['US-003 · US-005','Tìm và lọc đúng apartmentId']),('status','Biến động cư trú',['US-004','Resolver ngày Việt Nam']),('accounts','Tài khoản / hồ sơ',['US-015 · 016 · 017','Đăng nhập, cấp/duyệt, đổi mật khẩu'])]):
    d.box(key,430+(i%2)*560,150+(i//2)*350,460,145,title,lines);d.edge('staff',key)
d.box('home',430,810,460,110,'Căn hộ của tôi',['Che CCCD của thành viên khác']);d.edge('resident','home');d.edge('resident','accounts','Đăng nhập / đổi mật khẩu')
d2=Diagram('UC_S2_Planned','Use cases Sprint 2 — Thiết kế v1.0','11 US dự kiến; quyền và audit đi cùng API ghi tiền, không chỉ ẩn menu.')
for i,(key,title,lines) in enumerate([('accountant','ADMIN / ACCOUNTANT',['Chốt giá, phát hành, sửa hóa đơn']),('treasurer','ADMIN / TREASURER',['Thu/hủy thu phí bắt buộc']),('bqt','ADMIN / BQT',['Quản lý hộ, đợt/quỹ theo quyền']),('resident','RESIDENT',['Chỉ hóa đơn/chứng từ hộ mình'])]):d2.box(key,40,140+i*215,295,100,title,lines,True)
for i,(key,title,lines) in enumerate([('rates','US-006 · Đơn giá',['Giá và lịch sử ngày hiệu lực']),('bills','US-008 / 009 · Hóa đơn',['Preview, phát hành, giấy báo']),('pay','US-010 / 012 · Thu & nợ',['Một phần/đủ, hủy, chống trùng']),('fund','US-007 / 011 · Quỹ',['Tạo/đóng đợt, ghi/hủy ủng hộ']),('report','US-013 / 014 · Báo cáo',['Lịch sử, kỳ hóa đơn / thực thu']),('admin','US-018 / 019 · Kiểm soát',['Quyền chi tiết, audit atomic'])]):d2.box(key,480+(i%2)*610,140+(i//2)*275,480,130,title,lines,True)
for a,b in [('accountant','rates'),('accountant','bills'),('treasurer','pay'),('bqt','fund'),('bqt','report'),('accountant','admin'),('resident','bills'),('resident','report')]:d2.edge(a,b,'Kiểm quyền theo API',True)
write_source('UseCase_Diagrams.drawio',[d,d2])

# Activity flow pages with explicit alternative outcomes.
def flow(name,title,sub,steps,planned=True):
    d=Diagram(name,title,sub,w=1500,h=max(1100,len(steps)*135+200))
    for i,(key,t,ls) in enumerate(steps):
        d.box(key,420,130+i*135,620,90,t,ls,planned)
        if i:d.edge(steps[i-1][0],key)
    return d
a1=flow('ACT_S1_Export','Activity — Tra cứu và xuất nhân khẩu','Dùng cùng ngày hiệu lực và apartmentId; đây là hành vi S1 đã sửa.',[
('auth','Xác thực / quyền ADMIN, BQT',[]),('filter','Chuẩn hóa search + apartmentId + status',[]),('read','Đọc nhân khẩu và lịch sử sự kiện',[]),('resolve','Tính trạng thái theo ngày Việt Nam',[]),('select','Lọc trạng thái hiệu lực',['Không dùng riêng current_status lưu cũ']),('xlsx','Có kết quả → Excel; không có → 404',[])],False)
a2=flow('ACT_S2_Generate','Activity — Preview và phát hành','Đề xuất: hộ/diện tích/giá tại đầu kỳ, previewToken 10 phút.',[
('auth','Kiểm quyền ADMIN / ACCOUNTANT',[]),('history','Đọc lịch sử đầu kỳ',['Thiếu dữ liệu: 422, không phát hành']),('preview','Xem trước + token + fingerprint',[]),('confirm','Người dùng xác nhận',[]),('recheck','Kiểm lại token / dữ liệu',['Đổi dữ liệu hoặc hết hạn: 409, xem lại']),('tx','Transaction phát hành toàn kỳ',['Chặn trùng; lỗi một căn rollback cả kỳ']),('audit','Snapshot + audit trong transaction',[]),('done','Commit và hiển thị bảng thu',[])])
a3=flow('ACT_S2_Collect','Activity — Ghi nhận thu tiền','Đề xuất; chuyển khoản chỉ ghi sau đối chiếu tiền thực nhận.',[
('select','Chọn căn / hộ / kỳ đang nợ',[]),('amount','Điền số tiền và hình thức',['Hiện phân bổ DV trước, QL sau']),('confirm','Xác nhận phòng, hộ, kỳ, tiền',[]),('auth','Server kiểm quyền / validate',[]),('key','Kiểm idempotency + fingerprint',['Cùng key/payload: trả giao dịch cũ; khác: 409']),('lock','Khóa hóa đơn, đọc lại nợ',['Không đủ điều kiện: rollback']),('save','Khoản thu + tổng + audit atomic',[]),('commit','Commit / trả biên lai',['Mất phản hồi: giữ key và kiểm tra lại']),('print','In lại chỉ đọc, không thu lại',[])])
a4=flow('ACT_S2_Transfer','Activity — Chuyển giao hộ','Phân biệt đổi đại diện trong cùng gia đình với thay hộ.',[
('read','Chọn căn, xem hộ cũ và nợ',[]),('confirm','Xác nhận hộ mới / lý do',['Nợ cũ không chuyển sang hộ mới']),('lock','Khóa căn, kiểm khoảng hộ không chồng',[]),('close','Kết thúc hộ cũ, tạo householdId mới',[]),('revoke','Giữ chứng từ, thu hồi quyền hộ cũ',[]),('audit','Audit / commit trong cùng transaction',[]),('done','Cư dân mới chỉ xem dữ liệu hộ mới',[])])
write_source('Activity_Diagrams.drawio',[a1,a2,a3,a4])

# UML sequence pages. Each interaction remains an editable edge between lifelines.
def sequence(name,title,sub,messages):
    d=Diagram(name,title,sub,w=1800,h=1100)
    actors=['UI','API / Auth','Service','Repository / DB','Audit']
    for i,a in enumerate(actors):
        d.box(a,70+i*340,130,260,65,a,[],True)
        for j in range(13):d.svg.append(f'<path d="M{200+i*340} {205+j*60}v35" stroke="{LINE}" stroke-dasharray="5 4"/>')
    for i,(a,b,label) in enumerate(messages):
        yy=245+i*67;x1=200+actors.index(a)*340;x2=200+actors.index(b)*340
        d.n+=1;cell=E.SubElement(d.root,'mxCell',{'id':f'm{d.n}','value':f'{i+1}. {label}','edge':'1','parent':'1','style':'endArrow=block;html=0;fontSize=13;fontFamily=Segoe UI;strokeColor='+MUTED+';'})
        geo=E.SubElement(cell,'mxGeometry',{'relative':'1','as':'geometry'});E.SubElement(geo,'mxPoint',{'x':str(x1),'y':str(yy),'as':'sourcePoint'});E.SubElement(geo,'mxPoint',{'x':str(x2),'y':str(yy),'as':'targetPoint'})
        d.svg.append(f'<path d="M{x1} {yy}H{x2}" fill="none" stroke="{MUTED}" marker-end="url(#arrow)"/><text x="{min(x1,x2)+8}" y="{yy-10}" font-family="Segoe UI,Arial,sans-serif" font-size="13" fill="{INK}">{escape(str(i+1)+". "+label)}</text>')
    return d
s1=sequence('SEQ_S1_Export','Sequence — Xuất Excel nhân khẩu','Hiện có S1; actor API giữ xác thực, service tạo Excel từ cùng resolver.',[
('UI','API / Auth','GET export?status&search&apartmentId'),('API / Auth','Service','Kiểm quyền; truyền đủ bộ lọc'),('Service','Repository / DB','Đọc cư dân và sự kiện theo căn chính xác'),('Repository / DB','Service','Resolver trạng thái theo ngày Việt Nam'),('Service','API / Auth','Lọc hiệu lực, tạo Buffer Excel / 404'),('API / Auth','UI','Tải file / hiển thị lỗi')])
s2=sequence('SEQ_S2_Payment','Sequence — Thu phí và chống trùng','S2 Planned; kiểm quyền trước replay, fingerprint gắn payload.',[
('UI','API / Auth','POST payments + idempotencyKey'),('API / Auth','Service','ADMIN/TREASURER, validate request'),('Service','Repository / DB','BEGIN; tìm key + fingerprint'),('Repository / DB','Service','Đã có: replay; khác payload: 409'),('Service','Repository / DB','FOR UPDATE hóa đơn; đọc lại nợ'),('Service','Repository / DB','INSERT payment; cập nhật tổng VALID'),('Service','Audit','Ghi audit bằng cùng connection'),('Audit','Repository / DB','Lỗi audit → rollback toàn bộ'),('Service','Repository / DB','COMMIT khi mọi bước thành công'),('Service','API / Auth','Trả payment + bill + replayed'),('API / Auth','UI','Biên lai; mất phản hồi giữ key để thử lại')])
s3=sequence('SEQ_S2_Void','Sequence — Hủy khoản thu nhầm','S2 Planned; không xóa chứng từ và không hoàn tiền tự động.',[
('UI','API / Auth','POST payments/:id/void + reason'),('API / Auth','Service','Kiểm quyền / bắt buộc lý do'),('Service','Repository / DB','BEGIN; khóa hóa đơn và payment'),('Service','Repository / DB','VOIDED; tính tổng từ VALID còn lại'),('Service','Audit','Lưu before/after/reason cùng transaction'),('Service','Repository / DB','COMMIT; hủy lặp không trừ hai lần'),('API / Auth','UI','Số dư mới; bản in có dấu ĐÃ HỦY')])
s4=sequence('SEQ_S2_Household','Sequence — Kết thúc hộ cũ, mở hộ mới','S2 Planned; history và quyền cư dân không trộn giữa hai hộ.',[
('UI','API / Auth','POST household-transfers + headResident/reason'),('API / Auth','Service','ADMIN/BQT; xác nhận ngày hôm nay'),('Service','Repository / DB','BEGIN; khóa căn, kiểm khoảng hộ'),('Service','Repository / DB','ends_on hộ A; tạo hộ B có starts_on'),('Service','Repository / DB','Giữ nợ A; thu hồi phiên/quyền hộ A'),('Service','Audit','Ghi chuyển hộ cùng connection'),('Service','Repository / DB','COMMIT / lỗi → rollback'),('API / Auth','UI','Hiện hộ mới; lịch sử A chỉ nội bộ')])
write_source('Sequence_Diagrams.drawio',[s1,s2,s3,s4])

# ERD: twelve business tables; planned extensions are shown explicitly.
entities=[
('users','users',['PK id','username, role, token_version','FK resident_id','account_status'],False),
('apartments','apartments',['PK id','room_number, area','S2: diện tích theo lịch sử'],False),
('households','households',['PK id; FK apartment_id','head_resident_id','S2: starts_on, ends_on','S2: unique hộ đang mở'],False),
('residents','residents',['PK id; FK household_id','full_name, relationship','current_status + events','S2: joined_household_on'],False),
('events','residency_events',['PK id; FK resident_id','status, start_date, end_date','recorded_by → users'],False),
('areas','apartment_area_versions',['PK id; FK apartment_id','area, effective_from','UNIQUE(căn, ngày hiệu lực)'],True),
('rates','fee_rate_configs',['PK id','service / management price','effective_from, updated_by'],True),
('bills','apartment_bills',['PK id; FK apartment / household','period, snapshot giá / diện tích','due / paid, lifecycle_status','revision, replaces_bill_id'],True),
('payments','fee_payments',['PK id; FK bill / apartment','amount, phân bổ DV / QL','key + fingerprint + receipt','VALID / VOIDED, reason'],True),
('campaigns','voluntary_campaigns',['PK id; name, fund_code','start_date, end_date','OPEN / CLOSED, created_by'],True),
('contributions','voluntary_contributions',['PK id; FK campaign / household','apartment, payer snapshot','amount, key / fingerprint','VALID / VOIDED, receipt'],True),
('audit','audit_logs',['PK id; actor_id','action, entity_type / id','before_data / after_data','reason, created_at'],True)]
erd=Diagram('ERD_S1_S2_v2','ERD — 12 bảng nghiệp vụ v1.0','5 bảng S1 + 7 bảng S2 dự kiến; không phải schema S2 đã chạy.',w=2040,h=1260)
for i,(k,t,ls,p) in enumerate(entities):erd.box(k,50+(i%4)*500,150+(i//4)*335,405,205,t,ls,p)
for a,b,label in [('apartments','households','1 → N theo thời gian'),('households','residents','1 → N'),('residents','events','1 → N'),('apartments','areas','1 → N'),('households','bills','1 → N'),('rates','bills','giá được snapshot'),('bills','payments','1 → N'),('campaigns','contributions','1 → N'),('users','audit','actor'),('households','contributions','1 → N')]:erd.edge(a,b,label,True)
write_source('Database_ERD.drawio',[erd],False)

classes=Diagram('CLASS_Domain_v2','Class / Domain — Liên kết cư dân và tài chính','Mô hình thiết kế: S1 hiện có, S2 planned. Không mô tả Java/MVC không tồn tại.',w=2040,h=1260)
for i,(k,t,ls,p) in enumerate(entities):classes.box(k,50+(i%4)*500,150+(i//4)*335,405,205,t,ls,p)
for a,b,l in [('apartments','households','has history'),('households','residents','members'),('bills','payments','payments'),('campaigns','contributions','contributions')]:classes.edge(a,b,l)
services=Diagram('CLASS_Services_v2','Class / Module — Trách nhiệm phân tầng','Modules JavaScript; chữ «service» không có nghĩa đã tạo class OO trong code.')
for i,(k,t,ls,p) in enumerate([('routes','Routes / Middleware',['Xác thực JWT, requireRoles','HTTP contract'],False),('handlers','Handlers',['Input HTTP → service','JSON / Buffer response'],False),('s1','Services S1',['auth / apartment / resident','Ngày Việt Nam dùng chung'],False),('s2','Services S2 (Planned)',['feeRate / billing / payment','campaign / query / report'],True),('repo','Repositories',['S1: user / apartment / resident','S2: billing / audit'],True),('strategy','FeeCalculationStrategy',['Dịch vụ / quản lý','S2 nối phân bổ tiền'],True)]):services.box(k,60+(i%3)*560,170+(i//3)*420,440,155,t,ls,p)
for a,b in [('routes','handlers'),('handlers','s1'),('handlers','s2'),('s1','repo'),('s2','repo'),('s2','strategy')]:services.edge(a,b)
write_source('Class_Diagram.drawio',[classes,services])

c=Diagram('COMP_S1_S2_v2','Component — Client/server và nghiệp vụ mở rộng','Giữ kiến trúc hiện có; chỉ các khối S2 được ghi Planned.')
for k,x,y,w,h,t,ls,p in [('ui',60,170,420,180,'React / Vite',['AppLayout, pages S1','S2: Billing / Campaign / Audit'],False),('http',640,170,420,180,'API / Auth middleware',['JSON / JWT / role checks','S2: requireRoles chi tiết'],False),('s1',1220,170,460,180,'Services S1',['Căn hộ, cư dân, tài khoản','Resolver ngày và xuất Excel'],False),('s2',640,560,420,180,'Services S2 — Planned',['Đơn giá, hóa đơn, thu, quỹ','Query, report, cư dân'],True),('repo',1220,560,460,180,'Repository / MySQL',['Transaction, FOR UPDATE','Audit cùng connection'],True),('tokens',60,560,420,180,'Thiết kế UI mới',['SVG / HTML review','Chưa áp vào frontend thật'],True)]:c.box(k,x,y,w,h,t,ls,p)
for a,b,l in [('ui','http','REST /api'),('http','s1','existing'),('http','s2','planned'),('s2','repo','query / TX'),('s1','repo','S1 queries'),('tokens','ui','hướng thiết kế')]:c.edge(a,b,l,True)
write_source('Component_Diagram.drawio',[c])

dep=Diagram('DEPLOY_v2','Deployment — Môi trường đã biết và mục tiêu v1.0','Không khẳng định S2 đã được deploy; không đưa hostname/mật khẩu Cloud cá nhân vào sơ đồ.')
dep.box('browser',70,180,430,190,'Trình duyệt',['React UI / JWT trong sessionStorage','Local: localhost:5174'],False)
dep.box('api',670,180,430,190,'Node.js / Express',['Local API: 3001','Đọc .env riêng, không chia sẻ secret'],False)
dep.box('db',1270,180,430,190,'MySQL / TiDB Cloud',['Connection pool mysql2','Database qua cấu hình cá nhân'],False)
dep.box('s2',670,610,430,180,'S2 rollout — Planned',['Backup trước migration','Role + audit + schema mới'],True)
dep.box('test',70,610,430,180,'DB kiểm thử riêng',['Không reset/restore DB demo','E2E, concurrency, restore'],True)
dep.box('backup',1270,610,430,180,'Backup / Restore — Planned',['Bản sao bảo vệ quyền truy cập','Thử khôi phục vào DB riêng'],True)
for a,b,l in [('browser','api','HTTP JSON /api'),('api','db','SQL / TLS nếu Cloud'),('s2','api','kiểm tra rồi triển khai'),('s2','test','verify'),('backup','test','restore verification')]:dep.edge(a,b,l,True)
write_source('Deployment_Diagram.drawio',[dep])

uml=Diagram('UML_Overview_v2','UML — Bản đồ sơ đồ Sprint 1 và Sprint 2','Từng loại sơ đồ có file nguồn Draw.io và bản SVG/PNG mới riêng.')
for i,(t,ls) in enumerate([('Use Case',['Ai được làm gì','S1 hiện có / S2 kế hoạch']),('Activity',['Luồng nghiệp vụ và lỗi','Ngày, tiền, quyền, rollback']),('Sequence',['UI → API → Service → DB','Key / khóa dòng / audit']),('Class / Domain',['12 thực thể dự kiến','Module JS, không giả MVC']),('Component',['React → REST → Services','Repository và DB']),('Deployment',['Local / Cloud đã biết','Backup, DB thử riêng'])]):uml.box(str(i),70+(i%3)*570,170+(i//3)*390,450,170,t,ls,i>2)
write_source('UML_Overview.drawio',[uml],False)

# Convert interface SVG to editable mxCells (text and rectangles); icons remain small vector images.
manifest=json.loads((UI/'manifest.json').read_text(encoding='utf-8'));ns={'s':'http://www.w3.org/2000/svg'}
def ui_page(item):
    svg=E.parse(UI/'figma-import'/(item['key']+'.svg')).getroot();page=E.Element('diagram',{'name':item['key'],'id':'ui_'+item['key']})
    model=E.SubElement(page,'mxGraphModel',{'page':'1','pageWidth':svg.get('width'),'pageHeight':svg.get('height'),'grid':'1','gridSize':'8'});r=E.SubElement(model,'root');E.SubElement(r,'mxCell',{'id':'0'});E.SubElement(r,'mxCell',{'id':'1','parent':'0'});i=0
    for node in list(svg):
        tag=node.tag.split('}')[-1]
        if tag not in ['rect','text','g']:continue
        i+=1;attrs=node.attrib
        if tag=='rect':
            x,y,w,h=[float(attrs.get(k,0)) for k in ['x','y','width','height']]
            style=f'rounded=1;arcSize=8;fillColor={attrs.get("fill","#ffffff")};strokeColor={attrs.get("stroke","none")};opacity={float(attrs.get("opacity",1))*100};'
            value=''
        elif tag=='text':
            size=float(attrs.get('font-size',14));xx=float(attrs.get('x',0));anchor=attrs.get('text-anchor','start');w=min(1200,max(120,len(node.text or '')*size*.65+15));x=xx-w/2 if anchor=='middle' else xx-w if anchor=='end' else xx;y=float(attrs.get('y',0))-size;h=size*1.5
            value=node.text or '';align='center' if anchor=='middle' else 'right' if anchor=='end' else 'left';style=f'text;html=0;whiteSpace=wrap;align={align};verticalAlign=top;fontFamily=Segoe UI;fontSize={size};fontColor={attrs.get("fill",INK)};fontStyle={1 if int(attrs.get("font-weight",400))>=600 else 0};spacing=0;'
        else:
            import re
            m=re.search(r'translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+)\)',attrs.get('transform',''))
            if not m:continue
            x,y,scale=map(float,m.groups());w=h=24*scale
            small=E.Element('{http://www.w3.org/2000/svg}svg',{'width':'24','height':'24','viewBox':'0 0 24 24'})
            for k,v in attrs.items():
                if k!='transform':small.set(k,v)
            for child in node:small.append(child)
            raw=E.tostring(small,encoding='unicode').replace('ns0:','').replace(':ns0','')
            value='';style='shape=image;imageAspect=0;image=data:image/svg+xml,'+quote(raw,safe='')+';'
        c=E.SubElement(r,'mxCell',{'id':f'ui{i}','value':value,'style':style,'vertex':'1','parent':'1'});E.SubElement(c,'mxGeometry',{'x':str(x),'y':str(y),'width':str(w),'height':str(h),'as':'geometry'})
    return page
for phase,name in [('Sprint 1','Wireframes_Sprint1.drawio'),('Sprint 2','Wireframes_Sprint2.drawio')]:
    root=E.Element('mxfile',{'host':'app.diagrams.net','type':'device'})
    for item in manifest:
        if (phase=='Sprint 1' and item['phase']=='Sprint 1') or (phase=='Sprint 2' and item.get('stories')):
            root.append(ui_page(item));shutil.copy2(UI/'figma-import'/(item['key']+'.svg'),OUT/'03_So_do/SVG'/('UI_'+item['key']+'.svg'));catalog.append({'source':name,'page':item['key'],'title':item['title'],'kind':'ui'})
    for old in E.parse(ORIGINAL/name).getroot().findall('diagram'):
        old.set('name','ARCHIVE_20261124__'+old.get('name','Page'));old.set('id','archive_'+old.get('id','page'));root.append(old)
    E.ElementTree(root).write(OUT/'03_So_do/Nguon_Drawio'/name,encoding='utf-8',xml_declaration=True)

(OUT/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2),encoding='utf-8')
readme='''# BlueMoon — Bộ tài liệu mới đồng bộ Sprint 1 và Sprint 2

Cập nhật 28/11/2026. Đây là **bản mới trên máy**, không ghi đè thư mục Bluemoon, Diagrams_Source hay file gốc trên Drive.

## Cấu trúc

- `01_Tai_lieu`: bản sao tài liệu repo mới nhất, gồm tổng hợp, backlog, kế hoạch S2, kỹ thuật, test, UI. Các đường dẫn trong bản gốc được giữ để đối chiếu repo; xem mục lục HTML để đọc trong gói độc lập.
- `02_Giao_dien`: gallery offline + 43 SVG (8 S1, 34 S2, 1 phác thảo cũ); ZIP nhập Figma. Đây chưa phải Figma native do quota MCP, chưa áp frontend.
- `03_So_do/Nguon_Drawio`: nguồn mới có các tab cập nhật đứng trước; tab gốc giữ lại với tiền tố `ARCHIVE_20261124__`.
- `03_So_do/SVG` và `PNG`: ảnh mới xuất từ các trang cập nhật; không phải ảnh cũ được đổi tên. Sơ đồ cập nhật vẫn ghi rõ chức năng S1 hiện có và S2 Planned.
- `99_Nguon_goc_Drawio`: 8 file gốc tải trực tiếp từ Drive trước khi làm, giữ byte nguyên trạng.

## Trạng thái cần hiểu đúng

Sprint 1 có chức năng và các sửa ưu tiên đã kiểm tra, còn chạy lại full suite để chốt nghiệm thu. Sprint 2 là thiết kế/kế hoạch, chưa có code tài chính. Các sơ đồ mới không biến phần planned thành implemented. 26 test hồi quy là phạm vi đã chạy, không phải full suite; số 58 trong báo cáo cũ là baseline.

S2 theo quy ước đề xuất: hộ/giá/diện tích tại đầu kỳ, không chia phí theo ngày; nợ hộ cũ giữ riêng; hóa đơn sai có revision; thu một phần, idempotency, khóa dòng, audit cùng transaction. Nhóm xác nhận quy tắc trước triển khai.

Các tab archive là bản lịch sử, không phải nguồn thiết kế hiện hành. Wireframe chuyển thành hình chữ nhật/chữ native Draw.io, icon là các vector nhỏ; prototype điều hướng nằm ở HTML, không tự trở thành prototype native Draw.io/Figma.

Mở `index.html` để xem mục lục và ảnh. Không có thao tác nào ghi dữ liệu vào ứng dụng hoặc đồng bộ lên Drive trong lần tạo bản local này.
'''
(OUT/'README.md').write_text(readme,encoding='utf-8')
links=''.join(f'<li><a href="03_So_do/SVG/{("UI_" if c["kind"]=="ui" else "")+c["page"]}.svg">{escape(c["title"])}</a> · <a href="03_So_do/Nguon_Drawio/{c["source"]}">Draw.io</a></li>' for c in catalog)
docs=''.join(f'<li><a href="01_Tai_lieu/{f.name}">{escape(f.stem)}</a></li>' for f in (OUT/'01_Tai_lieu').glob('*.md'))
(OUT/'index.html').write_text('<!doctype html><html lang="vi"><meta charset="utf-8"><title>BlueMoon — Bản cập nhật local</title><style>body{font:16px Segoe UI,sans-serif;color:#172b3a;background:#f5f7fa;max-width:1120px;margin:40px auto;padding:24px}a{color:#116a73}li{margin:10px 0}h1{color:#142d3d}section{background:white;padding:24px;border-radius:12px;margin:24px 0}</style><h1>BlueMoon · Sprint 1 + Sprint 2</h1><p>Bản mới trên máy · 28/11/2026 · Bản gốc Drive không bị sửa</p><section><h2>Giao diện</h2><a href="02_Giao_dien/index.html">Mở gallery 43 board</a></section><section><h2>Tài liệu</h2><ul>'+docs+'</ul></section><section><h2>Sơ đồ cập nhật</h2><ul>'+links+'</ul></section></html>',encoding='utf-8')
print(f'Created local bundle: {OUT}; updated pages: {len(catalog)}')
