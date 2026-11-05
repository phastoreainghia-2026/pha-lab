// Tiến trình người chơi: mở khóa món, hạng/XP, chuỗi ngày, huy hiệu, thử thách hằng ngày.
// Hàm thuần (không đụng DOM/localStorage) nên kiểm thử được bằng Node. Số liệu: du_lieu/tien_trinh.json.

const hai = (n) => String(n).padStart(2, "0");
export const homNay = (d = new Date()) => `${d.getFullYear()}-${hai(d.getMonth() + 1)}-${hai(d.getDate())}`;
const homQua = (ngay) => { const [y, m, d] = ngay.split("-").map(Number); return homNay(new Date(y, m - 1, d - 1)); };
export const ngayDep = (ngay) => { const [, m, d] = ngay.split("-"); return `${d}/${m}`; };

export const tienTrinhTrong = () => ({
  xp: 0, sao: {}, ly: 0, da_huong_dan: false, ca_lich_su: [], ngay_cuoi: null, chuoi: 0, chuoi_cao: 0, huy_hieu: {}, hang_ngay: {},
  tk: { hoan_hao: 0, thu_thach_3sao: 0, ca_xong: 0, ca_hang3: 0, ca_khong_bo_di: 0, combo: 0, nhanh_3sao: 0, hang_ngay: 0 },
});

/** Hạng hiện tại theo XP: {chiSo, ten, tu, den} (den = null nếu đã cao nhất). */
export function hangTheoXp(xp, cfg) {
  let h = 0;
  cfg.hang.forEach((x, i) => { if (xp >= x.xp) h = i; });
  return { chiSo: h, ten: cfg.hang[h].ten, tu: cfg.hang[h].xp, den: cfg.hang[h + 1]?.xp ?? null };
}

export const saoTong = (tt, dsMon) => dsMon.reduce((s, m) => s + (tt.sao[m.id_kho] || 0), 0);

/** Mỗi món: {mon, can (số sao tổng cần), mo}. Món dễ (ít bước) mở trước; vài món đầu mở sẵn. */
export function monMoKhoa(dsMon, tt, cfg) {
  const xep = [...dsMon].sort((a, b) => a.buoc.length - b.buoc.length || a.id_kho - b.id_kho);
  const st = saoTong(tt, dsMon);
  return xep.map((m, k) => {
    const can = k < cfg.so_mon_ban_dau ? 0 : cfg.sao_moi_mon * (k - cfg.so_mon_ban_dau + 1);
    return { mon: m, can, mo: st >= can };
  });
}

/** Món của thử thách hôm nay: chọn theo ngày, ai chơi cũng cùng một món (kể cả món chưa mở khóa). */
export function monHomNay(dsMon, ngay) {
  const xep = [...dsMon].sort((a, b) => a.id_kho - b.id_kho);
  let h = 7;
  for (const c of ngay) h = (h * 31 + c.charCodeAt(0)) % 100003;
  return xep[h % xep.length];
}

function chamNgay(tt, ngay) {
  if (tt.ngay_cuoi === ngay) return;
  tt.chuoi = tt.ngay_cuoi === homQua(ngay) ? tt.chuoi + 1 : 1;
  tt.ngay_cuoi = ngay;
  tt.chuoi_cao = Math.max(tt.chuoi_cao, tt.chuoi);
}

function duocHuyHieu(h, tt, dsMon, cfg) {
  const ba = dsMon.filter((m) => (tt.sao[m.id_kho] || 0) >= 3).length;
  switch (h.loai) {
    case "so_ly": return tt.ly >= h.so;
    case "mon_ba_sao": return ba >= h.so;
    case "mon_ba_sao_het": return dsMon.length > 0 && ba === dsMon.length;
    case "mo_het_mon": return monMoKhoa(dsMon, tt, cfg).every((x) => x.mo);
    case "chuoi_ngay": return tt.chuoi_cao >= h.so;
    case "combo": return tt.tk.combo >= h.so;
    default: return (tt.tk[h.loai] || 0) >= h.so; // hoan_hao, thu_thach_3sao, ca_xong, ca_hang3, ca_khong_bo_di, nhanh_3sao, hang_ngay
  }
}

/** So sánh trước/sau để biết cái gì vừa mở. */
function thuong(truoc, sau, dsMon, cfg, ngay) {
  const moi = { huyHieu: [], monMoKhoa: [], hang: null };
  for (const h of cfg.huy_hieu) {
    if (!sau.huy_hieu[h.id] && duocHuyHieu(h, sau, dsMon, cfg)) { sau.huy_hieu[h.id] = ngay; moi.huyHieu.push(h); }
  }
  const mk = (t) => new Set(monMoKhoa(dsMon, t, cfg).filter((x) => x.mo).map((x) => x.mon.id_kho));
  const a = mk(truoc), b = mk(sau);
  moi.monMoKhoa = dsMon.filter((m) => b.has(m.id_kho) && !a.has(m.id_kho));
  const h0 = hangTheoXp(truoc.xp, cfg), h1 = hangTheoXp(sau.xp, cfg);
  if (h1.chiSo > h0.chiSo) moi.hang = h1;
  return moi;
}

/**
 * Cập nhật sau mỗi ly.
 * ctx = {mon, r (kết quả chamDiem), cheDo, kk (kết quả khách hoặc null), daily (bool), ngay}
 * @returns {tt, xpNhan, moi:{huyHieu, monMoKhoa, hang}, hangNgay:{xong, lanDau}|null}
 */
