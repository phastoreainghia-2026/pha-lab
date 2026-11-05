// Màn mở đầu: khu phố nhìn ngang (đường, vỉa hè, cây, nhiều quán, người và xe qua lại).
// Bấm bảng hiệu cửa hàng để vào màn chào. Bầu trời đổi theo giờ thật (ngày / chiều / đêm).
// Chỉ là nền: tên cửa hàng truyền vào từ dữ liệu, không biết món nào cả.

const F = 'font-family="Be Vietnam Pro,system-ui,-apple-system,Segoe UI,sans-serif"';
const W = 1800, H = 900, DAT = 620; // chân các cửa hàng nằm ở y = 620

let hat = 7;
const ngau = () => { hat = (hat * 16807) % 2147483647; return (hat - 1) / 2147483646; }; // cố định để cảnh không đổi mỗi lần mở
const giua = (a, b) => a + ngau() * (b - a);
const chon = (m) => m[Math.floor(ngau() * m.length)];

/** giờ trong ngày (0-24), có thể ép bằng ?gio=22 để thử */
export function gioHienTai() {
  const q = /[?&]gio=(\d+(?:\.\d+)?)/.exec(location.search);
  if (q) return Math.min(24, Math.max(0, Number(q[1])));
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
}
export const phaTrongNgay = (g) => (g >= 6 && g < 16.5 ? "ngay" : g >= 16.5 && g < 18.5 ? "chieu" : "dem");

const BANG_MAU = {
  ngay:  { troi: ["#4aa8ee", "#8fd0fb", "#dff2ff"], doi: "#8fb7a8", doi2: "#7aa896", phoXa: "#a9c4d6", via: "#cbc4b8", duong: "#4b505a", kinh: "#bfe3f5", toi: 0 },
  chieu: { troi: ["#3a5a9c", "#f08a6a", "#ffd9a0"], doi: "#6f7fa0", doi2: "#5f6f91", phoXa: "#8b8fb0", via: "#b7ab9c", duong: "#3f424f", kinh: "#ffd9a8", toi: 0.35 },
  dem:   { troi: ["#08112b", "#18285a", "#34498a"], doi: "#243055", doi2: "#1b2546", phoXa: "#222c52", via: "#5d6070", duong: "#262a36", kinh: "#ffd58a", toi: 0.62 },
};

function bauTroi(pha) {
  const p = BANG_MAU[pha];
  let s = `<rect width="${W}" height="${DAT}" fill="url(#ph-troi)"/>`;
  if (pha === "dem") {
    for (let i = 0; i < 70; i++) s += `<circle class="ph-sao" cx="${giua(10, W - 10).toFixed(0)}" cy="${giua(8, 330).toFixed(0)}" r="${giua(0.8, 2.1).toFixed(1)}" fill="#fff" style="animation-delay:${giua(0, 4).toFixed(1)}s"/>`;
    s += `<g><circle cx="1450" cy="140" r="90" fill="url(#ph-anh-trang)"/><circle cx="1450" cy="140" r="38" fill="#f6f1d8"/><circle cx="1466" cy="130" r="34" fill="#18285a" opacity=".0"/><circle cx="1438" cy="130" r="6" fill="#e5dfc0"/><circle cx="1462" cy="156" r="9" fill="#e5dfc0"/><circle cx="1448" cy="118" r="4" fill="#e5dfc0"/></g>`;
  } else if (pha === "chieu") {
    s += `<g><circle cx="360" cy="470" r="230" fill="url(#ph-anh-mat)"/><circle cx="360" cy="470" r="62" fill="#fff0b8"/></g>`;
    for (let i = 0; i < 6; i++) s += `<path d="M360 470 L${360 + Math.cos(i * 0.4 - 0.5) * 1700} ${470 + Math.sin(i * 0.4 - 0.5) * 1700}" stroke="#fff3c4" stroke-opacity=".07" stroke-width="40"/>`;
  } else {
    s += `<g><circle cx="1430" cy="150" r="170" fill="url(#ph-anh-mat)"/><circle cx="1430" cy="150" r="52" fill="#fff6c4"/></g>`;
  }
  // mây trôi (xa, chậm)
  const may = (x, y, k, giay, tre) => `<g class="ph-may" style="animation-duration:${giay}s;animation-delay:-${tre}s"><g transform="translate(${x} ${y}) scale(${k})" fill="${pha === "dem" ? "#8b97c8" : pha === "chieu" ? "#ffd2b0" : "#fff"}" opacity="${pha === "dem" ? 0.28 : 0.92}"><ellipse cx="0" cy="0" rx="90" ry="26"/><ellipse cx="-50" cy="-18" rx="52" ry="30"/><ellipse cx="14" cy="-30" rx="60" ry="34"/><ellipse cx="62" cy="-8" rx="46" ry="24"/></g></g>`;
  s += may(180, 120, 1.1, 150, 20) + may(700, 70, 0.8, 190, 90) + may(1100, 200, 1.3, 170, 50) + may(1500, 110, 0.9, 210, 130) + may(300, 250, 0.7, 230, 10);
  // đàn chim bay
  for (let i = 0; i < 3; i++) s += `<g class="ph-chim-bay" style="animation-duration:${40 + i * 13}s;animation-delay:-${i * 17}s"><g transform="translate(0 ${90 + i * 55}) scale(${1 - i * 0.15})" fill="none" stroke="${pha === "dem" ? "#0a0f22" : "#2b3a4a"}" stroke-width="3" stroke-linecap="round"><path class="ph-canh-chim" d="M-14 0 Q-7 -9 0 0 Q7 -9 14 0"/><path class="ph-canh-chim" style="animation-delay:.15s" d="M26 -10 Q33 -19 40 -10 Q47 -19 54 -10"/><path class="ph-canh-chim" style="animation-delay:.3s" d="M-38 -14 Q-31 -23 -24 -14 Q-17 -23 -10 -14"/></g></g>`;
  // đồi xa + dãy phố xa
  s += `<path d="M0 520 Q180 440 380 500 T800 470 T1200 505 T1600 450 T1800 500 V${DAT} H0Z" fill="${p.doi}"/>`;
  s += `<path d="M0 560 Q220 510 460 550 T980 520 T1500 555 T1800 530 V${DAT} H0Z" fill="${p.doi2}"/>`;
  for (let i = 0; i < 22; i++) {
    const x = i * 85 + giua(-10, 10), h = giua(90, 210), w = giua(50, 78);
    s += `<rect x="${x.toFixed(0)}" y="${(DAT - h).toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="${p.phoXa}" opacity=".85"/>`;
    if (pha !== "ngay") for (let k = 0; k < 7; k++) if (ngau() < 0.45) s += `<rect x="${(x + giua(6, w - 14)).toFixed(0)}" y="${(DAT - h + 10 + k * 22).toFixed(0)}" width="8" height="10" fill="#ffd58a" opacity=".85"/>`;
  }
  return s;
}

