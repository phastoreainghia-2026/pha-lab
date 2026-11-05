// Âm thanh tổng hợp bằng Web Audio: không cần file, chạy offline, không tăng dung lượng.
// Mỗi loại nguyên liệu/thao tác có một "giọng" riêng:
//   nước: róc rách + bong bóng, cao dần khi ly đầy   | nước nóng: thêm tiếng xì hơi
//   sệt (sữa, siro, đường): ục ục chậm, trầm            | bột: lạo xạo từng hạt
//   đá: cục đá thả "cộp" + lách cách                 | đếm (miếng, trái): "tốc" gỗ nhẹ
//   khuấy: muỗng xoáy, chạm đá thì lách cách         | lắc: đá đập thành shaker kim loại
//   đánh bọt: máy đánh bọt rung ù                    | nếm / rắc / dầm: mỗi thứ một tiếng
// Trình duyệt chỉ cho phát tiếng sau lần chạm đầu tiên => gọi Am.batDau() trong sự kiện chạm.

let ctx = null, tong = null, nhieu = null, ham = null;
let tat = false;
try { tat = localStorage.getItem("phalab.tat_tieng") === "1"; } catch { /* bỏ qua */ }

function khoiTao() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  const nen = ctx.createDynamicsCompressor(); // tránh vỡ tiếng khi nhiều âm chồng nhau
  nen.threshold.value = -16; nen.ratio.value = 5;
  tong = ctx.createGain();
  tong.gain.value = tat ? 0 : 0.85;
  tong.connect(nen); nen.connect(ctx.destination);
  nhieu = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = nhieu.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}
const san = () => {
  const c = khoiTao();
  if (!c) return null;
  if (c.state === "suspended") c.resume();
  return c;
};
const ngau = (a, b) => a + Math.random() * (b - a);

/** một tràng nhiễu lọc, có bao âm; bat = trễ (giây) */
function tiengNhieu(loai, f, q, gain, dai = 0.15, bat = 0, f2 = null) {
  const c = san(); if (!c) return;
  const t = c.currentTime + bat;
  const s = c.createBufferSource(); s.buffer = nhieu; s.loop = true;
  const fl = c.createBiquadFilter(); fl.type = loai; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
  if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dai);
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + Math.min(0.02, dai / 3));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dai);
  s.connect(fl); fl.connect(g); g.connect(tong);
  s.start(t, Math.random()); s.stop(t + dai + 0.05);
}
/** nốt đơn có bao âm; f2 = trượt tần số */
function nhac(f, bat, dai, kieu = "sine", gain = 0.15, f2 = null) {
  const c = san(); if (!c) return;
  const t = c.currentTime + bat;
  const o = c.createOscillator(); o.type = kieu; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dai);
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dai);
  o.connect(g); g.connect(tong); o.start(t); o.stop(t + dai + 0.05);
}
/** bong bóng nổi trong chất lỏng: tiếng "bụp" tần số tăng nhanh */
const bongBong = (f0, gain = 0.07, bat = 0) => nhac(f0, bat, 0.05, "sine", gain, f0 * ngau(1.7, 2.4));
const lachCach = (bat = 0, gain = 0.05) => { nhac(ngau(2800, 4600), bat, 0.06, "triangle", gain); nhac(ngau(1900, 2600), bat + 0.012, 0.05, "sine", gain * 0.7); };

const THONG_SO = {
  nuoc: { loai: "bandpass", f: 1100, q: 0.9, g: 0.2, bb: [55, 110], fb: [320, 720], gb: 0.06 },
  nong: { loai: "bandpass", f: 1500, q: 0.8, g: 0.22, bb: [45, 90], fb: [420, 900], gb: 0.05, xi: true },
  dac:  { loai: "lowpass",  f: 480,  q: 1.1, g: 0.2, bb: [130, 230], fb: [150, 270], gb: 0.12 },
  bot:  { hat: true },
};

