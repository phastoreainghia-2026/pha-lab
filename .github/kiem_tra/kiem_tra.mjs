// Kiểm tra các file TÙY CHỈNH (giá, cửa hàng, món ẩn, độ khó) mà Khải sửa từ xa hoặc trên máy.
// Hàm thuần: dùng được trong trang quản trị, trong Node (CLI) và trong GitHub Action.
// loi = chắc chắn sai (game sẽ bỏ qua giá trị đó); canh_bao = đáng xem lại nhưng game vẫn chạy.

const laSo = (v) => typeof v === "number" && Number.isFinite(v);
const chu = (v) => (typeof v === "string" ? v.trim() : "");

/**
 * @param d {nguyenLieu:[...nguyen_lieu.json], mon:[...recipes.json mon], gia, cuaHang, monTuyChinh, canBang}
 * @returns {loi:string[], canh_bao:string[]}
 */
export function kiemTraTuyChinh({ nguyenLieu = [], mon = [], gia = {}, cuaHang = {}, monTuyChinh = {}, canBang = {} }) {
  const loi = [], cb = [];
  const theoId = new Map(nguyenLieu.map((e) => [e.id, e]));
  const ten = (id) => theoId.get(id)?.ten || id;

  // ---- giá và mã hàng
  const thay = new Set();
  for (const it of gia.nguyen_lieu || []) {
    const id = it.nguyen_lieu, t = id && theoId.has(id) ? ten(id) : String(id);
    if (!theoId.has(id)) { loi.push(`Giá: nguyên liệu "${id}" không có trong game (sẽ bị bỏ qua).`); continue; }
    if (thay.has(id)) loi.push(`Giá: "${t}" xuất hiện hai lần, game chỉ lấy dòng đầu.`);
    thay.add(id);
    const ma = chu(it.ma_hang), g = it.gia_ban_sau_thue, q = it.quy_cach;
    if (ma.length > 40) loi.push(`Giá "${t}": mã hàng dài quá 40 ký tự.`);
    if (g != null && !(laSo(g) && g >= 0)) loi.push(`Giá "${t}": giá bán phải là số không âm (đang là ${JSON.stringify(g)}).`);
    if (q != null && !(laSo(q) && q > 0)) loi.push(`Giá "${t}": quy cách phải là số lớn hơn 0 (đang là ${JSON.stringify(q)}).`);
    if (theoId.get(id).mien_phi && ma) cb.push(`Giá "${t}": nguyên liệu này được tính miễn phí (nước, đá) nên giá sẽ không được dùng.`);
    if (!ma && (laSo(g) || laSo(q))) cb.push(`Giá "${t}": có giá nhưng trống mã hàng, game coi như chưa có giá.`);
    if (ma && it.tinh_gia !== false && !(laSo(g) && laSo(q) && q > 0)) cb.push(`Giá "${t}": đang bật tính giá nhưng thiếu giá bán hoặc quy cách, món sẽ hiện "chưa có giá".`);
    const goc = theoId.get(id).sku?.gia_ban_sau_thue;
    if (laSo(g) && laSo(goc) && goc > 0 && (g > goc * 5 || g < goc / 5)) cb.push(`Giá "${t}": ${g.toLocaleString("vi-VN")}đ lệch rất nhiều so với giá gốc ${goc.toLocaleString("vi-VN")}đ, có gõ thừa hoặc thiếu số 0 không?`);
  }

  // ---- món còn thiếu giá (thông tin để biết món nào chưa có tổng giá vốn)
  const hieuLuc = new Map();
  for (const e of nguyenLieu) hieuLuc.set(e.id, { ...e });
  for (const it of gia.nguyen_lieu || []) {
    const e = hieuLuc.get(it.nguyen_lieu);
    if (!e) continue;
    const ma = chu(it.ma_hang);
    e.coGia = !!ma && it.tinh_gia !== false && laSo(it.gia_ban_sau_thue) && it.gia_ban_sau_thue >= 0 && laSo(it.quy_cach) && it.quy_cach > 0;
    e.daSua = true;
  }
  for (const m of mon) {
    const thieu = m.nguyen_lieu.filter((x) => { const e = hieuLuc.get(x.nl); return e && !e.mien_phi && !(e.daSua ? e.coGia : e.tinh_gia && e.sku && e.sku.gia_ban_sau_thue != null && e.sku.quy_cach > 0); });
    if (thieu.length) cb.push(`Món "${m.ten}": còn ${thieu.length} nguyên liệu chưa có giá (${thieu.map((x) => ten(x.nl)).join(", ")}), nên chưa hiện tổng chi phí.`);
  }

  // ---- cửa hàng
  const z = chu(cuaHang.zalo_so_dien_thoai);
  if (z && !/^\+?\d{9,12}$/.test(z)) cb.push(`Cửa hàng: số Zalo "${z}" có vẻ sai (thường 9 đến 11 chữ số).`);
  const ml = chu(cuaHang.messenger_link);
  if (ml && !/^https:\/\/(m\.me|www\.facebook\.com|facebook\.com)\//.test(ml)) loi.push(`Cửa hàng: link Messenger phải bắt đầu bằng https://m.me/ hoặc https://www.facebook.com/.`);
  const hs = cuaHang.he_so_gia_ban_goi_y;
  if (hs != null && !(laSo(hs) && hs > 0)) loi.push(`Cửa hàng: hệ số giá bán phải là số lớn hơn 0.`);
  else if (laSo(hs) && hs > 10) cb.push(`Cửa hàng: hệ số giá bán ${hs} rất cao (giá bán gấp ${hs} lần chi phí), có đúng không?`);

  const ud = chu(cuaHang.uu_dai);
  if (ud.length > 160) cb.push(`Cửa hàng: ưu đãi dài ${ud.length} ký tự, game chỉ hiện 160 ký tự đầu.`);
  const gc = chu(cuaHang.goatcounter_ma);
  if (gc && !/^[a-z0-9-]{2,40}$/.test(gc)) loi.push("Cửa hàng: mã thống kê (GoatCounter) chỉ gồm chữ thường không dấu, số và dấu gạch ngang (ví dụ pha-lab), nên game bỏ qua mã này.");

  // ---- món ẩn
  const idMon = new Set(mon.map((m) => m.id));
  const an = (monTuyChinh.mon_an || []).filter((id) => { if (!idMon.has(id)) { loi.push(`Thực đơn: món "${id}" không có trong game (sẽ bị bỏ qua).`); return false; } return true; });
  if (mon.length && new Set(an).size >= mon.length) loi.push("Thực đơn: đang ẩn tất cả các món, game sẽ trống.");

  // ---- độ khó
  const khoang = (k, ten2, lo, hi, nguyen = false) => {
    const v = canBang[k];
    if (v == null) return;
    if (!laSo(v) || v < lo || v > hi || (nguyen && !Number.isInteger(v))) cb.push(`Độ khó: ${ten2} nên nằm trong khoảng ${lo} đến ${hi}${nguyen ? " (số nguyên)" : ""}, đang là ${JSON.stringify(v)} (giá trị sai sẽ bị bỏ qua).`);
  };
  khoang("so_khach", "số khách mỗi ca", 1, 20, true);
  khoang("thoi_gian_co_so", "thời gian chờ cơ sở (giây)", 5, 300);
  khoang("thoi_gian_moi_buoc", "thời gian cộng mỗi bước (giây)", 1, 120);
  khoang("he_so_thu_thach", "hệ số thời gian Thử thách", 0.2, 1.5);
  khoang("canh_bao_giay", "báo động còn (giây)", 1, 60);
  khoang("nhanh_toi_da", "điểm thưởng tốc độ", 0, 200);
  khoang("combo_diem", "điểm mỗi bậc combo", 0, 100);
  khoang("so_mon_ban_dau", "số món mở sẵn", 1, 20, true);
  khoang("sao_moi_mon", "số sao mỗi món khóa", 0, 10);
  khoang("diem_toi_thieu_hang_ngay", "điểm tối thiểu thử thách ngày", 0, 100);
  return { loi, canh_bao: cb };
}