const CUA_HANG = {
  ta:      { mau: "#f3e4c8", bien: "#2e8b57", mai: "#c0643a", ten: "Tạp Hóa Cô Ba" },
  banhmi:  { mau: "#f7e6a8", bien: "#d98a1c", mai: "#b4542f", ten: "Bánh Mì Nóng" },
  toc:     { mau: "#d9e4f2", bien: "#3b6fb6", mai: "#7a8aa6", ten: "Salon Tóc" },
  sach:    { mau: "#e9d6c1", bien: "#7a3f8f", mai: "#8a5a3a", ten: "Hiệu Sách" },
  hoa:     { mau: "#fbe0e6", bien: "#d9487a", mai: "#a24a5e", ten: "Hoa Tươi" },
  giat:    { mau: "#d7efe9", bien: "#1f9d93", mai: "#5f8f89", ten: "Giặt Ủi 24h" },
};

function noiThat(kind, x, y, w, h) {
  let s = "";
  if (kind === "ta") for (let r = 0; r < 3; r++) { s += `<rect x="${x + 6}" y="${y + 18 + r * 36}" width="${w - 12}" height="5" fill="#8a6a4a"/>`; for (let i = 0; i < 6; i++) s += `<rect x="${x + 10 + i * ((w - 30) / 6)}" y="${y + 2 + r * 36}" width="${(w - 30) / 6 - 4}" height="16" rx="3" fill="${chon(["#e65a4f", "#f2b632", "#4aa36c", "#4a86d6", "#ef8aa0"])}"/>`; }
  if (kind === "banhmi") { s += `<rect x="${x + 8}" y="${y + h - 38}" width="${w - 16}" height="38" rx="6" fill="#b87a4a"/><rect x="${x + 12}" y="${y + h - 72}" width="${w - 24}" height="34" rx="8" fill="#fff" opacity=".5"/>`; for (let i = 0; i < 4; i++) s += `<ellipse cx="${x + 30 + i * ((w - 60) / 3)}" cy="${y + h - 55}" rx="22" ry="10" fill="#e0a85a" stroke="#b9803a"/>`; }
  if (kind === "toc") s += `<rect x="${x + 12}" y="${y + 8}" width="${w - 24}" height="${h - 50}" rx="6" fill="#fff" opacity=".55"/><rect x="${x + w / 2 - 22}" y="${y + h - 60}" width="44" height="44" rx="10" fill="#c0392b"/><rect x="${x + w / 2 - 6}" y="${y + h - 18}" width="12" height="18" fill="#444"/>`;
  if (kind === "sach") for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) s += `<rect x="${x + 8 + i * ((w - 20) / 9)}" y="${y + 6 + r * 36}" width="${(w - 20) / 9 - 2}" height="${giua(24, 32).toFixed(0)}" fill="${chon(["#c0392b", "#2c7fb8", "#f0a020", "#3f9b5a", "#8e44ad", "#34495e"])}"/>`;
  if (kind === "hoa") for (let i = 0; i < 5; i++) { const cx = x + 22 + i * ((w - 44) / 4), c = chon(["#ff6b9a", "#ffd23f", "#ff8a4a", "#c77dff", "#fff"]); s += `<path d="M${cx} ${y + h} V${y + h - 46}" stroke="#2f8f4a" stroke-width="4"/><circle cx="${cx}" cy="${y + h - 52}" r="12" fill="${c}"/><circle cx="${cx}" cy="${y + h - 52}" r="4" fill="#fff3b0"/><rect x="${cx - 12}" y="${y + h - 22}" width="24" height="22" rx="4" fill="#b0643a"/>`; }
  if (kind === "giat") { s += `<line x1="${x + 6}" y1="${y + 8}" x2="${x + w - 6}" y2="${y + 8}" stroke="#555" stroke-width="3"/>`; for (let i = 0; i < 5; i++) s += `<path d="M${x + 16 + i * ((w - 40) / 4)} ${y + 8} l-10 8 v36 h20 v-36z" fill="${chon(["#e65a4f", "#4a86d6", "#f2b632", "#4aa36c", "#fff"])}"/>`; s += `<rect x="${x + 14}" y="${y + h - 58}" width="52" height="52" rx="8" fill="#e4eaee" stroke="#9aa8b2"/><circle cx="${x + 40}" cy="${y + h - 32}" r="17" fill="#6fb6e6" stroke="#fff" stroke-width="3"/>`; }
  return s;
}

