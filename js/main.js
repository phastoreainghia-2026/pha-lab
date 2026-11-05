// Pha Lab - giao diện. Không có tên món/nguyên liệu nào trong file này: tất cả đọc từ du_lieu/*.json.
import { Ly } from "./glass.js";
import { chamDiem, tinhChiPhi, viecCanLam, doanMon, chiPhiTuDo } from "./score.js";
import { canhPhongLab, canhQuay, batParallax, matKhach } from "./lab.js";
import { tienTrinhTrong, hangTheoXp, monMoKhoa, monHomNay, capNhatSauLy, capNhatSauCa, saoTong, chuoiChiaSe, homNay, ngayDep, xuatTienTrinh, nhapTienTrinh, bangDiemCa } from "./tien_trinh.js";
import { thoiHanKhach, tamTrangKhach, chamKhach, tongKetCa, chonSuCo } from "./khach.js";
import { thongKeTrinhDuyet } from "./thong_ke.js";
import { Am } from "./am_thanh.js";
import { Giong } from "./giong.js";
import { Hieu } from "./hieu_ung.js";
import { apGia, apCuaHang, monBiAn, apCanBang } from "./gia.js";
import { ic } from "./icon.js";

const app = document.getElementById("app");
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = (n) => (Math.round(n * 10) / 10).toString().replace(".", ",");
// loại âm thanh/hiệu ứng của nguyên liệu, suy ra từ dữ liệu (dạng, nhóm, cờ nóng)
const loaiAm = (e) => e.dang === "ran" ? "ran" : e.dang === "dem" ? "dem" : e.dang === "bot" ? "bot" : e.nong ? "nong" : ["sua", "siro", "duong"].includes(e.nhom) ? "dac" : "nuoc";
const tien = (n) => n.toLocaleString("vi-VN") + "đ";

// ---------- lưu cục bộ (có thể bị chặn => luôn bọc try/catch)
const luu = {
  doc(k, mac) { try { const v = localStorage.getItem("phalab." + k); return v ? JSON.parse(v) : mac; } catch { return mac; } },
  ghi(k, v) { try { localStorage.setItem("phalab." + k, JSON.stringify(v)); } catch { /* bỏ qua */ } },
};

let DL = null;       // dữ liệu đã tải
let TT = null;       // tiến trình người chơi (lưu trong trình duyệt)
let TK = { man() {}, suKien() {} }; // thống kê ẩn danh (chỉ bật khi có mã GoatCounter)
let manHienTai = 0; // tăng mỗi lần đổi màn
const tre = (fn, ms) => { const m = manHienTai; setTimeout(() => { if (m === manHienTai) fn(); }, ms); }; // hẹn giờ, bỏ nếu đã sang màn khác
let cheDoGoc = null; // chế độ khi vào thử thách ngày (ép Thử thách, về phòng lab thì trả lại)
const luuTT = () => luu.ghi("tien_trinh", TT);
const dsMoKhoa = () => monMoKhoa(DL.mon, TT, DL.tt).filter((x) => x.mo).map((x) => x.mon);
const chuoiHienTai = () => (TT.ngay_cuoi === homNay() || TT.ngay_cuoi === homQuaMay() ? TT.chuoi : 0);
function homQuaMay() { const d = new Date(); d.setDate(d.getDate() - 1); return homNay(d); }
let cheDo = luu.doc("che_do", "tap_su");

// báo lỗi nhẹ: tiếng trầm + chữ + giọng nói
const loiNoi = (t) => { Am.loi(); Hieu.rung("loi"); toast(t); Giong.noi(t, { xep: true }); };

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("hien");
  clearTimeout(toast.h);
  toast.h = setTimeout(() => t.classList.remove("hien"), 2200);
}

function ghiLogChuaHoTro(thaoTac, idMon) {
  const log = luu.doc("log_chua_ho_tro", []);
  log.push({ thao_tac: thaoTac, mon: idMon, luc: new Date().toISOString() });
  luu.ghi("log_chua_ho_tro", log.slice(-200));
}

async function taiDuLieu() {
  const lay = async (f) => {
    const r = await fetch("du_lieu/" + f, { cache: "no-cache" });
    if (!r.ok) throw new Error(f);
    return r.json();
  };
  const [nl, tt, dc, rc, ch, cfg, kh, tp] = await Promise.all([
    lay("nguyen_lieu.json"), lay("thao_tac.json"), lay("dung_cu.json"), lay("recipes.json"),
    lay("cau_hinh_cua_hang.json"), lay("game_cau_hinh.json"), lay("che_do_khach.json"), lay("tien_trinh.json"),
  ]);
  // File tùy chỉnh (sửa từ xa bằng CMS hoặc ở trang quản trị): không có hay hỏng thì bỏ qua, game vẫn chạy bằng dữ liệu gốc
  const tuyChon = async (f) => { try { const r = await fetch("du_lieu/" + f, { cache: "no-cache" }); return r.ok ? await r.json() : {}; } catch { return {}; } };
  const [tcGia, tcCuaHang, tcMon, tcCanBang] = await Promise.all(["gia_tuy_chinh.json", "cua_hang_tuy_chinh.json", "mon_tuy_chinh.json", "can_bang_tuy_chinh.json"].map(tuyChon));
  const hien = new Set(cfg.mon_hien_thi || []);
  const an = monBiAn(rc.mon, cfg.mon_an, tcMon);
  const cb = apCanBang(kh, tp, tcCanBang);
  const [suCo, huongDan] = await Promise.all(["su_co.json", "huong_dan.json"].map(tuyChon));
  apGia(nl.nguyen_lieu, tcGia);
  return {
    thuVien: Object.fromEntries(nl.nguyen_lieu.map((x) => [x.id, x])),
    thaoTac: tt,
    dungCu: Object.fromEntries(dc.dung_cu.map((x) => [x.id, x])),
    // Chỉ hiển thị món đã duyệt (và nằm trong danh sách hiển thị của giai đoạn hiện tại)
    mon: rc.mon.filter((m) => m.trang_thai === "da_duyet" && !an.has(m.id_kho) && (hien.size === 0 || hien.has(m.id_kho))),
    cuaHang: apCuaHang(ch, tcCuaHang),
    khach: cb.khach,
    tt: cb.tienTrinh,
    suCo, huongDan,
  };
}

const tenNl = (id) => DL.thuVien[id]?.ten || id;

// ======================================================= PHÒNG LAB (dùng chung)
const ICON_AM = (tat) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2b2a33" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/>${tat ? '<path d="M17 9l5 6M22 9l-5 6"/>' : '<path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/>'}</svg>`;
function nutAm(id = "am") {
  const b = $("#" + id);
  if (!b) return;
  const cap = () => { b.innerHTML = ICON_AM(Am.dangTat()); b.setAttribute("aria-pressed", String(Am.dangTat())); };
  cap();
  b.onclick = () => { Am.datTat(!Am.dangTat()); cap(); };
}
const ICON_GIONG = (tat) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2b2a33" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-5 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/>${tat ? '<path d="M8 9l8 5M16 9l-8 5"/>' : '<path d="M8 10h8M8 13h5"/>'}</svg>`;
function nutGiong() {
  const b = $("#giong");
  if (!b) return;
  const cap = () => { b.innerHTML = ICON_GIONG(Giong.dangTat()); b.setAttribute("aria-pressed", String(Giong.dangTat())); };
  cap();
  b.onclick = () => { Giong.datTat(!Giong.dangTat()); cap(); if (!Giong.dangTat()) Giong.noi("Giọng nói đã bật"); };
}
document.addEventListener("pointerdown", () => Am.batDau());

// Cài ứng dụng: Android/Chrome có sự kiện cài đặt riêng; iPhone phải chỉ cách "Thêm vào Màn hình chính"
let yeuCauCai = null;
const daCai = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const laIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); yeuCauCai = e; capNutCai(); });
window.addEventListener("appinstalled", () => { yeuCauCai = null; capNutCai(); toast("Đã cài Pha Lab vào máy"); });
function capNutCai() {
  const b = $("#cai");
  if (b) b.hidden = daCai() || !(yeuCauCai || laIOS());
}
function chiCachCai() {
  const lop = document.createElement("div");
  lop.className = "pad";
  lop.innerHTML = `<div class="the" style="color:var(--chu);width:min(92vw,380px)"><h3>Cài Pha Lab vào iPhone</h3>
    <p>1. Mở trang này bằng <b>Safari</b>.<br>2. Bấm nút <b>Chia sẻ</b> (hình vuông có mũi tên lên).<br>3. Chọn <b>Thêm vào Màn hình chính</b>.</p>
    <div class="hang"><button id="dong-cai">Đã hiểu</button></div></div>`;
  document.body.appendChild(lop);
  $("#dong-cai", lop).onclick = () => lop.remove();
}

