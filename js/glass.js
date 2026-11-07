// Vẽ ly bằng SVG từ màu nguyên liệu theo thứ tự rót. Không biết món nào cả.
// Thực tế hơn: miệng ly elip, mặt nước có độ cong + gợn sóng, bọt khí, hơi nước ngưng ngoài thành ly,
// vệt phản chiếu, và "xem trước" lớp đang rót để ly đầy lên theo tay người chơi.

const W = 200, H = 300, TOP = 36, BOT = 272;
const D_TREN = 30, D_DUOI = 52;
const NS = "http://www.w3.org/2000/svg";

function hex(c) {
  const m = /^#?([0-9a-f]{6})$/i.exec(c);
  const n = parseInt(m ? m[1] : "d9c7a3", 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const toHex = ([r, g, b]) => "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
const sang = (c, k) => toHex(hex(c).map((v) => v + (255 - v) * k));
const toi = (c, k) => toHex(hex(c).map((v) => v * (1 - k)));
// nửa bề rộng thân ly tại độ cao y
const nuaRong = (y) => 100 - (D_TREN + (D_DUOI - D_TREN) * Math.max(0, Math.min(1, (y - TOP) / (BOT - TOP))));
export { nuaRong };
export const KICH_THUOC_LY = { W, H, TOP, BOT };
// số giả ngẫu nhiên cố định (để vị trí bọt/giọt không nhảy mỗi lần vẽ)
const ngauNhien = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export class Ly {
  constructor(svg, dungTichMl) {
    this.svg = svg;
    this.dungTich = dungTichMl;
    this.lop = []; // {nl, mau, duc, dang, ml}
    this.daTron = false;
    this.phanTang = false;
    this.truoc = null; // lớp đang rót, chưa cho vào ly
    this.coBot = false; // lớp bọt (sau khi đánh bọt)
    this.hienVach = true; // vạch chia ml (tắt khi trình bày ly thành phẩm)
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    this.ve();
  }

  them(nl, luong) {
    this.truoc = null;
    const ml = nl.dang === "ran" ? luong * 1.0 : nl.dang === "bot" ? luong * 0.15 : nl.dang === "dem" ? luong * 4 : luong;
    this.lop.push({ nl: nl.id, mau: nl.mau_hien_thi, duc: nl.do_trong_duc, dang: nl.dang, ml });
    this.daTron = false;
    this.ve();
  }

  /** Cho người chơi thấy ly đầy lên khi đang giữ nút rót (chưa tính vào kết quả). nl = null để xoá. */
  xemTruoc(nl, luong) {
    this.truoc = nl && luong > 0 ? { nl: nl.id, mau: nl.mau_hien_thi, duc: nl.do_trong_duc, dang: nl.dang,
      ml: nl.dang === "ran" ? luong : nl.dang === "bot" ? luong * 0.15 : nl.dang === "dem" ? luong * 4 : luong } : null;
    this.ve();
  }

  tron() { if (!this.phanTang) this.daTron = true; this.ve(); }
  lamLai() { this.lop = []; this.truoc = null; this.daTron = false; this.coBot = false; this.ve(); }
  dapBot() { this.coBot = true; this.ve(); }
  tongMl() { return this.lop.reduce((s, l) => s + l.ml, 0); }

  /** độ cao mặt nước (toạ độ SVG) và màu lớp trên cùng, dùng để đặt dòng rót */
  matNuoc() {
    const ml = Math.min(this.tongMl() + (this.truoc?.ml || 0), this.dungTich * 1.1);
    return BOT - (ml * (BOT - TOP)) / this.dungTich;
  }

  mauTron() {
    const long = this.lop.filter((l) => l.dang === "long" || l.dang === "bot");
    if (!long.length) return "#e8f6fb";
    const tong = long.reduce((s, l) => s + l.ml * l.duc + 0.001, 0);
    const rgb = [0, 0, 0];
    for (const l of long) { const c = hex(l.mau), w = (l.ml * l.duc + 0.001) / tong; for (let i = 0; i < 3; i++) rgb[i] += c[i] * w; }
    return toHex(rgb);
  }

  ve() {
    const s = this.svg;
    s.replaceChildren();
    const el = (tag, at, parent = s) => {
      const e = document.createElementNS(NS, tag);
      for (const k in at) e.setAttribute(k, at[k]);
      parent.appendChild(e);
      return e;
    };
    const duong = `M${D_TREN} ${TOP} L${W - D_TREN} ${TOP} L${W - D_DUOI} ${BOT} Q${W / 2} ${BOT + 14} ${D_DUOI} ${BOT} Z`;
    const defs = el("defs", {});
    el("path", { d: duong }, el("clipPath", { id: "kep-ly" }, defs));
    const gk = el("linearGradient", { id: "ly-kinh", x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
    [[0, "#fff", 0.55], [0.18, "#fff", 0.08], [0.82, "#fff", 0.05], [1, "#fff", 0.45]].forEach(([o, c, a]) => el("stop", { offset: o, "stop-color": c, "stop-opacity": a }, gk));
    const gd = el("radialGradient", { id: "ly-bong", cx: 0.5, cy: 0.5, r: 0.5 }, defs);
    el("stop", { offset: 0, "stop-color": "#000", "stop-opacity": 0.28 }, gd);
    el("stop", { offset: 1, "stop-color": "#000", "stop-opacity": 0 }, gd);

    // bóng đổ dưới đáy
    el("ellipse", { cx: W / 2, cy: BOT + 16, rx: 78, ry: 9, fill: "url(#ly-bong)" });
    const g = el("g", { "clip-path": "url(#kep-ly)" });
    el("rect", { x: 0, y: TOP, width: W, height: BOT - TOP + 20, fill: "#eaf6fa", opacity: 0.18 }, g);

    const cao = BOT - TOP, scale = cao / this.dungTich;
    let y = BOT;
    const veKhoi = (ml, mau, duc, dang, laDinh = false, xemTruoc = false) => {
      const h = Math.max(0, ml * scale);
      if (h <= 0) return;
      const yDay = y;
      y -= h;
      if (dang === "ran") {
        el("rect", { x: 0, y, width: W, height: h, fill: mau, opacity: 0.35 }, g);
        for (let r = 0; r * 22 < h + 22; r++) for (let c = 0; c < 6; c++) {
          const k = r * 6 + c;
          const px = c * 34 + (r % 2 ? 16 : 0) + 2 + ngauNhien(k) * 4, py = y + h - (r + 1) * 22 + 2 + ngauNhien(k + 9) * 3;
          if (py + 20 > y - 8) {
            const kh = el("g", { transform: `rotate(${(ngauNhien(k + 3) - 0.5) * 14} ${px + 13} ${py + 9})` }, g);
            el("rect", { x: px, y: py, width: 27, height: 19, rx: 5, fill: "#fff", opacity: 0.6, stroke: "#bfe6f3", "stroke-width": 1.2 }, kh);
            el("path", { d: `M${px + 4} ${py + 5} L${px + 12} ${py + 4}`, stroke: "#fff", "stroke-width": 2, opacity: 0.9, "stroke-linecap": "round" }, kh);
          }
        }
      } else if (dang === "dem") {
        for (let k = 0; k < Math.min(12, Math.ceil(ml / 6)); k++)
          el("rect", { x: 60 + (k * 37) % 90, y: yDay - 14 - ((k * 23) % Math.max(h - 10, 1)), width: 15, height: 15, rx: 4, fill: mau, stroke: "#0002" }, g);
      } else {
        const op = Math.min(1, 0.35 + duc * 0.65) * (xemTruoc ? 0.9 : 1);
        el("rect", { x: 0, y, width: W, height: h, fill: mau, opacity: op }, g);
        // bóng tối ở đáy lớp + mặt nước sáng hơn
        el("rect", { x: 0, y: yDay - Math.min(10, h), width: W, height: Math.min(10, h), fill: toi(mau, 0.25), opacity: 0.35 }, g);
        if (laDinh) {
          const rx = nuaRong(y) - 2;
          el("ellipse", { cx: W / 2, cy: y, rx, ry: 6.5, fill: sang(mau, 0.35), opacity: Math.min(1, op + 0.1), class: xemTruoc ? "song" : "" }, g);
          el("ellipse", { cx: W / 2 - rx * 0.25, cy: y - 1, rx: rx * 0.45, ry: 1.6, fill: "#fff", opacity: 0.55 }, g);
        } else {
          el("line", { x1: 0, x2: W, y1: y, y2: y, stroke: toi(mau, 0.22), "stroke-width": 1, opacity: 0.35 }, g);
        }
      }
    };

    const phanLong = (ml) => ml; // tên cho dễ đọc
    const dsLop = [...this.lop];
    const coTruoc = !!this.truoc;
    if (this.daTron && !coTruoc && this.tongMl() > 0) {
      const da = this.lop.filter((l) => l.dang === "ran").reduce((a, l) => a + l.ml, 0);
      const dem = this.lop.filter((l) => l.dang === "dem");
      const lg = this.lop.filter((l) => l.dang === "long" || l.dang === "bot").reduce((a, l) => a + l.ml, 0);
      veKhoi(phanLong(lg), this.mauTron(), 1, "long", !da && !dem.length);
      if (da) veKhoi(da, "#e8f6fb", 0.5, "ran");
      for (const d of dem) veKhoi(d.ml, d.mau, d.duc, "dem", false);
    } else {
      dsLop.forEach((l, i) => veKhoi(l.ml, l.mau, l.duc, l.dang, !coTruoc && i === dsLop.length - 1 && l.dang !== "ran" && l.dang !== "dem"));
      if (this.truoc) veKhoi(this.truoc.ml, this.truoc.mau, this.truoc.duc, this.truoc.dang, this.truoc.dang !== "ran" && this.truoc.dang !== "dem", true);
    }
    // lớp bọt trên mặt (sau khi đánh bọt)
    if (this.coBot && y < BOT - 6) {
      const rx = nuaRong(y) - 3;
      for (let k = 0; k < 16; k++) {
        const bx = W / 2 + (ngauNhien(k + 120) * 2 - 1) * rx * 0.92;
        el("circle", { cx: bx, cy: y - 1 + ngauNhien(k + 130) * 5, r: 4 + ngauNhien(k + 140) * 5.5, fill: "#fffaf0", stroke: "#ecdcc0", "stroke-width": 0.8, opacity: 0.95 }, g);
      }
      el("ellipse", { cx: W / 2, cy: y + 2, rx, ry: 4, fill: "#fffaf0", opacity: 0.9 }, g);
    }
    // chiều sâu chất lỏng: đáy ly đậm hơn, gần mặt nước sáng hơn (cho cảm giác có khối)
    if (y < BOT - 4) {
      const gs = el("linearGradient", { id: "ly-sau", x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      el("stop", { offset: 0, "stop-color": "#fff", "stop-opacity": 0.14 }, gs);
      el("stop", { offset: 0.5, "stop-color": "#000", "stop-opacity": 0 }, gs);
      el("stop", { offset: 1, "stop-color": "#000", "stop-opacity": 0.2 }, gs);
      el("rect", { x: 0, y, width: W, height: BOT - y + 20, fill: "url(#ly-sau)" }, g);
    }
    // bọt khí li ti trong nước
    const coNuoc = this.lop.some((l) => l.dang === "long") || (this.truoc && this.truoc.dang === "long");
    if (coNuoc && y < BOT - 10) {
      for (let k = 0; k < 9; k++) {
        const by = y + 14 + ngauNhien(k + 40) * (BOT - y - 24);
        el("circle", { cx: 60 + ngauNhien(k) * 80, cy: by, r: 1 + ngauNhien(k + 7) * 1.6, fill: "#fff", opacity: 0.35 }, g);
      }
    }

    // thành ly: phản chiếu, đáy dày, viền, miệng elip
    el("path", { d: duong, fill: "url(#ly-kinh)" });
    el("path", { d: `M${D_DUOI + 4} ${BOT - 14} Q${W / 2} ${BOT + 6} ${W - D_DUOI - 4} ${BOT - 14} L${W - D_DUOI - 8} ${BOT - 4} Q${W / 2} ${BOT + 12} ${D_DUOI + 8} ${BOT - 4} Z`, fill: "#fff", opacity: 0.4 });
    el("path", { d: duong, fill: "none", stroke: "#7f9fa4", "stroke-width": 2.4, "stroke-linejoin": "round" });
    el("path", { d: `M${D_TREN + 14} ${TOP + 10} L${D_DUOI + 14} ${BOT - 22}`, stroke: "#fff", "stroke-width": 6, "stroke-linecap": "round", opacity: 0.55 });
    el("path", { d: `M${W - D_TREN - 10} ${TOP + 16} L${W - D_DUOI - 8} ${BOT - 40}`, stroke: "#fff", "stroke-width": 2.5, "stroke-linecap": "round", opacity: 0.5 });
    el("ellipse", { cx: W / 2, cy: TOP, rx: nuaRong(TOP), ry: 8.5, fill: "none", stroke: "#7f9fa4", "stroke-width": 2.2 });
    el("ellipse", { cx: W / 2, cy: TOP, rx: nuaRong(TOP) - 3, ry: 6, fill: "#fff", opacity: 0.12 });
    // hơi nước ngưng ngoài thành ly khi có đá
    if (this.lop.some((l) => l.dang === "ran")) {
      for (let k = 0; k < 14; k++) {
        const t = ngauNhien(k + 70), yy = TOP + 30 + t * (BOT - TOP - 60), hw = nuaRong(yy);
        el("ellipse", { cx: W / 2 + (ngauNhien(k + 90) * 2 - 1) * (hw - 8), cy: yy, rx: 1.4 + ngauNhien(k + 5) * 1.2, ry: 2 + ngauNhien(k + 8) * 2.4, fill: "#fff", opacity: 0.5 });
      }
    }
    // vạch ml
    for (let ml = 100; this.hienVach && ml < this.dungTich; ml += 100) {
      const yy = BOT - ml * scale, hw = nuaRong(yy);
      el("line", { x1: W / 2 + hw - 20, x2: W / 2 + hw - 4, y1: yy, y2: yy, stroke: "#5b7378", "stroke-width": 1.4, opacity: 0.55 });
      const t = el("text", { x: W / 2 + hw - 38, y: yy + 3.5, "font-size": 10, fill: "#4f666b", "text-anchor": "end", "font-family": "system-ui,sans-serif" });
      t.textContent = ml;
    }
    if (this.hienVach && this.tongMl() > this.dungTich) {
      el("text", { x: W / 2, y: 18, "text-anchor": "middle", "font-size": 14, fill: "#c0392b", "font-weight": 700 }).textContent = "Tràn ly!";
    }
  }
}