function mai(x, w, y, mau) {
  let s = `<path d="M${x - 8} ${y + 24} L${x + 10} ${y} H${x + w - 10} L${x + w + 8} ${y + 24} Z" fill="${mau}"/><rect x="${x - 8}" y="${y + 22}" width="${w + 16}" height="8" fill="#0000002e"/>`;
  return s;
}

function manChe(x, w, y, mau1, mau2) {
  const n = Math.floor(w / 26);
  let s = "";
  for (let i = 0; i < n; i++) s += `<path d="M${x + i * (w / n)} ${y} h${w / n} v34 q-${w / n / 2} 14 -${w / n} 0z" fill="${i % 2 ? mau2 : mau1}"/>`;
  return s + `<rect x="${x}" y="${y - 6}" width="${w}" height="8" fill="#00000026"/>`;
}

function cuaHang(kind, x, w, dem, tenTuyChon, ct = CUA_HANG[kind]) {
  const top = 372, kinh = dem.kinh;
  const wx = x + 16, wy = top + 150, ww = w - 32 - 54, wh = 150;
  const ten = tenTuyChon || ct.ten;
  const size = Math.min(26, (w - 40) / (ten.length * 0.58));
  return `<g class="ph-lang bam" data-ten="${ten}" tabindex="0" role="button" aria-label="${ten} (sắp mở cửa)">
    <rect x="${x}" y="${top}" width="${w}" height="${DAT - top}" fill="${ct.mau}"/><rect x="${x + w - 18}" y="${top}" width="18" height="${DAT - top}" fill="#00000014"/>
    ${mai(x, w, top - 26, ct.mai)}
    <rect x="${x + 12}" y="${top + 14}" width="${w - 24}" height="48" rx="9" fill="${ct.bien}"/><rect x="${x + 12}" y="${top + 14}" width="${w - 24}" height="48" rx="9" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>
    <text x="${x + w / 2}" y="${top + 47}" text-anchor="middle" ${F} font-weight="800" font-size="${size.toFixed(0)}" fill="#fff">${ten}</text>
    ${manChe(x + 4, w - 8, top + 82, ct.bien, "#fff")}
    <rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="6" fill="${kinh}"/>${dem.toi ? `<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="6" fill="#ffcf70" opacity="${0.35 + dem.toi * 0.4}"/>` : ""}
    <g>${noiThat(kind, wx, wy, ww, wh)}</g>
    <rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="6" fill="url(#ph-kinh)"/><rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="6" fill="none" stroke="#6b4a33" stroke-width="5"/>
    <rect x="${x + w - 62}" y="${top + 168}" width="44" height="${DAT - top - 168}" rx="4" fill="#7b4f31"/><rect x="${x + w - 56}" y="${top + 176}" width="32" height="${DAT - top - 190}" fill="${kinh}" opacity=".85"/><circle cx="${x + w - 26}" cy="${DAT - 52}" r="3" fill="#ffd66b"/>
    ${kind === "toc" ? `<rect x="${x + w - 80}" y="${top + 120}" width="12" height="90" rx="6" fill="url(#ph-cot-toc)"/>` : ""}
    ${kind === "banhmi" ? `<g class="ph-khoi"><circle cx="${x + 60}" cy="${top + 120}" r="9" fill="#fff" opacity=".0"/><circle class="k1" cx="${x + 60}" cy="${top + 130}" r="8" fill="#fff"/><circle class="k2" cx="${x + 80}" cy="${top + 130}" r="7" fill="#fff"/><circle class="k3" cx="${x + 100}" cy="${top + 130}" r="8" fill="#fff"/></g>` : ""}
  </g>`;
}

