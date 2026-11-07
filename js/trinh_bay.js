// Dàn cảnh "ly thành phẩm": đặt ly vừa pha lên đế lót + mặt bàn, nền ánh theo màu đồ uống,
// rồi thêm ống hút, topping và đồ trang trí NGẪU NHIÊN (cùng một seed thì ra cùng một cảnh).
// Trang trí chỉ để đẹp và để chia sẻ: không phải công thức, không tính điểm. Không biết món nào cả, chỉ dựa vào màu và lượng nước trong ly.
import { nuaRong, KICH_THUOC_LY } from "./glass.js";

const { TOP, BOT } = KICH_THUOC_LY;
const W = 320, H = 430;           // khung cảnh
const GX = 60, GY = 100;          // vị trí góc trên trái của ly (ly rộng 200, cao 300)
const CX = GX + 100;              // trục giữa ly
const RIM_Y = GY + TOP;           // cao độ miệng ly trong cảnh
const BASE_Y = GY + BOT;          // cao độ đáy ly trong cảnh

// ---------- tiện ích
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hex(c) {
  const m = /^#?([0-9a-f]{6})$/i.exec(c);
  const n = parseInt(m ? m[1] : "d9c7a3", 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const toHex = (rgb) => "#" + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
const sang = (c, k) => toHex(hex(c).map((v) => v + (255 - v) * k));
const toi = (c, k) => toHex(hex(c).map((v) => v * (1 - k)));
const tron = (a, b, t) => toHex(hex(a).map((v, i) => v * (1 - t) + hex(b)[i] * t));
const f = (n) => Math.round(n * 10) / 10;

// ---------- bảng màu / kiểu
const MAU_ONG = [["#ff6b6b", "#ffffff"], ["#4dabf7", "#ffffff"], ["#51cf66", "#ffffff"], ["#ffc531", "#ffffff"], ["#e599f7", "#ffffff"], ["#ff922b", "#fff4e0"]];
const TRAI = {
  chanh: { ten: "Lát chanh", vo: "#f2cf3a", ruot: "#fff09a", mui: "#ffe25c" },
  cam: { ten: "Lát cam", vo: "#f08a1c", ruot: "#ffc062", mui: "#ffa933" },
  chanh_xanh: { ten: "Lát chanh xanh", vo: "#5fa634", ruot: "#e2f4b4", mui: "#bfe27f" },
  buoi: { ten: "Lát bưởi hồng", vo: "#e96a6a", ruot: "#ffd2cd", mui: "#ff948f" },
};
const SOT = [["#5b3219", "sốt sô-cô-la"], ["#d6264e", "sốt dâu"], ["#c9822a", "sốt caramel"]];
const MAU_HOA = [["#ffd6e7", "#ffb703"], ["#ffffff", "#ffb703"], ["#ffe08a", "#e07a00"], ["#e9d5ff", "#ffd166"]];
const MAU_O = [["#ff6b6b", "#ffffff"], ["#4dabf7", "#ffd43b"], ["#51cf66", "#ffffff"], ["#ff8fab", "#ffe066"]];

// ---------- các mảnh vẽ (trả về chuỗi SVG)
function la(x, y, rot, s = 1) {
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${s})"><path d="M0 0C6 -10 20 -10 27 0C20 10 6 10 0 0Z" fill="#3fae5a" stroke="#2a7d41" stroke-width=".8"/><path d="M0 0C6 -9 20 -9 27 0C18 -2 8 -2 0 0Z" fill="#6ad583" opacity=".7"/><path d="M1 0H24" stroke="#2a7d41" stroke-width=".9" opacity=".7"/></g>`;
}
function batHa(x, y, r) {
  let s = `<g>`;
  const n = 3 + Math.floor(r() * 2);
  for (let i = 0; i < n; i++) s += la(x + (r() - 0.5) * 6, y, -70 - i * (110 / n) - r() * 10, 0.9 + r() * 0.25);
  s += `<path d="M${f(x)} ${f(y + 4)}l0 6" stroke="#2a7d41" stroke-width="2" stroke-linecap="round"/></g>`;
  return s;
}
function latTrai(cx, cy, rx, ry, rot, k) {
  const c = TRAI[k];
  let wedges = "";
  for (let i = 0; i < 8; i++) {
    const a0 = ((i * 45 + 4) * Math.PI) / 180, am = ((i * 45 + 22) * Math.PI) / 180, a1 = ((i * 45 + 41) * Math.PI) / 180;
    const p = (a, k2) => `${f(Math.cos(a) * rx * k2)} ${f(Math.sin(a) * ry * k2)}`;
    wedges += `<path d="M${p(a0, 0.1)} L${p(a0, 0.72)} Q${p(am, 0.8)} ${p(a1, 0.72)} L${p(a1, 0.1)}Z" fill="${c.mui}" opacity=".95"/>`;
  }
  return `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${f(rot)})"><ellipse rx="${rx}" ry="${ry}" fill="${c.vo}"/><ellipse rx="${f(rx * 0.9)}" ry="${f(ry * 0.9)}" fill="#fff8e6"/><ellipse rx="${f(rx * 0.82)}" ry="${f(ry * 0.82)}" fill="${c.ruot}"/>${wedges}<path d="M${f(-rx * 0.6)} ${f(-ry * 0.45)}Q${f(-rx * 0.2)} ${f(-ry * 0.85)} ${f(rx * 0.35)} ${f(-ry * 0.8)}" stroke="#fff" stroke-width="2" fill="none" opacity=".6" stroke-linecap="round"/></g>`;
}
function dau(cx, cy, rot, s = 1) {
  let hat = "";
  [[-8, 2], [0, 6], [8, 2], [-4, 14], [4, 14], [0, 22], [-9, 11], [9, 11]].forEach(([a, b]) => { hat += `<ellipse cx="${a}" cy="${b}" rx="1.1" ry="1.8" fill="#fff3b0"/>`; });
  return `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${f(rot)}) scale(${s})"><path d="M0 -8C14 -20 30 -4 22 11C16 22 6 31 0 37C-6 31 -16 22 -22 11C-30 -4 -14 -20 0 -8Z" fill="#e0344c" stroke="#a81f35" stroke-width="1"/><path d="M0 0C10 -8 19 2 14 11C10 18 4 24 0 28C-4 24 -10 18 -14 11C-19 2 -10 -8 0 0Z" fill="#ff7e8d" opacity=".75"/>${hat}<path d="M-12 -9C-6 -14 -2 -10 0 -8C2 -10 6 -14 12 -9C6 -6 2 -6 0 -4C-2 -6 -6 -6 -12 -9Z" fill="#3fae5a" stroke="#2a7d41" stroke-width=".8"/></g>`;
}
function cherry(x, y) {
  return `<g><path d="M${f(x)} ${f(y - 6)}C${f(x + 4)} ${f(y - 20)} ${f(x + 10)} ${f(y - 24)} ${f(x + 16)} ${f(y - 24)}" stroke="#5f7d2a" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="${f(x)}" cy="${f(y)}" r="7.5" fill="#c9162f" stroke="#8c0f21" stroke-width=".8"/><ellipse cx="${f(x - 2.5)}" cy="${f(y - 3)}" rx="2.4" ry="1.7" fill="#fff" opacity=".7"/></g>`;
}
function hoa(x, y, rot, s, r) {
  const [canh, nhuy] = MAU_HOA[Math.floor(r() * MAU_HOA.length)];
  let c = "";
  for (let i = 0; i < 5; i++) c += `<ellipse cx="0" cy="-8" rx="5.2" ry="8" fill="${canh}" stroke="${toi(canh, 0.18)}" stroke-width=".7" transform="rotate(${i * 72})"/>`;
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${s})">${c}<circle r="4" fill="${nhuy}"/></g>`;
}
function oGiay(x, y, rot, s, r) {
  const [a, b] = MAU_O[Math.floor(r() * MAU_O.length)];
  let nan = "";
  for (let i = 0; i < 4; i++) {
    const x0 = -26 + i * 13, x1 = x0 + 13;
    nan += `<path d="M0 -4L${x0} 6Q${f((x0 + x1) / 2)} 14 ${x1} 6Z" fill="${i % 2 ? b : a}" stroke="#0002" stroke-width=".6"/>`;
  }
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${s})"><path d="M0 40V-4" stroke="#caa56a" stroke-width="2.2" stroke-linecap="round"/><path d="M-26 6Q-24 -22 0 -26Q24 -22 26 6Q13 -2 0 6Q-13 -2 -26 6Z" fill="${a}" stroke="#0002" stroke-width=".8"/>${nan}<path d="M0 -26V-31" stroke="#caa56a" stroke-width="2" stroke-linecap="round"/></g>`;
}
function vien(x, y, rot, s = 1) { // viên đá trên mặt bàn
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${s})"><rect x="-10" y="-10" width="20" height="20" rx="4.5" fill="#fff" opacity=".55" stroke="#bfe3f0" stroke-width="1.2"/><path d="M-6 -5L2 -6" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".9"/></g>`;
}
function hatRac(r, x, y, rx, ry, n) {
  const cs = ["#ff6b6b", "#ffd43b", "#4dabf7", "#51cf66", "#fff", "#e599f7"];
  let s = "";
  for (let i = 0; i < n; i++) s += `<rect x="${f(x + (r() * 2 - 1) * rx)}" y="${f(y + (r() * 2 - 1) * ry)}" width="5" height="1.9" rx=".9" fill="${cs[Math.floor(r() * cs.length)]}" transform="rotate(${f(r() * 180)} ${f(x)} ${f(y)})" stroke="#0001" stroke-width=".3"/>`;
  return s;
}
function saoLap(x, y, s, tre) {
  return `<path class="tb-sp" style="animation-delay:${tre}s" d="M${f(x)} ${f(y - s)}Q${f(x + s * 0.18)} ${f(y - s * 0.18)} ${f(x + s)} ${f(y)}Q${f(x + s * 0.18)} ${f(y + s * 0.18)} ${f(x)} ${f(y + s)}Q${f(x - s * 0.18)} ${f(y + s * 0.18)} ${f(x - s)} ${f(y)}Q${f(x - s * 0.18)} ${f(y - s * 0.18)} ${f(x)} ${f(y - s)}Z" fill="#fff" opacity=".9"/>`;
}

