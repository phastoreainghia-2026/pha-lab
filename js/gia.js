// Áp các file "tùy chỉnh" lên dữ liệu gốc khi game chạy. Hàm thuần, kiểm thử được bằng Node.
// Vì sao tách ra: Khải sửa giá/mã hàng/cấu hình từ xa (Sveltia CMS) hoặc ở trang quản trị trên máy,
// cả hai đều chỉ ghi vào các file nhỏ này, nên không bao giờ đè lên dữ liệu sinh tự động (tao_du_lieu_game.py).
//   gia_tuy_chinh.json      {nguyen_lieu:[{nguyen_lieu, ma_hang, ten_hang, gia_ban_sau_thue, quy_cach, tinh_gia, xac_nhan, ghi_chu}]}
//   cua_hang_tuy_chinh.json {zalo_so_dien_thoai, messenger_link, he_so_gia_ban_goi_y}
//   mon_tuy_chinh.json      {mon_an:[id món, ví dụ "m289"]}   (món bị ẩn)
//   can_bang_tuy_chinh.json {so_khach, thoi_gian_co_so, ...}  (độ khó)

export const laSo = (v) => typeof v === "number" && Number.isFinite(v);
const chu = (v) => (typeof v === "string" ? v.trim() : "");

/** Ghi đè mã hàng/giá/quy cách lên danh sách nguyên liệu (sửa tại chỗ, trả về chính danh sách). */
export function apGia(dsNguyenLieu, tc) {
  const theoId = new Map(dsNguyenLieu.map((e) => [e.id, e]));
  for (const it of tc?.nguyen_lieu || []) {
    const e = theoId.get(it.nguyen_lieu);
    if (!e) continue;
    const ma = chu(it.ma_hang);
    if (!ma) { e.sku = null; e.tinh_gia = false; continue; } // xóa mã hàng => quay về "chưa có giá"
    e.sku = {
      ...(e.sku || {}), ma, ten: chu(it.ten_hang) || e.sku?.ten || ma,
      gia_ban_sau_thue: laSo(it.gia_ban_sau_thue) && it.gia_ban_sau_thue >= 0 ? it.gia_ban_sau_thue : null,
      quy_cach: laSo(it.quy_cach) && it.quy_cach > 0 ? it.quy_cach : null,
      chon_boi: it.xac_nhan ? "khai_xac_nhan" : (e.sku?.chon_boi && e.sku.chon_boi !== "khai_xac_nhan" ? e.sku.chon_boi : "claude_tam_cho_khai_xac_nhan"), ghi_chu: chu(it.ghi_chu),
    };
    e.tinh_gia = it.tinh_gia !== false;
  }
  return dsNguyenLieu;
}

/** Thông tin cửa hàng: chỉ ghi đè khi có giá trị hợp lệ. */
export function apCuaHang(ch, tc) {
  const r = { ...ch };
  if (chu(tc?.zalo_so_dien_thoai)) r.zalo_so_dien_thoai = chu(tc.zalo_so_dien_thoai);
  if (chu(tc?.messenger_link)) r.messenger_link = chu(tc.messenger_link);
  if (laSo(tc?.he_so_gia_ban_goi_y) && tc.he_so_gia_ban_goi_y > 0) r.he_so_gia_ban_goi_y = tc.he_so_gia_ban_goi_y;
  return r;
}

/** Tập id_kho các món bị ẩn = danh sách cũ (số) + danh sách tùy chỉnh (id món). */
export function monBiAn(dsMon, cfgAn, tc) {
  const an = new Set(cfgAn || []);
  const ids = new Set(tc?.mon_an || []);
  for (const m of dsMon) if (ids.has(m.id)) an.add(m.id_kho);
  return an;
}

/** Độ khó: ghi đè từng con số nếu hợp lệ. Trả {khach, tienTrinh} mới. */
export function apCanBang(khach, tien, cb) {
  const k = JSON.parse(JSON.stringify(khach)), t = JSON.parse(JSON.stringify(tien));
  const duong = (v) => laSo(v) && v > 0;
  const gan = (obj, key, v, ok = duong) => { if (ok(v)) obj[key] = v; };
  gan(k, "so_khach", cb?.so_khach && Math.round(cb.so_khach));
  gan(k.thoi_gian, "co_so", cb?.thoi_gian_co_so);
  gan(k.thoi_gian, "moi_buoc", cb?.thoi_gian_moi_buoc);
  gan(k.thoi_gian, "he_so_thu_thach", cb?.he_so_thu_thach, (v) => duong(v) && v <= 1.5);
  gan(k.thoi_gian, "canh_bao_giay", cb?.canh_bao_giay);
  gan(k.diem, "nhanh_toi_da", cb?.nhanh_toi_da, (v) => laSo(v) && v >= 0);
  gan(k.diem, "combo", cb?.combo_diem, (v) => laSo(v) && v >= 0);
  gan(t, "sao_moi_mon", cb?.sao_moi_mon, (v) => laSo(v) && v >= 0);
  gan(t, "so_mon_ban_dau", cb?.so_mon_ban_dau && Math.round(cb.so_mon_ban_dau));
  gan(t.hang_ngay, "diem_toi_thieu", cb?.diem_toi_thieu_hang_ngay, (v) => laSo(v) && v >= 0 && v <= 100);
  return { khach: k, tienTrinh: t };
}