/** cửa hàng chính: to hơn, bảng hiệu có bóng đèn nhấp nháy, quầy bartender bên trong */
function phaStore(x, w, dem, ten) {
  const top = 296, wx = x + 18, wy = top + 190, ww = w - 36 - 94, wh = 190;
  const size = Math.min(54, (w - 150) / (ten.length * 0.6));
  let bong = "";
  for (let i = 0; i < 17; i++) bong += `<circle class="ph-bong b${i % 2}" cx="${x + 26 + i * ((w - 52) / 16)}" cy="${top + 28}" r="5" fill="#fff6c8"/><circle class="ph-bong b${(i + 1) % 2}" cx="${x + 26 + i * ((w - 52) / 16)}" cy="${top + 118}" r="5" fill="#fff6c8"/>`;
  let ke = "";
  for (let r = 0; r < 2; r++) { ke += `<rect x="${wx + 8}" y="${wy + 38 + r * 52}" width="${ww - 16}" height="5" fill="#8a5a36"/>`; for (let i = 0; i < 7; i++) { const cx = wx + 18 + i * ((ww - 36) / 6), c = chon(["#ff7a3d", "#f2c230", "#6cc070", "#62a8e8", "#e9759b", "#a779d6"]); ke += `<rect x="${cx - 7}" y="${wy + 14 + r * 52}" width="14" height="24" rx="4" fill="${c}"/><rect x="${cx - 3}" y="${wy + 8 + r * 52}" width="6" height="8" fill="#e8e0d0"/>`; } }
  const ly = (cx, c) => `<path d="M${cx - 8} ${wy + wh - 62} h16 l-2 24 h-12z" fill="#fff" opacity=".8"/><rect x="${cx - 6}" y="${wy + wh - 52}" width="12" height="12" fill="${c}" opacity=".8"/>`;
  return `<g id="ph-pha" class="ph-pha bam" tabindex="0" role="button" aria-label="Vào ${ten}">
    <rect x="${x - 6}" y="${top - 8}" width="${w + 12}" height="${DAT - top + 8}" fill="url(#ph-bong-pha)" opacity=".0"/>
    <rect x="${x}" y="${top}" width="${w}" height="${DAT - top}" fill="#fff2e1"/><rect x="${x + w - 22}" y="${top}" width="22" height="${DAT - top}" fill="#00000014"/><rect x="${x}" y="${top}" width="14" height="${DAT - top}" fill="#ff7a3d" opacity=".9"/>
    ${mai(x, w, top - 40, "#c9501a")}
    <rect x="${x + 14}" y="${top + 6}" width="${w - 28}" height="124" rx="16" fill="url(#ph-bien-pha)"/><rect x="${x + 14}" y="${top + 6}" width="${w - 28}" height="124" rx="16" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="3"/>
    ${bong}
    <g class="ph-bien-sang"><text x="${x + w / 2 + 38}" y="${top + 86}" text-anchor="middle" ${F} font-weight="900" font-size="${size.toFixed(0)}" fill="#fff" stroke="#b9400f" stroke-width="2" paint-order="stroke">${ten}</text>
    <g transform="translate(${x + 60} ${top + 70})"><path d="M-22 -34 H22 L16 22 Q15 30 8 30 H-8 Q-15 30 -16 22Z" fill="#fff"/><path d="M-19 -22 H19 L16 8 H-16Z" fill="#ffb347"/><rect x="2" y="-52" width="5" height="26" rx="2.5" fill="#fff" transform="rotate(12)"/><circle cx="-6" cy="-6" r="5" fill="#fff" opacity=".7"/></g></g>
    ${manChe(x + 6, w - 12, top + 142, "#ff7a3d", "#fff")}
    <rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="8" fill="${dem.kinh}"/>${dem.toi ? `<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="8" fill="#ffcf70" opacity="${0.4 + dem.toi * 0.4}"/>` : `<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="8" fill="#ffe9c0" opacity=".5"/>`}
    ${ke}
    <rect x="${wx}" y="${wy + wh - 40}" width="${ww}" height="40" fill="#b97a48"/><rect x="${wx}" y="${wy + wh - 42}" width="${ww}" height="6" fill="#d9a06a"/>${ly(wx + 36, "#ffb347")}${ly(wx + ww - 40, "#7bd08a")}
    <g class="ph-pha-che" transform="translate(${wx + ww / 2} ${wy + wh - 42})"><ellipse cx="0" cy="0" rx="22" ry="4" fill="#0003"/><rect x="-14" y="-64" width="28" height="42" rx="12" fill="#fff"/><rect x="-14" y="-40" width="28" height="18" fill="#ff7a3d"/><circle cx="0" cy="-78" r="12" fill="#f2c9a0"/><path d="M-12 -80 a12 12 0 0 1 24 0z" fill="#3b2a20"/><rect x="-13" y="-92" width="26" height="9" rx="3" fill="#fff"/>
      <g class="ph-lac-binh"><rect x="12" y="-76" width="14" height="30" rx="5" fill="#cfd6dc" stroke="#8a949c"/><rect x="14" y="-82" width="10" height="8" rx="2" fill="#aab4bc"/></g></g>
    <rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="8" fill="url(#ph-kinh)"/><rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="8" fill="none" stroke="#7a4a2a" stroke-width="6"/>
    <g class="ph-mo-cua"><rect x="${wx}" y="${wy + wh + 14}" width="0" height="0"/><rect x="${x + w - 112}" y="${top + 174}" width="84" height="22" rx="11" fill="#1a1a2e"/><text x="${x + w - 70}" y="${top + 190}" text-anchor="middle" ${F} font-weight="800" font-size="15" fill="#5dffb0">MỞ CỬA</text></g>
    <rect x="${x + w - 104}" y="${top + 206}" width="76" height="${DAT - top - 206}" rx="6" fill="#8a5632"/><rect x="${x + w - 96}" y="${top + 216}" width="60" height="${DAT - top - 232}" rx="4" fill="${dem.kinh}"/><rect x="${x + w - 96}" y="${top + 216}" width="60" height="${DAT - top - 232}" rx="4" fill="url(#ph-kinh)"/><circle cx="${x + w - 44}" cy="${DAT - 68}" r="4" fill="#ffd66b"/>
    <g class="ph-goi-y"><g transform="translate(${x + w / 2} ${top - 76})"><rect x="-92" y="-34" width="184" height="42" rx="21" fill="#fff" stroke="#ff7a3d" stroke-width="3"/><path d="M-12 8 L0 24 L12 8Z" fill="#fff" stroke="#ff7a3d" stroke-width="3" stroke-linejoin="round"/><rect x="-14" y="2" width="28" height="9" fill="#fff"/><text x="0" y="-6" text-anchor="middle" ${F} font-weight="800" font-size="19" fill="#c9501a">Chạm để vào!</text></g></g>
  </g>`;
}

