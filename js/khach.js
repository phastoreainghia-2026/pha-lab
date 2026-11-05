// Luật chế độ "Khách gọi món": thời hạn, chấm sao theo tốc độ + chính xác, combo, tổng kết ca.
// Hàm thuần (không đụng DOM) nên kiểm thử được bằng Node. Số liệu lấy từ du_lieu/che_do_khach.json.

/** Thời hạn (giây) khách chịu chờ một món: cơ sở + mỗi bước + thời gian các thao tác có ghi giây. */
export function thoiHanKhach(mon, cfg, cheDo, suCo = null) {
  const t = cfg.thoi_gian;
  const giay = mon.buoc.reduce((s, b) => s + (b.thoi_gian_giay && b.thoi_gian_giay < 120 ? b.thoi_gian_giay : 0), 0);
  const he = cheDo === "thu_thach" ? t.he_so_thu_thach : 1;
  return Math.round((t.co_so + t.moi_buoc * mon.buoc.length + giay) * he * (suCo?.han_he_so ?? 1));
}

/** Tâm trạng khách theo phần thời gian còn lại (1 = vừa đến, 0 = hết giờ). */
export function tamTrangKhach(conLai, cfg) {
  return conLai > cfg.tam_trang.vui_tren ? "vui" : conLai > cfg.tam_trang.binh_thuong_tren ? "binh_thuong" : "gian";
}

/**
 * Chấm một khách.
 * @param saoDo   sao theo độ chính xác (0-3, từ chamDiem)
 * @param tong    điểm chính xác (0-100)
 * @param giayDung số giây từ lúc khách gọi đến lúc đưa ly
 * @param han     thời hạn của món
 * @returns {sao, saoToc, toc, diem, combo, boDi}
 */
export function chamKhach({ saoDo, tong, giayDung, han }, cfg, comboTruoc = 0, suCo = null) {
  const ty = giayDung / han;
  if (ty > 1) return { sao: 0, saoToc: 0, toc: "bo_di", diem: 0, combo: 0, boDi: true };
  const [m1, m2] = cfg.moc_toc_do;
  const saoToc = ty <= m1 ? 3 : ty <= m2 ? 2 : 1;
  // Chất lượng quyết định: ly hỏng (0 sao) thì nhanh mấy cũng 0; còn lại tính 2/3 chất lượng + 1/3 tốc độ
  const sao = saoDo === 0 ? 0 : Math.max(1, Math.min(3, Math.round((2 * saoDo + saoToc) / 3)));
  const combo = sao >= cfg.diem.sao_toi_thieu_cho_combo ? comboTruoc + 1 : 0;
  let diem = Math.round(tong + (1 - ty) * cfg.diem.nhanh_toi_da + (combo > 1 ? (combo - 1) * cfg.diem.combo : 0));
  if (suCo) diem = Math.round(diem * (suCo.diem_he_so ?? 1) + (sao === 3 ? suCo.thuong_3sao ?? 0 : 0));
  return { sao, saoToc, toc: ["", "cham", "vua", "nhanh"][saoToc], diem, combo, boDi: false };
}

/** Tổng kết ca: hạng 0-3 theo tỉ lệ sao đạt được. */
export function tongKetCa(kq, cfg) {
  const n = cfg.so_khach;
  const sao = kq.reduce((s, k) => s + k.sao, 0);
  const diem = kq.reduce((s, k) => s + k.diem, 0);
  const ty = sao / (n * 3);
  return { sao, toiDa: n * 3, diem, hang: ty >= 0.8 ? 3 : ty >= 0.55 ? 2 : ty >= 0.3 ? 1 : 0, boDi: kq.filter((k) => k.boDi).length };
}

/**
 * Chọn sự cố ngẫu nhiên cho một khách (null = khách bình thường).
 * cfg = du_lieu/su_co.json. chiSo = số thứ tự khách trong ca (0 là khách đầu, luôn bình thường). rng() trả số 0..1.
 */
export function chonSuCo(cfg, chiSo, rng = Math.random) {
  if (!cfg?.su_co?.length || chiSo < (cfg.tu_khach ?? 1) || rng() >= (cfg.xac_suat ?? 0)) return null;
  return cfg.su_co[Math.min(cfg.su_co.length - 1, Math.floor(rng() * cfg.su_co.length))];
}