/** Ống hút: từ (xb,yb) lên (xt,yt). Vẽ từ cao độ tuY trở lên nếu cần (khi phần dưới bị kem che). */
function ongHut(o, tuY = null) {
  const { kieu, mau, w, xb, yb, xt, yt } = o;
  const dx = (xt - xb) / (yb - yt);
  const y0 = tuY ?? yb;
  const x0 = xb + dx * (yb - y0);
  const [a, b] = mau;
  let s = `<g stroke-linecap="round">`;
  s += `<line x1="${f(x0 + 1.2)}" y1="${f(y0)}" x2="${f(xt + 1.2)}" y2="${f(yt)}" stroke="#0000001f" stroke-width="${w + 1.5}"/>`;
  s += `<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(xt)}" y2="${f(yt)}" stroke="${a}" stroke-width="${w}"/>`;
  if (kieu === "soc") s += `<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(xt)}" y2="${f(yt)}" stroke="${b}" stroke-width="${w}" stroke-dasharray="6 6" stroke-linecap="butt"/>`;
  s += `<line x1="${f(x0 - w * 0.22)}" y1="${f(y0)}" x2="${f(xt - w * 0.22)}" y2="${f(yt)}" stroke="#fff" stroke-width="${f(w * 0.2)}" opacity=".45"/>`;
  s += `<ellipse cx="${f(xt)}" cy="${f(yt)}" rx="${f(w / 2)}" ry="${f(w / 3.2)}" fill="${toi(a, 0.45)}" stroke="${a}" stroke-width="1" transform="rotate(${f(Math.atan(dx) * 57.3)} ${f(xt)} ${f(yt)})"/>`;
  return s + `</g>`;
}