function cay(x, y, k, dem) {
  const l1 = dem.toi ? "#2c6b45" : "#3f9a5c", l2 = dem.toi ? "#245a3a" : "#2f7f49", l3 = dem.toi ? "#337a50" : "#58b672";
  return `<g class="ph-cay" transform="translate(${x} ${y}) scale(${k})"><ellipse cx="0" cy="2" rx="40" ry="8" fill="#0003"/><path d="M-9 0 Q-6 -60 -4 -120 H6 Q8 -60 11 0Z" fill="#7a5233"/><g class="ph-tan"><circle cx="-34" cy="-128" r="44" fill="${l2}"/><circle cx="34" cy="-132" r="46" fill="${l2}"/><circle cx="0" cy="-170" r="54" fill="${l1}"/><circle cx="-14" cy="-120" r="48" fill="${l1}"/><circle cx="22" cy="-176" r="30" fill="${l3}"/><circle cx="-28" cy="-150" r="24" fill="${l3}"/></g></g>`;
}

function den(x, dem) {
  return `<g><path d="M${x - 5} 700 V560 q0 -16 16 -16 h30" fill="none" stroke="#38404c" stroke-width="7" stroke-linecap="round"/><rect x="${x + 36}" y="540" width="26" height="12" rx="6" fill="#38404c"/>
    <ellipse cx="${x + 50}" cy="556" rx="${dem.toi ? 90 : 0}" ry="${dem.toi ? 110 : 0}" fill="url(#ph-anh-den)" opacity="${dem.toi ? 1 : 0}"/><circle cx="${x + 49}" cy="555" r="6" fill="${dem.toi ? "#fff3c0" : "#d7d7d7"}"/></g>`;
}