// Màn chào: lần chạm đầu mở khoá âm thanh của trình duyệt, đồng thời đọc lời chào (mỗi lần mở app một lần)
function chaoVao() {
  let da = false;
  try { da = sessionStorage.getItem("phalab.da_chao") === "1"; } catch { /* bỏ qua */ }
  if (da) return;
  const lop = document.createElement("div");
  lop.className = "cho-vao";
  lop.innerHTML = `<div class="hop"><div class="to">Pha Lab</div><p>Phòng đào tạo pha chế của ${DL.cuaHang.ten}</p><button id="vao">Vào phòng lab</button></div>`;
  document.body.appendChild(lop);
  $("#vao", lop).onclick = () => {
    try { sessionStorage.setItem("phalab.da_chao", "1"); } catch { /* bỏ qua */ }
    Am.batDau(); Am.ting();
    lop.remove();
    const ca = Giong.cau();
    if (ca?.chao?.length) setTimeout(() => Giong.noi(ca.chao[Math.floor(Math.random() * ca.chao.length)]), 250);
  };
}

// ======================================================= MÀN HÌNH CHỦ
function manChu() {
  manHienTai++;
  if (cheDoGoc) { cheDo = cheDoGoc; cheDoGoc = null; }
  TK.man("chu", "Phòng lab");
  const mk = monMoKhoa(DL.mon, TT, DL.tt);
  const hg = hangTheoXp(TT.xp, DL.tt), pct = hg.den ? Math.round(((TT.xp - hg.tu) / (hg.den - hg.tu)) * 100) : 100;
  const hnay = homNay(), monNgay = monHomNay(DL.mon, hnay), xongNgay = TT.hang_ngay[hnay];
  document.body.classList.add("lab");
  Am.nen(true);
  app.innerHTML = `
    <div class="lab-home">
      <div class="canh-khung">${canhPhongLab()}
        <div class="hud-tren"><button class="phu nho" id="hoso">Hồ sơ</button><span class="logo-lab"></span><button class="am" id="giong" aria-label="Bật hoặc tắt giọng nói"></button><button class="am" id="am" aria-label="Bật hoặc tắt âm thanh"></button></div>
      </div>
      <div class="quay-go">
        <button class="nut-cai" id="cai" hidden>${ic("cai")} Cài ứng dụng vào máy</button>
        <div class="ho-so-nho" id="hoso2" role="button" tabindex="0" aria-label="Mở hồ sơ">
          <div class="dong"><b>${hg.ten}</b><span>${TT.xp}${hg.den ? " / " + hg.den : ""} XP</span></div>
          <div class="xp"><i style="width:${pct}%"></i></div>
          <small>${saoTong(TT, DL.mon)}/${DL.mon.length * 3} sao · Chuỗi ${chuoiHienTai()} ngày · ${Object.keys(TT.huy_hieu).length}/${DL.tt.huy_hieu.length} huy hiệu</small>
        </div>
        <button class="nut-ngay" id="thu-thach-ngay">Thử thách hôm nay · ${ngayDep(hnay)}<small>${monNgay.ten} · chế độ Thử thách · XP x${DL.tt.xp.thu_thach_ngay_nhan}${xongNgay ? " · Đã xong " + "★".repeat(xongNgay.sao) + " " + xongNgay.diem + " điểm" : ""}</small></button>
        <div class="chon-che-do">
          <button data-cd="tap_su" class="${cheDo === "tap_su" ? "bat" : ""}">Tập sự<br><small>có gợi ý</small></button>
          <button data-cd="thu_thach" class="${cheDo === "thu_thach" ? "bat" : ""}">Thử thách<br><small>không gợi ý, chấm chặt</small></button>
        </div>
        <button class="nut-ca" id="mo-quay">Mở quầy · Khách gọi món<small>Ca ${DL.khach.so_khach} khách, có đồng hồ chờ${luu.doc("ca_cao", 0) ? " · Kỷ lục ca: " + luu.doc("ca_cao", 0) + " điểm" : ""}</small></button>
        <button class="nut-tu-do" id="tu-do">Pha tự do<small>Tự chọn nguyên liệu, game đoán đây là món nào</small></button>
        <p class="phu-tieu-lab">Chọn món để pha · ly ${DL.mon[0]?.ly.dung_tich_ml ?? ""}ml</p>
        <div class="luoi-mon">${mk.map(({ mon: m, can, mo }) => {
          const d = TT.sao[m.id_kho];
          return `<button class="mon${mo ? "" : " khoa"}" data-id="${m.id_kho}" ${mo ? "" : 'aria-disabled="true"'}><span class="ten">${m.ten}</span><span class="phu">${mo ? m.buoc.length + " bước" + (d != null ? " · " + "★".repeat(d) + "☆".repeat(3 - d) : "") : "Khóa · cần " + can + " sao"}</span></button>`;
        }).join("") || "<p>Chưa có món nào được duyệt.</p>"}</div>
        <p class="chan-lab">${/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) ? `<a href="admin.html">Quản trị</a> · ` : ""}Công thức lấy từ Kho Tri Thức của ${DL.cuaHang.ten}. Giá là chi phí nguyên liệu ước tính, không phải giá vốn thật.</p>
      </div>
    </div>`;
  nutAm(); nutGiong();
  batParallax($(".canh-khung"));
  chaoVao();
  $("#tu-do").onclick = () => { Am.ting(); Giong.noi("Pha tự do"); manPha(monTuDo(), null, { tuDo: true }); };
  $("#mo-quay").onclick = () => { $("#mo-quay").disabled = true; Am.ting(); Giong.noi("Mở quầy", { toiDa: 1500 }).then(batDauCa); };
  capNutCai();
  $("#cai").onclick = async () => {
    Am.cham();
    if (yeuCauCai) { yeuCauCai.prompt(); try { const kq = await yeuCauCai.userChoice; if (kq?.outcome === "accepted") TK.suKien("cai-ung-dung"); } catch { /* bỏ qua */ } yeuCauCai = null; capNutCai(); }
    else chiCachCai();
  };
  $("#thu-thach-ngay").onclick = () => { Am.ting(); cheDoGoc = cheDo; cheDo = "thu_thach"; manPha(monNgay, null, { daily: true }); };
  const moHoSo = () => { Am.cham(); Giong.noi("Hồ sơ của bạn"); manHoSo(); };
  $("#hoso").onclick = moHoSo;
  $("#hoso2").onclick = moHoSo;
  $("#hoso2").onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") moHoSo(); };
  app.querySelectorAll("[data-cd]").forEach((b) => b.onclick = () => { cheDo = b.dataset.cd; luu.ghi("che_do", cheDo); Am.cham(); Giong.noi(cheDo === "tap_su" ? "Chế độ Tập sự" : "Chế độ Thử thách"); manChu(); });
  app.querySelectorAll(".mon").forEach((b) => b.onclick = () => {
    const x = mk.find((y) => y.mon.id_kho == b.dataset.id);
    if (!x.mo) { Am.loi(); toast(`Món này đang khóa: cần ${x.can} sao (đang có ${saoTong(TT, DL.mon)})`); return; }
    Am.ting(); manPha(x.mon);
  });
}