export function capNhatSauLy(tt0, ctx, dsMon, cfg) {
  const tt = JSON.parse(JSON.stringify(tt0));
  const { mon, r, cheDo, kk, daily, ngay } = ctx;
  chamNgay(tt, ngay);
  tt.ly++;
  let xp = Math.round(r.tong / cfg.xp.moi_ly_diem_chia) + r.sao * cfg.xp.moi_sao;
  tt.sao[mon.id_kho] = Math.max(tt.sao[mon.id_kho] || 0, r.sao, kk ? kk.sao : 0);
  if (r.tong === 100) tt.tk.hoan_hao++;
  if (cheDo === "thu_thach" && r.sao === 3) tt.tk.thu_thach_3sao++;
  if (kk) {
    if (kk.sao === 3 && kk.toc === "nhanh") tt.tk.nhanh_3sao++;
    tt.tk.combo = Math.max(tt.tk.combo, kk.combo || 0);
  }
  let hangNgay = null;
  if (daily) {
    const xong = r.tong >= cfg.hang_ngay.diem_toi_thieu;
    const truoc = tt.hang_ngay[ngay];
    if (xong && !truoc) { xp += xp * (cfg.xp.thu_thach_ngay_nhan - 1); tt.tk.hang_ngay++; }
    if (xong) tt.hang_ngay[ngay] = { mon: mon.id_kho, diem: Math.max(truoc?.diem || 0, r.tong), sao: Math.max(truoc?.sao || 0, r.sao) };
    hangNgay = { xong, lanDau: xong && !truoc };
  }
  tt.xp += xp;
  return { tt, xpNhan: xp, moi: thuong(tt0, tt, dsMon, cfg, ngay), hangNgay };
}

/** Cập nhật sau một ca khách gọi món. t = kết quả tongKetCa. */
export function capNhatSauCa(tt0, t, dsMon, cfg, ngay) {
  const tt = JSON.parse(JSON.stringify(tt0));
  chamNgay(tt, ngay);
  const xp = Math.round(t.diem / cfg.xp.ca_diem_chia);
  tt.xp += xp;
  tt.tk.ca_xong++;
  tt.ca_lich_su = [...(tt.ca_lich_su || []), { ngay, diem: t.diem, sao: t.sao, hang: t.hang }].slice(-30);
  if (t.hang === 3) tt.tk.ca_hang3++;
  if (t.boDi === 0) tt.tk.ca_khong_bo_di++;
  return { tt, xpNhan: xp, moi: thuong(tt0, tt, dsMon, cfg, ngay) };
}

/** Câu chép chia sẻ kết quả thử thách hằng ngày (kiểu Wordle). */
export function chuoiChiaSe({ ngay, mon, sao, diem, chuoi, tenCuaHang, facebook }) {
  return [`Pha Lab · Thử thách ${ngayDep(ngay)}`, mon, `${"★".repeat(sao)}${"☆".repeat(3 - sao)} · ${diem} điểm`,
    chuoi > 1 ? `Chuỗi ${chuoi} ngày liên tiếp` : "", `Bạn pha được mấy sao? ${tenCuaHang}${facebook ? " · " + facebook : ""}`].filter(Boolean).join("\n");
}

/** Top n lần chơi ca có điểm cao nhất (bảng điểm trên máy). */
export function bangDiemCa(tt, n = 5) {
  return [...(tt.ca_lich_su || [])].sort((a, b) => b.diem - a.diem).slice(0, n);
}

// ---- Sao lưu / khôi phục tiến trình bằng một đoạn mã (để chuyển sang máy khác, chưa có tài khoản trên máy chủ)
const bam = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(36); };
const mahoa = (s) => btoa(unescape(encodeURIComponent(s)));
const giaima = (s) => decodeURIComponent(escape(atob(s)));

/** @param goi {tt, diem_cao, ca_cao}  @returns chuỗi dạng "PHALAB1.<mã>.<kiểm tra>" */
export function xuatTienTrinh(goi) {
  const nd = mahoa(JSON.stringify({ v: 1, ...goi }));
  return `PHALAB1.${nd}.${bam(nd)}`;
}

/** Trả {ok, goi} hoặc {ok:false, loi}. Kiểm tra định dạng, mã kiểm tra và hình dạng dữ liệu trước khi dùng. */
export function nhapTienTrinh(chuoi) {
  try {
    const p = String(chuoi || "").trim().split(".");
    if (p.length !== 3 || p[0] !== "PHALAB1") return { ok: false, loi: "Đây không phải mã sao lưu Pha Lab." };
    if (bam(p[1]) !== p[2]) return { ok: false, loi: "Mã bị thiếu hoặc sai ký tự (chép chưa đủ?)." };
    const d = JSON.parse(giaima(p[1]));
    const t = d.tt;
    const so = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0;
    if (d.v !== 1 || !t || !so(t.xp) || !so(t.ly) || typeof t.sao !== "object" || t.sao === null || typeof t.huy_hieu !== "object" || t.huy_hieu === null)
      return { ok: false, loi: "Mã hợp lệ nhưng nội dung không đúng dạng tiến trình." };
    if (Object.values(t.sao).some((v) => !Number.isInteger(v) || v < 0 || v > 3)) return { ok: false, loi: "Số sao trong mã không hợp lệ." };
    const goc = tienTrinhTrong();
    return { ok: true, goi: { tt: { ...goc, ...t, tk: { ...goc.tk, ...(t.tk || {}) } }, diem_cao: d.diem_cao && typeof d.diem_cao === "object" ? d.diem_cao : {}, ca_cao: so(d.ca_cao) ? d.ca_cao : 0 } };
  } catch { return { ok: false, loi: "Không đọc được mã." }; }
}