const NGUOI_AO = ["#e65a4f", "#4a86d6", "#f2b632", "#4aa36c", "#ef8aa0", "#8e6bd6", "#2fb5b0", "#f08a3a"];
const NGUOI_QUAN = ["#2e3a4c", "#3a3f55", "#4a3b32", "#2b4a3d", "#55435e"];
function nguoi(ao, quan, mu) {
  const toc = chon(["#2b2118", "#3a2a1c", "#1d1a1a", "#5a3b22"]);
  return `<g class="ph-nguoi"><ellipse cx="0" cy="0" rx="15" ry="4" fill="#0003"/>
    <line class="chan a" x1="-4" y1="-30" x2="-4" y2="-2" stroke="${quan}" stroke-width="8" stroke-linecap="round"/><line class="chan b" x1="5" y1="-30" x2="5" y2="-2" stroke="${quan}" stroke-width="8" stroke-linecap="round"/>
    <rect x="-12" y="-56" width="24" height="30" rx="10" fill="${ao}"/><circle cx="0" cy="-66" r="9.5" fill="#f2c9a0"/>
    ${mu ? `<path d="M-14 -68 H14 L10 -77 H-10Z" fill="${chon(["#f2c230", "#fff", "#e65a4f"])}"/><rect x="-5" y="-72" width="22" height="4" rx="2" fill="#0002"/>` : `<path d="M-9.5 -67 a9.5 9.5 0 0 1 19 0 q-9 -5 -19 0z" fill="${toc}"/>`}</g>`;
}
function nguoiDi(y, k, huong, giay, tre, mu) {
  const ao = chon(NGUOI_AO), quan = chon(NGUOI_QUAN);
  return `<g class="ph-di ${huong > 0 ? "phai" : "trai"}" style="animation-duration:${giay}s;animation-delay:-${tre}s"><g class="bam ph-nguoi-bam" role="button" tabindex="0" aria-label="Người qua đường" transform="translate(0 ${y}) scale(${huong * k} ${k})"><g class="ph-bob">${nguoi(ao, quan, mu)}</g></g></g>`;
}

function xeMay(mau, ao) {
  return `<g><ellipse cx="46" cy="2" rx="52" ry="5" fill="#0003"/>
    <circle cx="16" cy="-15" r="14" fill="#222" stroke="#999" stroke-width="3"/><circle cx="76" cy="-15" r="14" fill="#222" stroke="#999" stroke-width="3"/>
    <path d="M16 -15 L36 -34 H62 L76 -15 L66 -34 L58 -48 H48 L44 -34Z" fill="${mau}"/><path d="M54 -48 L62 -52 H74 L70 -44Z" fill="#333"/><rect x="26" y="-38" width="30" height="8" rx="4" fill="#222"/>
    <rect x="30" y="-62" width="22" height="28" rx="9" fill="${ao}"/><circle cx="42" cy="-72" r="9" fill="#f2c9a0"/><path d="M32 -74 a10 10 0 0 1 20 0 v3 h-20z" fill="${chon(["#f2c230", "#e65a4f", "#fff", "#2e3a4c"])}"/>
    <path class="ph-den-xe" d="M84 -36 l56 -10 v34z" fill="url(#ph-chum-den)"/></g>`;
}
function oTo(mau) {
  return `<g><ellipse cx="80" cy="2" rx="86" ry="6" fill="#0003"/>
    <path d="M4 -16 Q4 -36 24 -38 L44 -60 Q50 -66 60 -66 H100 Q110 -66 116 -58 L132 -38 Q154 -36 156 -16 Z" fill="${mau}"/>
    <path d="M52 -58 H70 V-40 H40Z M78 -58 H100 Q106 -58 110 -52 L120 -40 H78Z" fill="#cfe9f7" opacity=".9"/>
    <circle cx="36" cy="-12" r="15" fill="#222" stroke="#aaa" stroke-width="4"/><circle cx="124" cy="-12" r="15" fill="#222" stroke="#aaa" stroke-width="4"/>
    <rect x="148" y="-30" width="9" height="8" rx="3" fill="#fff3b0"/><path class="ph-den-xe" d="M158 -28 l70 -14 v46z" fill="url(#ph-chum-den)"/></g>`;
}
function xe(y, k, huong, giay, tre, loai) {
  const may = loai === "may";
  const mau = chon(["#e65a4f", "#2f6fd6", "#f2b632", "#2fa86f", "#8e6bd6", "#222", "#ff7a3d"]);
  return `<g class="ph-di ${huong > 0 ? "phai" : "trai"}" style="animation-duration:${giay}s;animation-delay:-${tre}s"><g transform="translate(0 ${y}) scale(${huong * k} ${k})"><g class="ph-rung">${may ? xeMay(mau, chon(NGUOI_AO)) : oTo(mau)}</g></g></g>`;
}

