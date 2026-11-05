// Kiểm tra các file tùy chỉnh. Chạy: node kiem_tra_du_lieu.mjs [thư_mục_du_lieu]
// Thoát mã 1 nếu có lỗi chắc chắn sai. Chạy được cả trong GitHub Action (báo đỏ kèm lời giải thích khi Khải sửa từ xa sai).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const goc = path.dirname(fileURLToPath(import.meta.url));
const lib = fs.existsSync(path.join(goc, "kiem_tra.mjs")) ? "./kiem_tra.mjs" : "./public/js/kiem_tra.js";
const { kiemTraTuyChinh } = await import(lib);
const dir = path.resolve(process.argv[2] || (fs.existsSync(path.join(goc, "public", "du_lieu")) ? path.join(goc, "public", "du_lieu") : "du_lieu"));
const loiFile = [];
const doc = (f, mau) => {
  const p = path.join(dir, f);
  if (!fs.existsSync(p)) return mau;
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch (e) { loiFile.push(`File ${f} không đọc được (sai định dạng): ${e.message}`); return mau; }
};
const kq = kiemTraTuyChinh({
  nguyenLieu: doc("nguyen_lieu.json", { nguyen_lieu: [] }).nguyen_lieu, mon: doc("recipes.json", { mon: [] }).mon.filter((m) => m.trang_thai === "da_duyet"),
  gia: doc("gia_tuy_chinh.json", {}), cuaHang: doc("cua_hang_tuy_chinh.json", {}), monTuyChinh: doc("mon_tuy_chinh.json", {}), canBang: doc("can_bang_tuy_chinh.json", {}),
});
kq.loi.unshift(...loiFile);
const ga = !!process.env.GITHUB_ACTIONS;
const nhan = (k, m) => (ga ? `::${k} file=du_lieu/::${m.replace(/\n/g, " ")}` : `  [${k === "error" ? "LỖI" : "cảnh báo"}] ${m}`);
kq.canh_bao.forEach((m) => console.log(nhan("warning", m)));
kq.loi.forEach((m) => console.log(nhan("error", m)));
console.log(kq.loi.length ? `\nKIỂM TRA KHÔNG ĐẠT: ${kq.loi.length} lỗi, ${kq.canh_bao.length} cảnh báo.` : `\nKIỂM TRA SẠCH (${kq.canh_bao.length} cảnh báo).`);
process.exit(kq.loi.length ? 1 : 0);