// ======================================================= MÀN PHA
function manPha(mon, ck = null, opt = {}) {
  manHienTai++;
  const suCo = ck ? ck.suCo?.[ck.i] || null : null; // sự cố ngẫu nhiên của khách này
  const han = ck ? thoiHanKhach(mon, DL.khach, cheDo, suCo) : 0; // giây khách chịu chờ
  const bd = performance.now();
  const seed = ck ? ck.i * 7 + Math.floor(Math.random() * 40) : 0;
  let timerKhach = null;
  const tt = DL.thaoTac.thao_tac;
  const viec = viecCanLam(mon, DL.thaoTac);
  let events = [];
  let sel = null, cho = 0;            // nguyên liệu đang chọn + lượng đang rót (chưa cho vào ly)
  let dangGiu = null;                  // {kieu, t0, ...}

  // --- kệ nguyên liệu: nguyên liệu của món (+ vài món nhiễu ở Thử thách), xáo trộn
  const idMon = mon.nguyen_lieu.map((x) => x.nl);
  const nhieu = Object.keys(DL.thuVien).filter((i) => !idMon.includes(i)).sort(() => Math.random() - 0.5).slice(0, cheDo === "thu_thach" ? 3 : 0);
  const ke = [...idMon, ...nhieu].sort((a, b) => (cheDo === "thu_thach" ? Math.random() - 0.5 : idMon.indexOf(a) - idMon.indexOf(b) || (idMon.includes(a) ? -1 : 1)));

  // --- công cụ: thao tác hành động có trong món (+ nhiễu ở Thử thách)
  const khoaTool = (t, n) => t + (n ? ":" + n : "");
  const dsTool = [];
  const them = (t, n) => { if (!dsTool.some((x) => x.k === khoaTool(t, n))) dsTool.push({ k: khoaTool(t, n), t, n, ten: n ? "Rót " + (mon.hon_hop?.[n]?.ten || n).toLowerCase() : tt[t].ten }); };
  mon.buoc.filter((b) => tt[b.thao_tac]?.loai === "hanh_dong").forEach((b) => them(b.thao_tac, b.nhan));
  if (opt.tuDo) Object.keys(tt).filter((k) => tt[k].loai === "hanh_dong" && tt[k].ho_tro && k !== "rot_hon_hop").forEach((k) => them(k));
  else if (cheDo === "thu_thach") for (const t of ["khuay", "lac", "nem", "dam"]) if (dsTool.length < 5) them(t);
  dsTool.sort((a, b) => a.k.localeCompare(b.k));
  // nguyên liệu làm trong cốc pha (không vào ly)
  const vaoCoc = new Set(mon.buoc.filter((b) => b.vao === "coc").flatMap((b) => (b.dung || []).map((x) => x.nl)));
  const coc = [];

  document.body.classList.add("lab");
  Am.nen(true);
  const mauChai = ke.map((id) => DL.thuVien[id].mau_hien_thi);
  app.innerHTML = `
    <div class="lab-quay">
      <div class="canh-khung quay">${canhQuay(mauChai)}
        <div class="dong-rot" id="dong"></div>
        <div class="chai-rot" id="chairot"><svg viewBox="0 0 28 64" width="28" height="64" aria-hidden="true"><rect x="3" y="14" width="22" height="48" rx="6" fill="var(--mau,#ddd)" stroke="#0004"/><rect x="9" y="2" width="10" height="14" rx="2" fill="#2b2a33"/><rect x="5" y="32" width="18" height="16" rx="2" fill="#fff"/><path d="M7 38h14M7 43h10" stroke="#9aa" stroke-width="1.2"/><path d="M7 18v38" stroke="#fff" stroke-width="3" opacity=".5" stroke-linecap="round"/></svg></div>
        <div class="hoi-ly" id="hoily"><i></i><i></i><i></i></div>
        <div class="da-roi-khung" id="daroi"></div>
        <div class="khu-ly"><svg id="ly" role="img" aria-label="Ly đang pha"></svg></div>
        <div class="hud-tren"><button class="phu nho" id="ve">← Phòng lab</button><span class="tong-ml" id="tongml">0 ml</span><button class="am" id="giong" aria-label="Bật hoặc tắt giọng nói"></button><button class="am" id="am" aria-label="Bật hoặc tắt âm thanh"></button></div>
        ${ck ? `<div class="khach" id="khach"><span class="mat" id="matk">${matKhach(seed, "vui")}</span><div class="loik"><b>Khách ${ck.i + 1}/${ck.n}</b><span>Cho mình một ${mon.ten}!</span>${suCo ? `<em class="su-co" title="${esc(suCo.mo_ta)}">${esc(suCo.ten)}: ${esc(suCo.mo_ta)}</em>` : ""}<div class="han" data-mat="vui"><i id="han"></i></div><small id="hanso"></small></div></div>`
          : `<div class="ten-mon">${mon.ten} · ${cheDo === "tap_su" ? "Tập sự" : "Thử thách"}</div>`}
      </div>
      <div class="quay-go khay">
        <div class="goi-y" id="goiy"></div>
        ${vaoCoc.size ? `<div class="goi-y" id="coc" style="background:#eef7ff;border-color:#bcdcf5">${ic("coc")} Cốc pha: <span id="coctxt">trống</span></div>` : ""}
        <div class="the" id="khurot"></div>
        <div class="ke" id="ke">${ke.map((id) => `<button class="chip" data-nl="${id}"><i style="background:${DL.thuVien[id].mau_hien_thi}"></i>${DL.thuVien[id].ten}</button>`).join("")}</div>
        <div class="cong-cu" id="congcu">${dsTool.map((x) => `<button data-tt="${x.t}" data-nhan="${x.n || ""}">${x.ten}</button>`).join("")}</div>
        <div class="cuoi"><button class="phu" id="lai">↺ Làm lại ly</button><button id="xong">✓ Pha xong</button></div>
        ${cheDo === "thu_thach" && !opt.tuDo ? `<div class="the"><b>Công thức (ly ${mon.ly.dung_tich_ml}ml):</b><br>${mon.nguyen_lieu.map((x) => `${tenNl(x.nl)}: ${fmt(x.luong_toi_thieu ?? x.luong)}${x.luong_toi_thieu ? "–" + fmt(x.luong) : ""} ${x.don_vi}`).join("<br>")}</div>` : ""}
      </div>
    </div>`;
  nutAm(); nutGiong();
  batParallax($(".canh-khung"));
  TK.man("pha/" + (mon.id || "tu-do"), mon.ten);
  { const ca = Giong.cau();
    if (ck) {
      Am.chuong();
      let cuoi = Promise.resolve();
      if (ca) cuoi = Giong.noi(ca.khach_goi.replace("{mon}", mon.ten), { xep: true });
      if (ca && suCo) cuoi = Giong.noi(suCo.ten, { xep: true });
      cuoi.then(() => { if (!sanSangDoc) { sanSangDoc = true; capNhat(); } }); // đọc xong lời chào mới đọc gợi ý bước 1
    }
    else if (opt.tuDo) Giong.noi("Pha tự do");
    else if (ca) Giong.noi((opt.daily ? ca.thu_thach_ngay : ca.chon_mon).replace("{mon}", mon.ten)); }

  const ly = new Ly($("#ly"), mon.ly.dung_tich_ml);
  ly.phanTang = !!mon.buoc.some((b) => b.phan_tang);

  // ---- gợi ý bước kế tiếp (chỉ Tập sự)
  function tienDo() {
    const them = {}, hd = {};
    events.forEach((e) => { if (e.kieu === "them") them[e.nl] = (them[e.nl] || 0) + 1; else { const k = khoaTool(e.thao_tac, e.nhan); hd[k] = (hd[k] || 0) + 1; } });
    const dungHd = {}, dungNl = {};
    for (const v of viec) {
      if (v.kieu === "them") { dungNl[v.nl] = (dungNl[v.nl] || 0) + 1; if ((them[v.nl] || 0) < dungNl[v.nl]) return v; }
      else { const k = khoaTool(v.thao_tac, v.nhan); dungHd[k] = (dungHd[k] || 0) + 1; if ((hd[k] || 0) < dungHd[k]) return v; }
    }
    return null;
  }
  // đọc gợi ý bước (xếp sau câu đang đọc; bỏ qua nếu người chơi đã làm tiếp)
  let khoaDoc = null;
  let sanSangDoc = !ck; // ca khách: chờ lời chào xong mới đọc gợi ý
  const docHint = (k, t) => { if (!sanSangDoc || k === khoaDoc) return; khoaDoc = k; Giong.noi(t, { xep: true, hopLe: () => khoaDoc === k }); };
  function capNhat() {
    if ($("#coctxt")) $("#coctxt").textContent = coc.length ? coc.join(", ") : "trống";
    $("#tongml").textContent = Math.round(ly.tongMl()) + " ml";
    const goiY = $("#goiy");
    document.querySelectorAll(".sang").forEach((e) => e.classList.remove("sang"));
    if (opt.tuDo) { goiY.innerHTML = "<b>Pha tự do:</b> chọn nguyên liệu và thao tác tùy ý, xong bấm Pha xong để game đoán đây là món nào."; return; }
    if (cheDo === "tap_su") {
      const v = tienDo();
      if (!v) { goiY.innerHTML = "Đã đủ các bước. Bấm <b>Pha xong</b> để chấm điểm!"; docHint("het", "Đã đủ các bước. Bấm Pha xong để chấm điểm!"); }
      else {
        const b = mon.buoc[v.buoc];
        goiY.innerHTML = `<b>Bước ${b.thu_tu}/${mon.buoc.length}:</b> ${b.hanh_dong}`; docHint("b" + b.thu_tu, b.hanh_dong);
        if (v.kieu === "them") $(`[data-nl="${v.nl}"]`)?.classList.add("sang");
        else $(`[data-tt="${v.thao_tac}"][data-nhan="${v.nhan || ""}"]`)?.classList.add("sang");
      }
    } else goiY.innerHTML = "<b>Thử thách:</b> tự nhớ thứ tự bước. Không có gợi ý.";
  }

  // ---- khu rót
  function veKhuRot() {
    const k = $("#khurot");
    if (!sel) { k.innerHTML = `<div class="phu-tieu" style="margin:0">Chạm một nguyên liệu trên kệ để bắt đầu rót / cân</div>`; return; }
    const e = DL.thuVien[sel];
    const dem = !(e.don_vi === "ml" || e.don_vi === "g");
    k.innerHTML = `
      <div class="rot"><div><b>${e.ten}</b><div class="so"><span id="so">${fmt(cho)}</span> <small>${e.don_vi}</small></div></div>
      ${dem ? "" : `<button id="giu">Giữ để rót</button>`}</div>
      <div class="hang">${(dem ? [-1, 1] : [-5, -1, 1, 5]).map((d) => `<button class="phu nho" data-d="${d}">${d > 0 ? "+" : "−"}${Math.abs(d)}</button>`).join("")}
        <button class="phu nho" data-d="0">Bỏ</button></div>
      <div class="hang"><button id="cho">Cho vào ly</button></div>`;
    const trongLy = !vaoCoc.has(sel);
    const xem = () => { if (trongLy) ly.xemTruoc(e, cho); };
    k.querySelectorAll("[data-d]").forEach((b) => b.onclick = () => {
      const d = +b.dataset.d;
      Am.cham();
      cho = d === 0 ? 0 : Math.max(0, cho + d);
      $("#so").textContent = fmt(cho);
      xem();
    });
    $("#cho").onclick = () => {
      if (cho <= 0) { loiNoi("Chưa rót gì cả"); return; }
      Am.chiaVaoLy(loaiAm(e));
      events.push({ kieu: "them", nl: sel, luong: cho });
      if (!trongLy) { coc.push(`${e.ten.toLowerCase()} ${fmt(cho)} ${e.don_vi}`); $("#coctxt").textContent = coc.join(", "); }
      else { ly.them(e, cho); if (e.dang === "ran") daRoi(cho); if (e.nong) hoiLy(true, 2600); }
      toast(`Đã cho ${fmt(cho)} ${e.don_vi} ${e.ten.toLowerCase()}`);
      sel = null; cho = 0; hienDong(null); veKhuRot(); capNhat();
    };
    const g = $("#giu");
    if (g) {
      let h = null, t0 = 0, dungAm = null;
      const dung = () => { clearInterval(h); h = null; dungAm?.(); dungAm = null; hienDong(null); };
      g.onpointerdown = (ev) => {
        try { g.setPointerCapture(ev.pointerId); } catch { /* bỏ qua */ }
        dung();
        dungAm = Am.rot(loaiAm(e));
        t0 = performance.now();
        h = setInterval(() => {
          const s = (performance.now() - t0) / 1000;
          cho += (s < 1.5 ? 1.2 : 2.4) * 40 * 0.05; // ~48 → ~96 đơn vị/giây
          $("#so").textContent = fmt(Math.round(cho * 2) / 2);
          xem();
          if (trongLy) hienDong(e);
        }, 50);
      };
      ["pointerup", "pointercancel", "pointerleave"].forEach((n) => g.addEventListener(n, () => { if (h) { dung(); cho = Math.round(cho); $("#so").textContent = fmt(cho); xem(); } }));
    }
  }
  // dòng chất lỏng chảy từ kệ xuống mặt nước khi giữ nút rót
  function hienDong(e) {
    const d = $("#dong"), chai = $("#chairot");
    if (!d) return;
    const tat = () => { d.classList.remove("chay"); chai?.classList.remove("hien", "nghieng"); hoiLy(false); };
    if (!e || !(e.dang === "long" || e.dang === "bot")) return tat();
    const khung = $(".canh-khung.quay").getBoundingClientRect(), r = $("#ly").getBoundingClientRect();
    const cx = r.left - khung.left + r.width / 2;
    const yMat = r.top + (ly.matNuoc() / 300) * r.height - khung.top;
    const yMieng = khung.height * 0.3; // miệng chai đặt ngang tầm kệ
    // chai quay -115 độ quanh tâm: miệng lệch (-29, +13.5) so với tâm => đặt tâm lệch (+31, -13.5) để miệng nằm trên ly
    if (chai) {
      chai.style.cssText = `left:${cx + 31 - 14}px;top:${yMieng - 13.5 - 32}px;--mau:${e.mau_hien_thi}`;
      chai.classList.add("hien", "nghieng");
    }
    d.style.cssText = `left:${cx + 2}px;top:${yMieng + 4}px;height:${Math.max(8, yMat - yMieng - 4)}px;--mau:${e.mau_hien_thi}`;
    d.classList.toggle("bot", e.dang === "bot");
    d.classList.add("chay");
    hoiLy(!!e.nong);
  }
  // hơi nước bốc lên từ miệng ly khi rót nước nóng
  let hoiH = null;
  function hoiLy(bat, ms = 0) {
    const h = $("#hoily");
    if (!h) return;
    clearTimeout(hoiH);
    if (bat) {
      const khung = $(".canh-khung.quay").getBoundingClientRect(), r = $("#ly").getBoundingClientRect();
      h.style.cssText = `left:${r.left - khung.left + r.width / 2}px;top:${r.top - khung.top + (36 / 300) * r.height}px`;
      h.classList.add("bay");
      if (ms) hoiH = setTimeout(() => h.classList.remove("bay"), ms);
    } else h.classList.remove("bay");
  }
  // đá rơi vào ly rồi nảy
  function daRoi(luong) {
    const box = $("#daroi");
    if (!box || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const khung = $(".canh-khung.quay").getBoundingClientRect(), r = $("#ly").getBoundingClientRect();
    const cx = r.left - khung.left + r.width / 2, yMat = r.top + (ly.matNuoc() / 300) * r.height - khung.top;
    const yDau = khung.height * 0.12, n = Math.min(8, Math.max(3, Math.round(luong / 40)));
    for (let k = 0; k < n; k++) {
      const c = document.createElement("i");
      c.className = "da-roi";
      c.style.cssText = `left:${cx + (Math.random() - 0.5) * r.width * 0.5}px;top:${yDau}px;--dy:${Math.max(30, yMat - yDau - 8)}px;animation-delay:${k * 70}ms;--xoay:${Math.round((Math.random() - 0.5) * 120)}deg`;
      box.appendChild(c);
      setTimeout(() => c.remove(), 1200 + k * 70);
    }
  }
  veKhuRot();

  $("#ke").onclick = (ev) => {
    const b = ev.target.closest("[data-nl]");
    if (!b) return;
    sel = b.dataset.nl; cho = 0; Am.cham(); ly.xemTruoc(null); hienDong(null); Giong.noi(DL.thuVien[sel].ten);
    document.querySelectorAll("#ke .chip").forEach((c) => c.classList.toggle("chon", c === b));
    veKhuRot();
  };

  // ---- thao tác
  function giuMoi(kieuTt, nut) {
    let t0 = 0, h = null, dungAm = null, dang = false, lan = 0;
    const ten = nut.textContent;
    const hienThoi = () => (nut.textContent = `${tt[kieuTt].ten}… ${((performance.now() - t0) / 1000).toFixed(1)}s`);
    nut.onpointerdown = (ev) => {
      try { nut.setPointerCapture(ev.pointerId); } catch { /* bỏ qua */ }
      dang = true; const l = ++lan;
      // đọc tên thao tác trước, xong mới lắc/đánh và bắt đầu tính giờ
      Giong.noi(ten, { toiDa: 1500 }).then(() => {
        if (!dang || l !== lan) return;
        t0 = performance.now(); $("#ly").classList.add("lac"); h = setInterval(hienThoi, 100);
        dungAm?.(); dungAm = Am.giu(tt[kieuTt].am);
      });
    };
    const tha = () => {
      dang = false;
      if (!h) return;
      clearInterval(h); h = null; $("#ly").classList.remove("lac"); dungAm?.(); dungAm = null;
      const giay = (performance.now() - t0) / 1000;
      nut.textContent = ten;
      if (giay < 0.4) { loiNoi("Giữ nút lâu hơn nhé"); return; }
      Am.ting();
      events.push({ kieu: "hd", thao_tac: kieuTt, giay: Math.round(giay * 10) / 10 });
      if (tt[kieuTt].hoa_tron) ly.tron();
      if (tt[kieuTt].am === "danh_bot") ly.dapBot();
      toast(`${tt[kieuTt].ten} ${giay.toFixed(1)} giây`);
      capNhat();
    };
    ["pointerup", "pointercancel"].forEach((n) => nut.addEventListener(n, tha));
  }

  const coDa = () => ly.lop.some((l) => l.dang === "ran");
  function khuay(kieuTt) {
    const yeuCau = tt[kieuTt].so_vong_toi_thieu;
    const lop = document.createElement("div");
    lop.className = "pad";
    lop.innerHTML = `<h3>${tt[kieuTt].ten}: vẽ vòng tròn quanh vòng cam</h3>
      <div class="vung" id="vung"><div><div class="vong-so" id="vs">0</div>/ ${yeuCau} vòng</div></div>
      <div class="thanh-tien"><i id="tb"></i></div>
      <div class="hang" style="width:min(78vw,300px)"><button class="phu nho" id="cham">+1 vòng (chạm)</button><button id="kx">Xong</button></div>`;
    document.body.appendChild(lop);
    let vong = 0, gocTruoc = null, vongAm = 0;
    const cap = () => { $("#vs", lop).textContent = Math.floor(vong); $("#tb", lop).style.width = Math.min(100, (vong / yeuCau) * 100) + "%"; };
    const v = $("#vung", lop);
    v.onpointerdown = (e) => { v.setPointerCapture(e.pointerId); gocTruoc = null; };
    v.onpointermove = (e) => {
      if (!(e.buttons || e.pressure > 0)) return;
      const r = v.getBoundingClientRect();
      const g = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
      if (gocTruoc != null) {
        let d = g - gocTruoc;
        if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
        vong += Math.abs(d) / (2 * Math.PI);
        if (vong - vongAm >= 0.18) { vongAm = vong; Am.khuay(coDa()); }
        cap();
      }
      gocTruoc = g;
    };
    v.onpointerup = () => { gocTruoc = null; };
    $("#cham", lop).onclick = () => { vong += 1; Am.khuay(coDa()); cap(); };
    $("#kx", lop).onclick = () => {
      lop.remove();
      if (vong < 1) { loiNoi("Chưa khuấy vòng nào"); return; }
      Am.ting();
      events.push({ kieu: "hd", thao_tac: kieuTt, vong: Math.round(vong * 10) / 10 });
      if (tt[kieuTt].hoa_tron) ly.tron();
      capNhat();
    };
  }

  document.querySelectorAll("#congcu [data-tt]").forEach((nut) => {
    const k = nut.dataset.tt, d = tt[k];
    if (!d.ho_tro) { nut.onclick = () => { toast(`thao tác ${k} chưa hỗ trợ`); ghiLogChuaHoTro(k, mon.id_kho); }; return; }
    if (d.kieu === "giu") giuMoi(k, nut);
    else if (d.kieu === "vong") nut.onclick = () => { Giong.noi(nut.textContent); khuay(k); };
    else nut.onclick = () => {
      const n = nut.dataset.nhan || null;
      events.push(n ? { kieu: "hd", thao_tac: k, nhan: n } : { kieu: "hd", thao_tac: k });
      const hh = n && mon.hon_hop?.[n];
      Giong.noi(nut.textContent).then(() => Am.bam(d.am)); // nói tên trước, tiếng động sau
      if (hh) ly.them({ id: "hh_" + n, mau_hien_thi: hh.mau_hien_thi, do_trong_duc: hh.do_trong_duc, dang: "long" }, hh.ml);
      toast(hh ? `Đã rót ${hh.ten.toLowerCase()}` : `Đã ${d.ten.toLowerCase()}`); capNhat();
    };
  });

  $("#ve").onclick = () => { clearInterval(timerKhach); manChu(); };
  $("#lai").onclick = () => { Giong.noi("Làm lại ly"); events = []; coc.length = 0; ly.lamLai(); sel = null; cho = 0; veKhuRot(); capNhat(); document.querySelectorAll("#ke .chon").forEach((c) => c.classList.remove("chon")); };
  $("#xong").onclick = () => {
    if (!events.length) return toast("Chưa pha gì cả!");
    clearInterval(timerKhach);
    if (opt.tuDo) manKetQuaTuDo(events, ly); else manKetQua(mon, events, ly, ck ? { ck, giayDung: (performance.now() - bd) / 1000, han, suCo } : null, opt);
  };
  capNhat();
  if (!ck && !opt.tuDo && cheDo === "tap_su" && !TT.da_huong_dan && DL.huongDan?.buoc?.length) chayHuongDan();
  if (ck) { // đồng hồ chờ của khách: thanh co dần, mặt khách đổi theo tâm trạng, tích tắc khi sắp hết giờ
    let giayCuoi = -1, mat = "vui";
    timerKhach = setInterval(() => {
      const bar = $("#han");
      if (!bar) return clearInterval(timerKhach);
      const con = Math.max(0, han - (performance.now() - bd) / 1000), tl = con / han, gs = Math.ceil(con);
      bar.style.width = tl * 100 + "%";
      $("#hanso").textContent = `${Math.floor(gs / 60)}:${String(gs % 60).padStart(2, "0")}`;
      const m = tamTrangKhach(tl, DL.khach);
      if (m !== mat) { mat = m; $("#matk").innerHTML = matKhach(seed, m); bar.parentElement.dataset.mat = m; }
      if (con > 0 && con <= DL.khach.thoi_gian.canh_bao_giay && gs !== giayCuoi) { giayCuoi = gs; Am.tick(); }
      if (con <= 0) { clearInterval(timerKhach); khachBoDi(mon, ck); }
    }, 250);
  }
}

// ======================================================= THƯỞNG + HỒ SƠ
function thuongHtml(res) {
  const m = res.moi, d = [`<b>+${res.xpNhan} XP</b>`];
  if (res.hangNgay?.lanDau) d.push(`Hoàn thành thử thách hôm nay (XP x${DL.tt.xp.thu_thach_ngay_nhan})`);
  else if (res.hangNgay && !res.hangNgay.xong) d.push(`Cần ít nhất ${DL.tt.hang_ngay.diem_toi_thieu} điểm để tính hoàn thành thử thách`);
  if (m.hang) d.push(`Lên hạng <b>${m.hang.ten}</b>`);
  m.monMoKhoa.forEach((x) => d.push(`Mở khóa món <b>${x.ten}</b>`));
  m.huyHieu.forEach((h) => d.push(`Huy hiệu mới: <b>${h.ten}</b> (${h.mo_ta})`));
  return `<div class="the thuong${m.hang || m.monMoKhoa.length || m.huyHieu.length ? " co-moi" : ""}">${d.map((x) => `<div>${x}</div>`).join("")}</div>`;
}
function phatThuong(res) { // đọc phần thưởng sau lời đánh giá, lần lượt từng câu
  const ca = Giong.cau(), m = res.moi;
  if (!ca) return;
  if (m.hang) { Am.kaChing(); Giong.noi(ca.len_hang.replace("{hang}", m.hang.ten), { xep: true }); }
  if (res.hangNgay?.lanDau) Giong.noi("Hoàn thành thử thách hôm nay!", { xep: true });
  m.monMoKhoa.slice(0, 1).forEach((x) => Giong.noi(ca.mo_khoa_mon.replace("{mon}", x.ten), { xep: true }));
  if (m.huyHieu.length) Giong.noi("Bạn vừa nhận huy hiệu mới!", { xep: true });
}

function manHoSo() {
  manHienTai++;
  document.body.classList.remove("lab");
  Am.nen(false);
  const hg = hangTheoXp(TT.xp, DL.tt), pct = hg.den ? Math.round(((TT.xp - hg.tu) / (hg.den - hg.tu)) * 100) : 100;
  const mk = monMoKhoa(DL.mon, TT, DL.tt);
  app.innerHTML = `
    <div class="thanh"><button class="phu nho" id="ve">← Phòng lab</button><h2>Hồ sơ</h2></div>
    <div class="the diem"><div class="so" style="font-size:34px">${hg.ten}</div>
      <div class="xp lon"><i style="width:${pct}%"></i></div>
      <div>${TT.xp} XP${hg.den ? ` · còn ${hg.den - TT.xp} XP để lên ${DL.tt.hang[hg.chiSo + 1].ten}` : " · hạng cao nhất"}</div></div>
    <div class="the thong-ke">
      <div><b>${TT.ly}</b><small>ly đã pha</small></div><div><b>${saoTong(TT, DL.mon)}/${DL.mon.length * 3}</b><small>sao</small></div>
      <div><b>${chuoiHienTai()}</b><small>ngày liên tiếp</small></div><div><b>${TT.chuoi_cao}</b><small>chuỗi dài nhất</small></div>
      <div><b>${TT.tk.ca_xong}</b><small>ca đã chơi</small></div><div><b>${luu.doc("ca_cao", 0)}</b><small>kỷ lục ca</small></div></div>
    <div class="the"><p class="phu-tieu">Thực đơn</p>
      ${mk.map(({ mon: m, can, mo }) => `<div class="buoc ${mo ? "ok" : ""}"><div class="dau" style="color:${mo ? "var(--chu)" : "var(--phu)"}">${m.ten}</div>
        <div class="li" style="color:var(--phu)">${mo ? "★".repeat(TT.sao[m.id_kho] || 0) + "☆".repeat(3 - (TT.sao[m.id_kho] || 0)) : "Khóa · cần " + can + " sao"}</div></div>`).join("")}</div>
    <div class="the"><p class="phu-tieu">Huy hiệu (${Object.keys(TT.huy_hieu).length}/${DL.tt.huy_hieu.length})</p>
      <div class="luoi-hh">${DL.tt.huy_hieu.map((h) => { const ngay = TT.huy_hieu[h.id];
        return `<div class="hh ${ngay ? "co" : ""}"><b>${ngay ? h.ten : "???"}</b><small>${h.mo_ta}</small>${ngay ? `<em>${ngayDep(ngay)}</em>` : ""}</div>`; }).join("")}</div></div>
    <div class="the"><p class="phu-tieu">Bảng điểm trên máy này</p>
      ${bangDiemCa(TT).length ? `<div class="phu-tieu" style="text-transform:none;margin:0 0 4px">Ca Khách gọi món, cao nhất:</div>${bangDiemCa(TT).map((x, i) => `<div class="buoc"><div class="dau" style="font-weight:600">${i + 1}. ${x.diem} điểm <span style="font-weight:500;color:var(--phu)">· ${"★".repeat(x.hang)}${"☆".repeat(3 - x.hang)} · ${ngayDep(x.ngay)}</span></div></div>`).join("")}` : '<div style="color:var(--phu)">Chưa chơi ca Khách gọi món nào.</div>'}
      ${Object.keys(luu.doc("diem_cao", {})).length ? `<div class="phu-tieu" style="text-transform:none;margin:8px 0 4px">Điểm cao từng món:</div>${DL.mon.filter((m) => luu.doc("diem_cao", {})[m.id_kho] != null).map((m) => `<div class="buoc"><div class="dau" style="font-weight:600">${esc(m.ten)} <span style="font-weight:500;color:var(--phu)">· ${luu.doc("diem_cao", {})[m.id_kho]} điểm</span></div></div>`).join("")}` : ""}
    </div>
    <div class="the"><p class="phu-tieu">Sao lưu tiến trình</p>
      <p style="margin:0 0 8px;color:var(--phu);font-size:14px">Chép mã này để lưu, hoặc dán sang máy khác rồi bấm Khôi phục. Tiến trình hiện chỉ lưu trong trình duyệt của máy này.</p>
      <textarea id="ma-sao-luu" rows="3" placeholder="Mã sao lưu hiện ở đây, hoặc dán mã vào để khôi phục"></textarea>
      <div class="hang"><button class="nho" id="xuat-ma">Tạo và chép mã</button><button class="phu nho" id="nhap-ma">Khôi phục từ mã</button></div>
      <div class="hang"><button class="phu nho" id="xem-lai-hd">Xem lại hướng dẫn mở đầu</button></div>
    </div>
    <p class="chan-lab" style="color:var(--phu)">Tiến trình lưu trong trình duyệt của máy này.</p>`;
  $("#ve").onclick = manChu;
  $("#xuat-ma").onclick = async () => {
    const ma = xuatTienTrinh({ tt: TT, diem_cao: luu.doc("diem_cao", {}), ca_cao: luu.doc("ca_cao", 0) });
    $("#ma-sao-luu").value = ma;
    try { await navigator.clipboard.writeText(ma); toast("Đã chép mã sao lưu"); } catch { $("#ma-sao-luu").select(); toast("Chọn mã rồi chép thủ công nhé"); }
  };
  let cho = false;
  $("#nhap-ma").onclick = () => {
    const kq = nhapTienTrinh($("#ma-sao-luu").value);
    if (!kq.ok) { cho = false; $("#nhap-ma").textContent = "Khôi phục từ mã"; Am.loi(); return toast(kq.loi); }
    if (!cho) { cho = true; $("#nhap-ma").textContent = "Bấm lần nữa để ghi đè"; return toast(`Mã hợp lệ: ${kq.goi.tt.xp} XP, ${kq.goi.tt.ly} ly. Bấm lần nữa để thay tiến trình hiện tại.`); }
    TT = kq.goi.tt; luuTT(); luu.ghi("diem_cao", kq.goi.diem_cao); luu.ghi("ca_cao", kq.goi.ca_cao);
    Am.ting(); toast("Đã khôi phục tiến trình"); manHoSo();
  };
  $("#xem-lai-hd").onclick = () => { TT.da_huong_dan = false; luuTT(); toast("Hướng dẫn sẽ hiện ở ván Tập sự kế tiếp"); };
}

// ======================================================= PHA TỰ DO
// Ly "giả" không có công thức: kệ có mọi nguyên liệu, mọi thao tác; chấm bằng cách so với từng món thật.
function monTuDo() {
  const nl = Object.values(DL.thuVien).sort((a, b) => a.nhom.localeCompare(b.nhom) || a.ten.localeCompare(b.ten, "vi")).map((e) => ({ nl: e.id, luong: 0, don_vi: e.don_vi }));
  return { id: "tu-do", id_kho: 0, ten: "Pha tự do", ly: { dung_tich_ml: DL.mon[0]?.ly.dung_tich_ml || 500 }, nguyen_lieu: nl, buoc: [], dung_cu: [] };
}

function manKetQuaTuDo(events, ly) {
  manHienTai++;
  document.body.classList.remove("lab");
  Am.nen(false);
  const d = doanMon(DL.mon, events, DL.thaoTac, tenNl);
  const cp = chiPhiTuDo(events, DL.thuVien);
  const r = d.mon && d.muc !== "moi" ? chamDiem(d.mon, events, DL.thaoTac, "tap_su", tenNl) : null;
  const ca = Giong.cau();
  const tieuDe = d.muc === "chuan" ? `Chuẩn món ${d.mon.ten}!` : d.muc === "giong" ? `Giống món ${d.mon.ten}` : "Một ly hoàn toàn mới";
  Am.ketQua(d.muc === "chuan" ? 3 : d.muc === "giong" ? 2 : 1);
  if (ca) tre(() => Giong.noi((d.muc === "chuan" ? ca.tu_do_chuan : d.muc === "giong" ? ca.tu_do_giong : ca.tu_do_moi).replace("{mon}", d.mon?.ten || "")), 900);
  if (d.muc === "chuan") Hieu.chayThuong({ baSao: true });
  TK.suKien(`pha-tu-do/${d.muc}/${d.mon?.id || "khong"}`);
  const thieu = r ? r.chi_tiet.filter((c) => !c.ok) : [];
  app.innerHTML = `
    <div class="thanh"><h2>Pha tự do</h2></div>
    <div class="the diem"><div class="so" style="font-size:30px;line-height:1.2">${esc(tieuDe)}</div>
      <div>${d.muc === "moi" ? "Không giống món nào trong thực đơn (cao nhất " + d.tong + " điểm giống). Biết đâu thành món mới!" : "Độ giống công thức: <b>" + d.tong + "</b>/100"}</div></div>
    ${r && thieu.length ? `<div class="the"><p class="phu-tieu">Muốn đúng chuẩn ${esc(d.mon.ten)} thì cần</p>${thieu.map((c) => `<div class="buoc loi"><div class="dau" style="font-weight:600">Bước ${c.thu_tu}: ${esc(c.hanh_dong)}</div>${c.loi.map((l) => `<div class="li">• ${esc(l)}</div>`).join("")}</div>`).join("")}</div>` : ""}
    <div class="the"><p class="phu-tieu">Gần giống nhất</p>${d.xep.map((x) => `<div class="buoc"><div class="dau">${esc(x.mon.ten)}</div><div class="li" style="color:var(--phu)">giống ${x.tong}/100</div></div>`).join("")}</div>
    <div class="the"><p class="phu-tieu">Chi phí nguyên liệu ước tính của ly này</p><p class="tong-gia">${cp.chuaGia ? "Đã có giá: " + tien(cp.tien) : tien(cp.tien)}</p>
      ${cp.chuaGia ? `<p class="chua-gia">Còn ${cp.chuaGia} nguyên liệu chưa có giá nên chưa tính tổng.</p>` : ""}</div>
    <div class="cuoi"><button class="phu" id="chu">Về phòng lab</button><button id="lai">Pha ly khác</button></div>`;
  $("#chu").onclick = manChu;
  $("#lai").onclick = () => manPha(monTuDo(), null, { tuDo: true });
}

// ======================================================= HƯỚNG DẪN MỞ ĐẦU (ván Tập sự đầu tiên)
function chayHuongDan() {
  const buoc = DL.huongDan.buoc;
  let i = 0, cu = null;
  const lop = document.createElement("div");
  lop.className = "hd-lop";
  lop.innerHTML = `<div class="hd-the" role="dialog" aria-label="Hướng dẫn"><small id="hd-so"></small><b id="hd-td"></b><p id="hd-nd"></p>
    <div class="hang"><button class="phu nho" id="hd-bo">Bỏ qua</button><button class="nho" id="hd-tiep">Tiếp</button></div></div>`;
  document.body.appendChild(lop);
  const chon = () => {
    cu?.classList.remove("hd-sang");
    const b = buoc[i];
    cu = $(b.chon);
    cu?.classList.add("hd-sang");
    cu?.scrollIntoView({ block: "center", behavior: "smooth" });
    $("#hd-td", lop).textContent = b.tieu_de;
    $("#hd-nd", lop).textContent = b.noi;
    $("#hd-so", lop).textContent = `Bước ${i + 1}/${buoc.length}`;
    $("#hd-tiep", lop).textContent = i === buoc.length - 1 ? "Bắt đầu pha" : "Tiếp";
    Giong.noi(b.noi);
  };
  const dong = (xong) => {
    cu?.classList.remove("hd-sang");
    lop.remove();
    Giong.dung();
    TT.da_huong_dan = true; luuTT();
    TK.suKien("huong-dan/" + (xong ? "xong" : "bo-qua"));
  };
  $("#hd-tiep", lop).onclick = () => { Am.cham(); if (i >= buoc.length - 1) return dong(true); i++; chon(); };
  $("#hd-bo", lop).onclick = () => dong(false);
  chon();
}

// ======================================================= CHẾ ĐỘ KHÁCH GỌI MÓN
function batDauCa() {
  const n = DL.khach.so_khach, bo = [];
  const mo = dsMoKhoa();
  while (bo.length < n) bo.push(...[...mo].sort(() => Math.random() - 0.5));
  const don = bo.slice(0, n);
  khachKe({ n, i: 0, don, kq: [], combo: 0, suCo: don.map((_, i) => chonSuCo(DL.suCo, i)) });
}
function khachKe(ck) { if (ck.i >= ck.n) manKetCa(ck); else manPha(ck.don[ck.i], ck); }
function ghiKhach(ck, mon, kk) { ck.kq.push({ mon: mon.ten, suCo: ck.suCo?.[ck.i]?.ten || null, ...kk }); ck.combo = kk.combo; ck.i++; }
const SAO = (n) => "★".repeat(n) + "☆".repeat(3 - n);
const TOC = { nhanh: "Nhanh", vua: "Vừa", cham: "Chậm", bo_di: "Bỏ đi" };

function khachBoDi(mon, ck) {
  manHienTai++;
  ghiKhach(ck, mon, { sao: 0, saoToc: 0, toc: "bo_di", diem: 0, combo: 0, boDi: true });
  document.body.classList.remove("lab");
  Am.nen(false); Am.khachBoDi(); Hieu.chayThuong({ boDi: true }); TK.suKien("khach/bo-di/" + mon.id);
  const ca = Giong.cau(); if (ca) tre(() => Giong.noi(ca.khach_bo_di), 400);
  app.innerHTML = `
    <div class="thanh"><h2>${mon.ten}</h2></div>
    <div class="the diem"><div class="mat-lon">${matKhach(ck.i * 7, "gian")}</div><div class="so" style="font-size:40px">Khách bỏ đi</div>
      <div>Chờ quá ${thoiHanKhach(mon, DL.khach, cheDo, ck.suCo?.[ck.i - 1])} giây nên khách rời quầy. Lần sau pha gọn và nhanh hơn nhé.</div></div>
    <div class="cuoi"><button id="tiep">${ck.i >= ck.n ? "Xem tổng kết ca" : "Khách tiếp theo"}</button></div>`;
  $("#tiep").onclick = () => khachKe(ck);
}

function manKetCa(ck) {
  manHienTai++;
  const t = tongKetCa(ck.kq, DL.khach);
  const res = capNhatSauCa(TT, t, DL.mon, DL.tt, homNay()); TT = res.tt; luuTT();
  tre(() => phatThuong(res), 1500);
  Hieu.chayThuong({ baSao: t.hang === 3, hang: !!res.moi.hang, moi: !!(res.moi.monMoKhoa.length || res.moi.huyHieu.length) });
  TK.suKien("ca/xong/" + t.hang);
  const cao = luu.doc("ca_cao", 0), kyLuc = t.diem > cao;
  if (kyLuc) luu.ghi("ca_cao", t.diem);
  document.body.classList.remove("lab");
  Am.nen(false); Am.ketQua(t.hang); if (t.hang === 3) tre(() => Am.kaChing(), 500);
  const ca = Giong.cau(); if (ca) tre(() => Giong.noi(ca.ket_ca[t.hang]), 900);
  app.innerHTML = `
    <div class="thanh"><h2>Tổng kết ca</h2></div>
    <div class="the diem"><div class="sao">${SAO(t.hang)}</div><div class="so">${t.diem}</div>
      <div>điểm · ${t.sao}/${t.toiDa} sao${t.boDi ? " · " + t.boDi + " khách bỏ đi" : ""}${kyLuc ? ` · ${ic("cup")} Kỷ lục ca mới` : ""}</div></div>
    ${thuongHtml(res)}
    <div class="the"><p class="phu-tieu">Từng khách</p>
      ${ck.kq.map((k, i) => `<div class="buoc ${k.sao >= 2 ? "ok" : "loi"}"><div class="dau">Khách ${i + 1}: <span style="font-weight:500">${k.mon}</span>${k.suCo ? ` · <em class="su-co">${esc(k.suCo)}</em>` : ""}</div>
        <div class="li" style="color:var(--chu)">${SAO(k.sao)} · ${TOC[k.toc] || ""} · +${k.diem} điểm${k.combo > 1 ? " · combo x" + k.combo : ""}</div></div>`).join("")}</div>
    <div class="cuoi"><button class="phu" id="chu">Về phòng lab</button><button id="moi">Chơi ca mới</button></div>`;
  $("#chu").onclick = manChu;
  $("#moi").onclick = () => { Am.ting(); batDauCa(); };
}

// ======================================================= MÀN KẾT QUẢ
function manKetQua(mon, events, ly, kh = null, opt = {}) {
  manHienTai++;
  const svgChuoi = new XMLSerializer().serializeToString(ly.svg);
  document.body.classList.remove("lab");
  Am.nen(false);
  const r = chamDiem(mon, events, DL.thaoTac, cheDo, tenNl, kh?.suCo?.sai_so_he_so ?? 1);
  let kk = null; // kết quả theo khách (chỉ ở chế độ Khách gọi món)
  if (kh) { kk = chamKhach({ saoDo: r.sao, tong: r.tong, giayDung: kh.giayDung, han: kh.han }, DL.khach, kh.ck.combo, kh.suCo); ghiKhach(kh.ck, mon, kk); }
  if (kk) {
    Am.ketQua(kk.sao); if (kk.sao === 3) tre(() => Am.kaChing(), 500);
    tre(() => { const ca = Giong.cau(); if (ca) Giong.noi(ca.khach_ket_qua[kk.sao]); }, 900);
  } else {
    Am.ketQua(r.sao);
    tre(() => { const ca = Giong.cau(); if (ca) Giong.noi(ca.ket_qua[r.sao]); }, 900);
  }
  TK.suKien(`ly/xong/${mon.id}/${kk ? kk.sao : r.sao}`);
  const res = capNhatSauLy(TT, { mon, r, cheDo, kk, daily: !!opt.daily, ngay: homNay() }, DL.mon, DL.tt);
  TT = res.tt; luuTT();
  tre(() => phatThuong(res), 1500);
  Hieu.chayThuong({ baSao: (kk ? kk.sao : r.sao) === 3, hang: !!res.moi.hang, moi: !!(res.moi.monMoKhoa.length || res.moi.huyHieu.length || res.hangNgay?.lanDau) });
  const cp = tinhChiPhi(mon, DL.thuVien);
  const diem = luu.doc("diem_cao", {});
  const ky = mon.id_kho;
  const moiKyLuc = (diem[ky] ?? -1) < r.tong;
  if (moiKyLuc) { diem[ky] = r.tong; luu.ghi("diem_cao", diem); }

  const heSo = DL.cuaHang.he_so_gia_ban_goi_y;
  const giaBan = cp.day_du && heSo ? Math.round((cp.tong_da_co_gia * heSo) / 1000) * 1000 : null;

  app.innerHTML = `
    <div class="thanh"><h2>${mon.ten}</h2><span class="chip" style="padding:4px 10px">${ic(cheDo === "tap_su" ? "mam" : "lua", 15)} ${cheDo === "tap_su" ? "Tập sự" : "Thử thách"}</span></div>
    ${kk ? `<div class="the khach-kq"><div class="mat-lon">${matKhach(kh.ck.i * 7, kk.sao >= 2 ? "vui" : kk.sao === 1 ? "binh_thuong" : "gian")}</div>
      <div><b>${["Khách không hài lòng", "Khách tạm hài lòng", "Khách hài lòng", "Khách rất hài lòng"][kk.sao]}</b><br>${SAO(kk.sao)} · Giao ${Math.round(kh.giayDung)}/${kh.han} giây (${TOC[kk.toc]}) · <b>+${kk.diem} điểm</b>${kk.combo > 1 ? " · Combo x" + kk.combo : ""}${kh.suCo ? `<br><em class="su-co">${esc(kh.suCo.ten)}: ${esc(kh.suCo.mo_ta)}</em>` : ""}</div></div>` : ""}
    <div class="the diem"><div class="sao">${"★".repeat(r.sao)}${"☆".repeat(3 - r.sao)}</div><div class="so">${r.tong}</div>
      <div>${r.tong >= 90 ? "Chuẩn bartender!" : r.tong >= 70 ? "Khá lắm, gần chuẩn rồi" : r.tong >= 40 ? "Cần luyện thêm" : "Thử lại nhé, ai cũng từng vậy"}${moiKyLuc ? ` · ${ic("cup")} Kỷ lục mới` : ""}</div></div>
    ${thuongHtml(res)}
    <div class="the"><p class="phu-tieu">Từng bước</p>
      ${r.chi_tiet.map((c) => `<div class="buoc ${c.ok ? "ok" : "loi"}"><div class="dau">${c.ok ? "✓" : "✗"} Bước ${c.thu_tu}: <span style="font-weight:500">${c.hanh_dong}</span></div>
        ${c.loi.map((l) => `<div class="li">• ${l}</div>`).join("")}
        ${c.meo ? `<div class="meo">${ic("den", 16)} Lời khuyên người pha chế: ${c.meo}</div>` : ""}</div>`).join("")}
      ${r.thua.length ? `<div class="buoc loi"><div class="dau">✗ Dùng nhầm nguyên liệu</div><div class="li">• ${r.thua.join(", ")} không có trong công thức.</div></div>` : ""}
    </div>
    <div class="the"><p class="phu-tieu">Chi phí nguyên liệu ước tính / ly</p>
      <table class="gia">${cp.dong.map((d) => `<tr><td>${d.ten} <small>${fmt(d.luong)} ${d.don_vi}</small></td><td>${d.tien == null ? '<span class="chua-gia">chưa có giá</span>' : d.tien === 0 ? '<span class="chua-gia">miễn phí</span>' : tien(d.tien)}</td></tr>`).join("")}</table>
      <p class="tong-gia">${cp.day_du ? "Tổng: " + tien(cp.tong_da_co_gia) : "Nguyên liệu đã có giá: " + tien(cp.tong_da_co_gia)}</p>
      ${cp.day_du ? (giaBan ? `<p>Giá bán gợi ý: <b>${tien(giaBan)}</b></p>` : "") : `<p class="chua-gia">Còn ${cp.chua_co_gia} nguyên liệu chưa có giá nên chưa tính tổng và giá bán gợi ý.</p>`}
      <p class="phu-tieu" style="text-transform:none;margin-top:8px">Dựa trên giá bán (sau thuế) tại ${DL.cuaHang.ten}, mã hàng chọn tạm. Chỉ là ước tính.</p>
    </div>
    ${kk ? `<div class="cuoi"><button id="tiep">${kh.ck.i >= kh.ck.n ? "Xem tổng kết ca" : "Khách tiếp theo"}</button></div>` : `<div class="cuoi"><button class="phu" id="chu">Chọn món khác</button><button id="lai">Pha lại</button></div>`}
    ${opt.daily ? `<div class="cuoi"><button class="phu" id="chep">Chép kết quả để khoe</button></div>` : ""}
    ${DL.cuaHang.uu_dai ? `<div class="the uu-dai">${ic("gio")} <b>Ưu đãi:</b> ${esc(DL.cuaHang.uu_dai)}</div>` : ""}
    <div class="cuoi"><button id="dat" style="background:var(--ok)">${ic("gio")} Đặt giỏ nguyên liệu</button><button id="anh" class="phu">${ic("anh")} Ảnh chia sẻ</button></div>`;
  if (kk) $("#tiep").onclick = () => { Giong.noi(kh.ck.i >= kh.ck.n ? "Tổng kết ca" : "Khách tiếp theo"); khachKe(kh.ck); };
  else { $("#chu").onclick = manChu; $("#lai").onclick = () => manPha(mon, null, opt); }
  if (res.hangNgay?.lanDau) TK.suKien("thu-thach-ngay/xong");
  if (opt.daily) $("#chep").onclick = async () => {
    const tx = chuoiChiaSe({ ngay: homNay(), mon: mon.ten, sao: r.sao, diem: r.tong, chuoi: chuoiHienTai(), tenCuaHang: DL.cuaHang.ten, facebook: DL.cuaHang.facebook });
    try { await navigator.clipboard.writeText(tx); toast("Đã chép kết quả, dán vào Zalo hay Facebook nhé"); } catch { toast("Không chép được, thử lại nhé"); }
  };
  $("#dat").onclick = () => datHang(mon);
  $("#anh").onclick = async () => {
    try {
      const { taoAnhChiaSe, luuHoacChiaSe } = await import("./share.js"); // chỉ tải khi cần
      const blob = await taoAnhChiaSe({ cuaHang: DL.cuaHang, tenMon: mon.ten, diem: r.tong, sao: r.sao, cheDo, svgChuoi,
        tongTien: cp.day_du ? cp.tong_da_co_gia : null, uuDai: DL.cuaHang.uu_dai || "", mauChuDao: DL.cuaHang.mau_chu_dao || "#ff7a3d" });
      TK.suKien("chia-se/" + mon.id);
      const kq = await luuHoacChiaSe(blob, "pha-lab-" + mon.id_kho + ".png");
      toast(kq === "tai_ve" ? "Đã tải ảnh về máy" : "Đã mở chia sẻ");
    } catch { toast("Không tạo được ảnh, thử lại nhé"); }
  };
}

function datHang(mon) {
  TK.suKien("dat-hang/" + mon.id);
  const dong = mon.nguyen_lieu.map((x) => DL.thuVien[x.nl]).filter((e) => e.sku && !e.mien_phi)
    .map((e) => `- ${e.sku.ten} (mã ${e.sku.ma}) - số lượng: ...`);
  const tin = `Chào ${DL.cuaHang.ten}, mình muốn đặt nguyên liệu pha "${mon.ten}":\n${dong.join("\n")}${DL.cuaHang.uu_dai ? "\nƯu đãi: " + DL.cuaHang.uu_dai : ""}\nNhờ shop báo giá và còn hàng giúp mình nhé.`;
  const zalo = (DL.cuaHang.zalo_so_dien_thoai || "").replace(/[^\d]/g, "");
  const mess = DL.cuaHang.messenger_link || "";
  const lop = document.createElement("div");
  lop.className = "pad";
  lop.innerHTML = `<div class="the" style="color:var(--chu);width:min(92vw,460px);max-height:88vh;overflow:auto">
    <h3>Đặt giỏ nguyên liệu</h3>
    <p class="phu-tieu" style="text-transform:none">Tin nhắn soạn sẵn (nhớ điền số lượng):</p>
    <textarea id="tin" rows="${Math.min(10, dong.length + 4)}" style="width:100%;font:inherit;padding:8px;border:1px solid var(--vien);border-radius:10px">${tin.replace(/</g, "&lt;")}</textarea>
    <div class="hang"><button id="chep">Chép tin nhắn</button></div>
    <div class="hang">
      ${zalo ? `<button id="mz" style="background:#0068ff">Mở Zalo</button>` : ""}
      ${mess ? `<button id="mm" style="background:#0084ff">Mở Messenger</button>` : ""}
      ${DL.cuaHang.facebook ? `<button id="mf" class="phu">Trang Facebook</button>` : ""}
    </div>
    ${zalo || mess ? "" : `<p class="chua-gia">Shop chưa điền số Zalo/Messenger. Chép tin nhắn rồi gửi qua trang Facebook của shop.</p>`}
    <div class="hang"><button class="phu" id="dong">Đóng</button></div></div>`;
  document.body.appendChild(lop);
  const lay = () => $("#tin", lop).value;
  const chep = async () => { try { await navigator.clipboard.writeText(lay()); toast("Đã chép tin nhắn"); return true; } catch { $("#tin", lop).select(); toast("Chép thủ công: giữ vào khung tin nhắn rồi chọn Sao chép"); return false; } };
  $("#chep", lop).onclick = chep;
  const mo = (url) => async () => { await chep(); window.open(url, "_blank", "noopener"); };
  if (zalo) $("#mz", lop).onclick = mo("https://zalo.me/" + zalo);
  if (mess) $("#mm", lop).onclick = mo(mess);
  if (DL.cuaHang.facebook) $("#mf", lop).onclick = mo(DL.cuaHang.facebook);
  $("#dong", lop).onclick = () => lop.remove();
}

// ======================================================= KHỞI ĐỘNG
// Service worker (chạy offline): bật trên web thật; trên máy dev (localhost) chỉ bật khi thêm ?sw=1 để khỏi gặp bản cũ lúc sửa code.
if ("serviceWorker" in navigator) {
  const dev = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  if (!dev || location.search.includes("sw=1")) navigator.serviceWorker.register("sw.js").catch(() => {});
  else navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((x) => x.unregister())).catch(() => {});
}
(async () => {
  try {
    DL = await taiDuLieu();
    await Giong.nap();
    TK = thongKeTrinhDuyet(DL.cuaHang.goatcounter_ma || "");
    { const goc = tienTrinhTrong(), cu = luu.doc("tien_trinh", null) || {}; TT = { ...goc, ...cu, tk: { ...goc.tk, ...(cu.tk || {}) } }; }
    if (DL.cuaHang.mau_chu_dao) document.documentElement.style.setProperty("--chu-dao", DL.cuaHang.mau_chu_dao);
    manChu();
  } catch (e) {
    app.innerHTML = `<div class="loi-tai"><h2>Không tải được dữ liệu game</h2>
      <p>Chưa đọc được file <b>${e.message}</b>.</p>
      <p>Nếu bạn mở file index.html trực tiếp thì sẽ lỗi. Hãy chạy file <b>chay.bat</b> (hoặc gõ <code>npm run dev</code>), rồi mở địa chỉ http://localhost:5173.</p>
      <p>Nếu vẫn lỗi, chạy <code>python tao_du_lieu_game.py</code> để sinh lại dữ liệu.</p></div>`;
  }
})();