/** Trả về chuỗi HTML của khung cảnh (đã có SVG). */
export function canhPho(tenCuaHang = "Pha Store", gio = gioHienTai()) {
  hat = 7;
  const pha = phaTrongNgay(gio), dem = BANG_MAU[pha];
  const t = dem.troi;
  const defs = `<defs>
    <linearGradient id="ph-troi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t[0]}"/><stop offset=".6" stop-color="${t[1]}"/><stop offset="1" stop-color="${t[2]}"/></linearGradient>
    <radialGradient id="ph-anh-mat"><stop offset="0" stop-color="#fff6c4" stop-opacity=".9"/><stop offset="1" stop-color="#fff6c4" stop-opacity="0"/></radialGradient>
    <radialGradient id="ph-anh-trang"><stop offset="0" stop-color="#e8eeff" stop-opacity=".55"/><stop offset="1" stop-color="#e8eeff" stop-opacity="0"/></radialGradient>
    <radialGradient id="ph-anh-den"><stop offset="0" stop-color="#ffe3a0" stop-opacity=".75"/><stop offset="1" stop-color="#ffe3a0" stop-opacity="0"/></radialGradient>
    <linearGradient id="ph-bien-pha" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a4d"/><stop offset="1" stop-color="#ff6a26"/></linearGradient>
    <linearGradient id="ph-kinh" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".35" stop-color="#fff" stop-opacity=".05"/><stop offset=".6" stop-color="#fff" stop-opacity=".0"/><stop offset="1" stop-color="#fff" stop-opacity=".25"/></linearGradient>
    <linearGradient id="ph-chum-den" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff6c0" stop-opacity="${dem.toi ? 0.7 : 0}"/><stop offset="1" stop-color="#fff6c0" stop-opacity="0"/></linearGradient>
    <pattern id="ph-cot-toc" width="12" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><rect width="12" height="8" fill="#e63946"/><rect y="8" width="12" height="8" fill="#fff"/><rect y="16" width="12" height="8" fill="#3b6fb6"/><animateTransform attributeName="patternTransform" type="translate" values="0 0;0 24" dur="1.4s" repeatCount="indefinite" additive="sum"/></pattern>
  </defs>`;

  // vỉa hè sau, bó vỉa, lòng đường, vỉa hè trước
  let nen = `<rect x="0" y="${DAT}" width="${W}" height="96" fill="${dem.via}"/>`;
  for (let i = 0; i < 46; i++) nen += `<path d="M${i * 40} ${DAT} v96" stroke="#00000014" stroke-width="2"/>`;
  nen += `<rect x="0" y="${DAT + 80}" width="${W}" height="14" fill="#00000024"/><rect x="0" y="${DAT + 94}" width="${W}" height="16" fill="#e1dacd" opacity="${dem.toi ? 0.6 : 1}"/>`;
  nen += `<rect x="0" y="${DAT + 110}" width="${W}" height="150" fill="${dem.duong}"/>`;
  for (let i = 0; i < 24; i++) nen += `<rect x="${i * 80 + 8}" y="${DAT + 178}" width="46" height="6" rx="3" fill="#f4f1d8" opacity=".85"/>`;
  nen += `<rect x="0" y="${DAT + 260}" width="${W}" height="18" fill="#e1dacd" opacity="${dem.toi ? 0.6 : 1}"/><rect x="0" y="${DAT + 278}" width="${W}" height="${H - DAT - 278}" fill="${dem.via}"/>`;
  for (let i = 0; i < 46; i++) nen += `<path d="M${i * 40 + 12} ${DAT + 278} l-14 ${H - DAT - 278}" stroke="#00000012" stroke-width="2"/>`;

  // các cửa hàng (hai bên cửa hàng chính)
  const PX = 720, PW = 360;
  let shop = "";
  shop += cuaHang("ta", 36, 220, dem) + cuaHang("banhmi", 276, 200, dem) + cuaHang("toc", 496, 200, dem);
  shop += cuaHang("sach", 1104, 200, dem) + cuaHang("hoa", 1324, 200, dem) + cuaHang("giat", 1544, 220, dem);
  shop += phaStore(PX, PW, dem, tenCuaHang);

  // cây + đèn đường (đèn đường sáng khi tối)
  let cayDen = "";
  for (const x of [262, 482, 706, 1092, 1312, 1532, 1780]) cayDen += cay(x, DAT + 78, x === 706 || x === 1092 ? 0.95 : 0.85, dem);
  for (const x of [150, 640, 1190, 1640]) cayDen += den(x, dem);
  // chậu hoa trước cửa hàng chính
  const chau = (x) => `<g><rect x="${x - 18}" y="${DAT + 56}" width="36" height="28" rx="6" fill="#b0643a"/><circle cx="${x - 10}" cy="${DAT + 40}" r="16" fill="#3f9a5c"/><circle cx="${x + 10}" cy="${DAT + 38}" r="18" fill="#58b672"/><circle cx="${x}" cy="${DAT + 26}" r="14" fill="#ff7aa0"/><circle cx="${x + 14}" cy="${DAT + 32}" r="7" fill="#ffd23f"/></g>`;
  const dc = chau(PX - 8) + chau(PX + PW + 8);

  // người đi bộ (vỉa hè sau nhỏ, vỉa hè trước to hơn), xe qua lại
  let di = "";
  [[56, 52, 3], [60, 44, 17], [50, 62, 29], [64, 48, 38], [54, 70, 8]].forEach(([g, k, tre], i) => (di += nguoiDi(DAT + 70, 0.95, i % 2 ? -1 : 1, g + 14, tre, i === 2)));
  [[68, 33, 5, true], [58, 20, 21, false], [74, 45, 11, false]].forEach(([g, tre, ph, mu], i) => (di += nguoiDi(H - 22, 1.5, i % 2 ? 1 : -1, g + 14, tre + ph, mu)));
  let xeCo = "";
  [["may", 22, 3], ["oto", 30, 9], ["may", 19, 15], ["may", 26, 21]].forEach(([l, g, tre]) => (xeCo += xe(DAT + 162, 0.95, -1, g, tre, l)));
  [["may", 17, 6], ["oto", 27, 14], ["may", 21, 2], ["may", 15, 18]].forEach(([l, g, tre]) => (xeCo += xe(DAT + 242, 1.12, 1, g, tre, l)));

  // tối: phủ nhẹ màu xanh cho không khí, đèn sáng quanh cửa hàng chính
  const phu = dem.toi ? `<rect width="${W}" height="${H}" fill="#0a1030" opacity="${(dem.toi * 0.35).toFixed(2)}" style="pointer-events:none"/>` : "";
  const anhPha = `<ellipse cx="${PX + PW / 2}" cy="${DAT + 40}" rx="300" ry="90" fill="url(#ph-anh-den)" opacity="${dem.toi ? 0.8 : 0.25}" style="pointer-events:none"/>`;
  const co = (x1, x2, y) => { let s = `<path d="M${x1} ${y} Q${(x1 + x2) / 2} ${y + 44} ${x2} ${y}" fill="none" stroke="#5a4636" stroke-width="2"/>`; const n = 11; for (let i = 0; i < n; i++) { const tt = (i + 0.5) / n, px = x1 + (x2 - x1) * tt, py = y + 44 * 2 * tt * (1 - tt) * 1 - 0; s += `<path class="ph-co" style="animation-delay:${(i * 0.17).toFixed(2)}s" d="M${px - 11} ${py} h22 l-11 24z" fill="${["#ff7a3d", "#fff", "#ffd23f", "#6cc070", "#62a8e8"][i % 5]}"/>`; } return s; };

  return `<div class="ph-khung" id="ph-khung" data-pha="${pha}" style="background:linear-gradient(${t[0]} 50%,${dem.via} 50%)"><div class="ph-cuon" id="ph-cuon"><div class="ph-canh" id="ph-canh">
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" role="img" aria-label="Khu phố có cửa hàng ${tenCuaHang}" xmlns="http://www.w3.org/2000/svg">
      ${defs}${bauTroi(pha)}${nen}${shop}${co(PX - 40, PX + PW + 40, 262)}${cayDen}${dc}${xeCo}${anhPha}${di}${phu}
    </svg></div></div></div>`;
}