export const Am = {
  batDau() { san(); },
  dangTat() { return tat; },
  datTat(v) {
    tat = !!v;
    try { localStorage.setItem("phalab.tat_tieng", tat ? "1" : "0"); } catch { /* bỏ qua */ }
    if (tong) tong.gain.value = tat ? 0 : 0.85;
    if (!tat) this.cham();
  },

  cham() { nhac(900, 0, 0.06, "triangle", 0.09); nhac(1350, 0.015, 0.05, "sine", 0.05); },

  /** Giữ để rót. loai: nuoc | nong | dac | bot. Trả hàm dừng. */
  rot(loai = "nuoc") {
    const c = san(); if (!c) return () => {};
    const th = THONG_SO[loai] || THONG_SO.nuoc;
    const luc = c.currentTime, doi = [];
    const dang = () => 1 + Math.min(0.85, (c.currentTime - luc) * 0.14); // cột nước dâng => cao dần
    let s = null, g = null, fl = null, xi = null;
    if (!th.hat) {
      s = c.createBufferSource(); s.buffer = nhieu; s.loop = true;
      fl = c.createBiquadFilter(); fl.type = th.loai; fl.frequency.value = th.f; fl.Q.value = th.q;
      g = c.createGain(); g.gain.setValueAtTime(0, luc); g.gain.linearRampToValueAtTime(th.g, luc + 0.07);
      s.connect(fl); fl.connect(g); g.connect(tong); s.start();
      doi.push(setInterval(() => { fl.frequency.value = th.f * dang() * ngau(0.9, 1.1); }, 60));
      const bb = () => { bongBong(ngau(th.fb[0], th.fb[1]) * dang(), th.gb); doi.push(setTimeout(bb, ngau(th.bb[0], th.bb[1]))); };
      bb();
      if (th.xi) { // tiếng xì hơi nước nóng
        xi = c.createBufferSource(); xi.buffer = nhieu; xi.loop = true;
        const hf = c.createBiquadFilter(); hf.type = "highpass"; hf.frequency.value = 5500;
        const hg = c.createGain(); hg.gain.value = 0.05;
        xi.connect(hf); hf.connect(hg); hg.connect(tong); xi.start(); xi.hg = hg;
      }
    } else {
      // bột: từng hạt lạo xạo + tiếng rơi nhẹ
      const hat = () => {
        tiengNhieu("highpass", ngau(3500, 6500), 1.5, ngau(0.05, 0.11), ngau(0.02, 0.05));
        if (Math.random() < 0.18) tiengNhieu("lowpass", 700, 1, 0.05, 0.06);
        doi.push(setTimeout(hat, ngau(10, 32)));
      };
      hat();
    }
    return () => {
      doi.forEach((h) => { clearInterval(h); clearTimeout(h); });
      const t = c.currentTime;
      if (g) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + 0.1); s.stop(t + 0.12); }
      if (xi) { xi.hg.gain.setValueAtTime(xi.hg.gain.value, t); xi.hg.gain.linearRampToValueAtTime(0, t + 0.1); xi.stop(t + 0.12); }
      if (th.hat) tiengNhieu("lowpass", 800, 1, 0.07, 0.08);
      else if (loai !== "dac") { bongBong(ngau(500, 800), 0.05); } // giọt cuối
    };
  },

  /** rót ngắn tự dừng (dùng cho hỗn hợp trung gian) */
  rotNgan(loai = "dac", giay = 0.9) { const dung = this.rot(loai); setTimeout(dung, giay * 1000); },

  /** cho vào ly: loai = ran | nuoc | nong | dac | bot | dem */
  chiaVaoLy(loai) {
    if (loai === "ran") return this.da();
    if (loai === "dem") { nhac(520, 0, 0.09, "triangle", 0.2, 380); nhac(240, 0.01, 0.1, "sine", 0.18, 150); return; }
    if (loai === "bot") { tiengNhieu("lowpass", 900, 1, 0.14, 0.1); nhac(180, 0, 0.08, "sine", 0.1, 120); return; }
    tiengNhieu("lowpass", loai === "dac" ? 380 : 700, 1, 0.18, 0.16);
    nhac(loai === "dac" ? 170 : 260, 0, 0.14, "sine", 0.18, loai === "dac" ? 110 : 170);
    if (loai !== "dac") { bongBong(ngau(500, 760), 0.06, 0.05); bongBong(ngau(600, 900), 0.04, 0.09); }
  },

  /** thả đá vào ly: cộp + lách cách */
  da() {
    nhac(130, 0, 0.14, "sine", 0.26, 70);
    tiengNhieu("lowpass", 400, 1, 0.2, 0.08);
    for (let i = 0; i < 7; i++) lachCach(0.02 + i * 0.055 + Math.random() * 0.03, 0.07);
  },

  /** muỗng khuấy một vòng; coDa = trong ly có đá => thỉnh thoảng chạm đá lách cách */
  khuay(coDa = false) {
    tiengNhieu("bandpass", 650, 1.1, 0.12, 0.3, 0, 1500);
    nhac(ngau(1500, 1900), 0.06, 0.05, "triangle", 0.02); // muỗng chạm thành ly
    if (coDa && Math.random() < 0.8) { lachCach(0.05, 0.09); if (Math.random() < 0.5) lachCach(0.13, 0.07); }
  },

  /** giữ nút: lac (shaker) | danh_bot (máy đánh bọt). Trả hàm dừng */
  giu(kieu = "lac") {
    const c = san(); if (!c) return () => {};
    if (kieu === "danh_bot") {
      const o = c.createOscillator(); o.type = "sawtooth"; o.frequency.value = 135;
      const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1100; bp.Q.value = 0.9;
      const g = c.createGain(); g.gain.value = 0.0001;
      const lfo = c.createOscillator(); lfo.frequency.value = 26;
      const lg = c.createGain(); lg.gain.value = 0.05;
      lfo.connect(lg); lg.connect(g.gain);
      o.connect(bp); bp.connect(g); g.connect(tong);
      g.gain.linearRampToValueAtTime(0.1, c.currentTime + 0.15);
      o.start(); lfo.start();
      const bt = setInterval(() => tiengNhieu("highpass", 3000, 1, 0.05, 0.05), 40); // bọt li ti
      return () => { clearInterval(bt); const t = c.currentTime; g.gain.cancelScheduledValues(t); g.gain.linearRampToValueAtTime(0, t + 0.12); o.stop(t + 0.15); lfo.stop(t + 0.15); };
    }
    // lắc shaker: đá va vào thành kim loại, mỗi nhịp một cú thụp rồi lách cách
    let i = 0;
    const nhip = () => {
      tiengNhieu("highpass", 2600, 2, 0.34, 0.07);
      tiengNhieu("bandpass", 4200, 3, 0.2, 0.05, 0.03);
      for (let k = 0; k < 3; k++) lachCach(0.01 + k * 0.025, 0.06);
      if (i++ % 2 === 0) { tiengNhieu("lowpass", 260, 1, 0.3, 0.09); nhac(150, 0, 0.09, "sine", 0.14, 90); }
    };
    nhip();
    const h = setInterval(nhip, 125);
    return () => clearInterval(h);
  },

  /** thao tác chạm: nem | rac | dam | rot_hon_hop (không có = chạm nhẹ) */
  bam(kieu) {
    if (kieu === "nem") { tiengNhieu("bandpass", 1500, 2, 0.12, 0.25, 0, 3000); nhac(420, 0.2, 0.12, "sine", 0.08, 330); return; }
    if (kieu === "rac") { for (let i = 0; i < 12; i++) tiengNhieu("highpass", ngau(4000, 7500), 1.5, 0.08, 0.03, i * 0.03 + Math.random() * 0.02); return; }
    if (kieu === "dam") { for (let i = 0; i < 2; i++) { nhac(95, i * 0.17, 0.14, "sine", 0.28, 60); tiengNhieu("lowpass", 320, 1, 0.22, 0.09, i * 0.17); } return; }
    if (kieu === "rot_hon_hop") return this.rotNgan("dac", 0.9);
    this.cham();
  },

  /** chuông cửa khi khách bước vào */
  chuong() { nhac(1568, 0, 0.5, "sine", 0.16); nhac(2093, 0.16, 0.7, "sine", 0.14); nhac(3136, 0.16, 0.4, "sine", 0.04); },
  /** két tiền "ka-ching" khi khách rất hài lòng */
  kaChing() { tiengNhieu("highpass", 5000, 2, 0.16, 0.06); nhac(1175, 0.02, 0.12, "square", 0.05); nhac(2349, 0.09, 0.9, "sine", 0.18); nhac(3520, 0.09, 0.6, "sine", 0.06); },
  /** tích tắc khi sắp hết giờ */
  tick() { nhac(1000, 0, 0.04, "square", 0.05); },
  /** khách giận bỏ đi */
  khachBoDi() { nhac(330, 0, 0.18, "sawtooth", 0.1, 220); nhac(196, 0.2, 0.3, "sawtooth", 0.09, 130); },

  ting() { nhac(1318, 0, 0.35, "sine", 0.2); nhac(1760, 0.09, 0.5, "sine", 0.16); },
  loi() { nhac(180, 0, 0.22, "sawtooth", 0.1); nhac(140, 0.12, 0.25, "sawtooth", 0.08); tiengNhieu("lowpass", 300, 1, 0.1, 0.2); },
  ketQua(sao) {
    if (sao <= 0) return this.loi();
    [523, 659, 784, 1046].slice(0, sao + 1).forEach((f, i) => { nhac(f, i * 0.13, 0.45, "triangle", 0.18); nhac(f * 2, i * 0.13, 0.3, "sine", 0.05); });
  },

  /** tiếng nền phòng lab rất nhỏ (tủ mát ù nhẹ) */
  nen(bat) {
    const c = san(); if (!c) return;
    if (bat && !ham) {
      const o = c.createOscillator(); o.type = "sine"; o.frequency.value = 58;
      const o2 = c.createOscillator(); o2.type = "sine"; o2.frequency.value = 116;
      const g = c.createGain(); g.gain.value = 0.016;
      o.connect(g); o2.connect(g); g.connect(tong); o.start(); o2.start();
      ham = { o, o2, g };
    } else if (!bat && ham) {
      ham.g.gain.linearRampToValueAtTime(0, c.currentTime + 0.2);
      const h = ham; ham = null;
      setTimeout(() => { h.o.stop(); h.o2.stop(); }, 300);
    }
  },
};