/**
 * Dựng cảnh trình bày.
 * @param ly   đối tượng Ly (đã pha xong)
 * @param seed số nguyên; đổi seed là ra cách trang trí khác
 * @returns { svg: chuỗi SVG hoàn chỉnh (có xmlns, width, height), nhan: ["Ống hút giấy sọc", ...], w, h }
 */
export function dungCanhLy(ly, seed) {
  const r = rng(seed);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const nhan = [];
  const coNuoc = ly.tongMl() > 0;
  const mau = coNuoc ? ly.mauTron() : "#e8f6fb";
  // mặt nước (toạ độ ly) để đặt kem/topping đúng chỗ
  const yN = Math.min(Math.max(ly.matNuoc(), TOP + 6), BOT - 30) + GY;
  const rxN = nuaRong(yN - GY) - 5;

  // --- chọn đồ trang trí
  const kieuOng = pick(["soc", "tron", "soc"]);
  const boba = r() < 0.3;
  const ong = {
    kieu: kieuOng, mau: pick(MAU_ONG), w: boba ? 11 : 6.5,
    xb: CX + (r() * 2 - 1) * 22, yb: BASE_Y - 16,
  };
  const nghieng = (r() < 0.5 ? -1 : 1) * (0.05 + r() * 0.08);
  const cao = 58 + r() * 34;
  ong.yt = RIM_Y - cao;
  ong.xt = ong.xb + nghieng * (ong.yb - ong.yt);
  nhan.push(boba ? "Ống hút to" : kieuOng === "soc" ? "Ống hút giấy sọc" : "Ống hút màu pastel");

  const coKem = coNuoc && r() < 0.42;
  const sot = coKem && r() < 0.7 ? pick(SOT) : null;
  const trai = r() < 0.72 ? pick(["chanh", "cam", "chanh_xanh", "buoi", "dau"]) : null;
  const coHa = r() < 0.5;
  const coO = !coKem && r() < 0.26;
  const coHoa = r() < 0.34;
  const coCherry = coKem && r() < 0.6;
  const phuBan = [];
  for (const m of ["trai", "la", "da", "hoa", "hat"]) if (r() < 0.5) phuBan.push(m);
  if (phuBan.length < 2) phuBan.push(...["da", "la"].filter((m) => !phuBan.includes(m)).slice(0, 2 - phuBan.length));

  if (coKem) nhan.push(sot ? "Kem tươi + " + sot[1] : "Kem tươi");
  if (trai) nhan.push(trai === "dau" ? "Dâu tươi" : TRAI[trai].ten);
  if (coHa) nhan.push("Lá bạc hà");
  if (coO) nhan.push("Ô giấy nhỏ");
  if (coHoa) nhan.push("Hoa nhỏ");
  if (coCherry) nhan.push("Cherry");

  // --- nền
  const nen1 = tron(sang(mau, 0.9), "#ffe8d0", 0.45), nen2 = tron(sang(mau, 0.7), "#ffd6b0", 0.35);
  let bokeh = "";
  for (let i = 0; i < 8; i++) bokeh += `<circle cx="${f(r() * W)}" cy="${f(10 + r() * 250)}" r="${f(12 + r() * 26)}" fill="#fff" opacity="${f(0.16 + r() * 0.2)}"/>`;

  let s = `<defs>
    <linearGradient id="tb-nen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${nen1}"/><stop offset="1" stop-color="${nen2}"/></linearGradient>
    <radialGradient id="tb-vig" cx=".5" cy=".45" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></radialGradient>
    <linearGradient id="tb-ban" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2bd92"/><stop offset="1" stop-color="#b98859"/></linearGradient>
    <radialGradient id="tb-bong" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#3a2410" stop-opacity=".42"/><stop offset="1" stop-color="#3a2410" stop-opacity="0"/></radialGradient>
    <radialGradient id="tb-anh" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${mau}" stop-opacity=".5"/><stop offset="1" stop-color="${mau}" stop-opacity="0"/></radialGradient>
    <filter id="tb-mo" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#tb-nen)"/>
  <g filter="url(#tb-mo)">${bokeh}</g>
  <rect width="${W}" height="${H}" fill="url(#tb-vig)"/>`;

  // --- mặt bàn gỗ + đế lót + bóng đổ + ánh màu đồ uống hắt xuống bàn
  s += `<rect x="0" y="352" width="${W}" height="${H - 352}" fill="url(#tb-ban)"/>
  <path d="M0 352H${W}" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>
  <path d="M0 384H${W}M0 410H${W}" stroke="#8a5f38" stroke-opacity=".25" stroke-width="1"/>
  <ellipse cx="${CX}" cy="${BASE_Y + 12}" rx="112" ry="16" fill="url(#tb-bong)"/>
  <ellipse cx="${CX}" cy="${BASE_Y + 8}" rx="92" ry="13" fill="#f6ead7" stroke="#d9c3a2" stroke-width="2"/>
  <ellipse cx="${CX}" cy="${BASE_Y + 8}" rx="80" ry="10.5" fill="none" stroke="#d9c3a2" stroke-width="1" opacity=".8"/>
  <ellipse cx="${CX + 12}" cy="${BASE_Y + 22}" rx="${f(rxN + 20)}" ry="9" fill="url(#tb-anh)"/>`;

  // --- đồ phụ trên mặt bàn (hai bên ly, không đè lên ly)
  const traiBan = pick(["chanh", "cam", "chanh_xanh", "buoi"]);
  const traiTrai = trai && trai !== "dau" ? trai : traiBan;
  const dsBan = { trai: () => latTrai(268 + r() * 10, 392 + r() * 6, 17, 14, r() * 40 - 20, traiTrai).replace("<g ", '<g class="tb-ban-do" '),
    la: () => la(26 + r() * 10, 398 + r() * 6, -20 + r() * 40, 0.95) + la(38 + r() * 10, 404 + r() * 4, 150 + r() * 30, 0.8),
    da: () => vien(34 + r() * 8, 386 + r() * 4, r() * 30 - 15, 0.9) + vien(272 + r() * 10, 412 + r() * 4, r() * 40 - 20, 0.8),
    hoa: () => hoa(36 + r() * 6, 402, r() * 60, 1.05, r),
    hat: () => hatRac(r, 160, 410, 110, 7, 26) };
  for (const m of phuBan) s += dsBan[m]();

  // --- ống hút (phía sau thành ly)
  s += ongHut(ong);

  // --- ly (lấy nguyên phần vẽ của lớp Ly, dời vào đúng chỗ)
  ly.hienVach = false; ly.ve();            // ảnh trình bày không cần vạch ml
  const longLy = ly.svg.innerHTML;
  ly.hienVach = true; ly.ve();             // trả lại như cũ
  s += `<g transform="translate(${GX} ${GY})">${longLy}</g>`;

  // --- kem tươi + sốt + cherry/hạt rắc, đặt trên mặt nước
  if (coKem) {
    const b = yN, k = rxN;
    s += `<g><ellipse cx="${CX}" cy="${f(b)}" rx="${f(k)}" ry="9" fill="#fffaf0" stroke="#e6d4b4" stroke-width="1.2"/>
      <path d="M${f(CX - k * 0.86)} ${f(b - 2)}Q${f(CX - k * 0.9)} ${f(b - 22)} ${f(CX - k * 0.5)} ${f(b - 24)}Q${f(CX)} ${f(b - 30)} ${f(CX + k * 0.5)} ${f(b - 24)}Q${f(CX + k * 0.9)} ${f(b - 22)} ${f(CX + k * 0.86)} ${f(b - 2)}Q${f(CX)} ${f(b + 10)} ${f(CX - k * 0.86)} ${f(b - 2)}Z" fill="#fffaf2" stroke="#e6d4b4" stroke-width="1.2"/>
      <path d="M${f(CX - k * 0.6)} ${f(b - 26)}Q${f(CX - k * 0.55)} ${f(b - 44)} ${f(CX)} ${f(b - 45)}Q${f(CX + k * 0.55)} ${f(b - 44)} ${f(CX + k * 0.6)} ${f(b - 26)}Q${f(CX)} ${f(b - 18)} ${f(CX - k * 0.6)} ${f(b - 26)}Z" fill="#fffdf8" stroke="#e6d4b4" stroke-width="1.2"/>
      <path d="M${f(CX - k * 0.28)} ${f(b - 44)}Q${f(CX - k * 0.2)} ${f(b - 58)} ${f(CX)} ${f(b - 64)}Q${f(CX + k * 0.2)} ${f(b - 58)} ${f(CX + k * 0.28)} ${f(b - 44)}Q${f(CX)} ${f(b - 38)} ${f(CX - k * 0.28)} ${f(b - 44)}Z" fill="#fffdf8" stroke="#e6d4b4" stroke-width="1.2"/>
      <path d="M${f(CX - k * 0.7)} ${f(b - 14)}Q${f(CX - k * 0.3)} ${f(b - 8)} ${f(CX)} ${f(b - 12)}" stroke="#e6d4b4" stroke-width="1.4" fill="none" opacity=".8"/>
      <path d="M${f(CX - k * 0.4)} ${f(b - 36)}Q${f(CX)} ${f(b - 30)} ${f(CX + k * 0.4)} ${f(b - 36)}" stroke="#e6d4b4" stroke-width="1.4" fill="none" opacity=".8"/>
      <path d="M${f(CX - k * 0.5)} ${f(b - 22)}Q${f(CX - k * 0.45)} ${f(b - 32)} ${f(CX - k * 0.2)} ${f(b - 34)}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".9"/></g>`;
    if (sot) {
      s += `<g stroke="${sot[0]}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".92">
        <path d="M${f(CX - k * 0.7)} ${f(b - 14)}Q${f(CX - k * 0.4)} ${f(b - 22)} ${f(CX - k * 0.1)} ${f(b - 14)}T${f(CX + k * 0.55)} ${f(b - 15)}"/>
        <path d="M${f(CX - k * 0.4)} ${f(b - 33)}Q${f(CX - k * 0.15)} ${f(b - 39)} ${f(CX + k * 0.05)} ${f(b - 33)}T${f(CX + k * 0.4)} ${f(b - 34)}"/>
        <path d="M${f(CX + k * 0.58)} ${f(b - 12)}Q${f(CX + k * 0.62)} ${f(b + 1)} ${f(CX + k * 0.56)} ${f(b + 5)}"/></g>`;
    }
    if (coCherry) s += cherry(CX + (r() - 0.5) * 8, b - 66);
    else s += hatRac(r, CX, b - 28, k * 0.5, 14, 22);
    // phần ống hút nhô lên khỏi kem
    s += ongHut(ong, Math.min(ong.yb, b - 4));
  }

  // --- đồ gài miệng ly
  const phai = r() < 0.5 ? 1 : -1; // bên gài trái cây
  if (trai) {
    const x = CX + phai * 66, y = RIM_Y + 2;
    s += trai === "dau" ? dau(x, y - 14, phai * 18, 0.95) : latTrai(x, y - 2, 22, 24, phai * 14, trai);
  }
  if (coHa) s += batHa(CX - phai * (coKem ? 34 : 24), coKem ? yN - 28 : RIM_Y - 2, r);
  if (coO) s += oGiay(CX - phai * 44, RIM_Y - 36, -phai * 18, 0.95, r);
  if (coHoa) s += hoa(CX - phai * 58, RIM_Y + 2, r() * 60, 0.95, r);

  // --- lấp lánh
  for (let i = 0; i < 4; i++) s += saoLap(30 + r() * 260, 40 + r() * 230, 4 + r() * 4, (r() * 2).toFixed(1));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Ly thành phẩm đã trang trí: ${nhan.join(", ")}">${s}</svg>`;
  return { svg, nhan, w: W, h: H };
}