/** Gắn sự kiện. vao(): vào màn chào. noi(text): hiện thông báo nhỏ. Trả hàm dọn dẹp. */
export function ganPho(goc, { vao, noi = () => {}, cham = () => {} }) {
  const cuon = goc.querySelector("#ph-cuon"), khung = goc.querySelector("#ph-khung");
  const giua0 = () => { cuon.scrollLeft = (cuon.scrollWidth - cuon.clientWidth) / 2; };
  giua0(); requestAnimationFrame(giua0);
  let dangVao = false;
  const vaoQuan = () => {
    if (dangVao) return; dangVao = true; cham();
    khung.classList.add("vao"); setTimeout(vao, 650);
  };
  const pha = goc.querySelector("#ph-pha");
  pha.onclick = vaoQuan;
  pha.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); vaoQuan(); } };
  const CAU = ["Chào bạn! Pha Store mở cửa rồi kìa.", "Nghe nói trong đó có chỗ học pha chế vui lắm!", "Hôm nay trời đẹp, đi uống gì đó thôi.", "Ghé Pha Store thử pha một ly nhé!", "Ơ, bạn mới đến phố này hả?", "Quán cam cam kia là Pha Store đó."];
  let i = 0;
  goc.querySelectorAll(".ph-nguoi-bam").forEach((n) => { n.onclick = () => { cham(); noi(CAU[i++ % CAU.length]); }; });
  goc.querySelectorAll(".ph-lang").forEach((n) => {
    const hoi = () => { cham(); noi(`${n.dataset.ten} chưa mở cửa. Ghé Pha Store trước nhé!`); };
    n.onclick = hoi; n.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); hoi(); } };
  });
  // kéo bằng chuột để cuộn ngang (máy tính); điện thoại tự vuốt
  let x0 = null, s0 = 0, keo = false;
  cuon.addEventListener("pointerdown", (e) => { if (e.pointerType === "mouse") { x0 = e.clientX; s0 = cuon.scrollLeft; keo = false; } });
  window.addEventListener("pointermove", mv);
  window.addEventListener("pointerup", up);
  function mv(e) { if (x0 == null) return; const d = e.clientX - x0; if (Math.abs(d) > 5) keo = true; cuon.scrollLeft = s0 - d; }
  function up() { x0 = null; }
  cuon.addEventListener("click", (e) => { if (keo) { e.stopPropagation(); e.preventDefault(); keo = false; } }, true);
  return () => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); };
}
