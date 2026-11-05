// Âm thanh tổng hợp bằng Web Audio: không cần file, chạy offline, không tăng dung lượng.
// Mỗi loại nguyên liệu/thao tác có một "giọng" riêng:
//   nước: róc rách + bong bóng, cao dần khi ly đầy   | nước nóng: thêm tiếng xì hơi
//   sệt (sữa, siro, đường): ục ục chậm, trầm            | bột: lạo xạo từng hạt
//   đá: cục đá thả "cộp" + lách cách                 | đếm (miếng, trái): "tốc" gỗ nhẹ
//   khuấy: muỗng xoáy, chạm đá thì lách cách         | lắc: đá đập thành shaker kim loại
//   đánh bọt: máy đánh bọt rung ù                    | nếm / rắc / dầm: mỗi thứ một tiếng
// Trình duyệt chỉ cho phát tiếng sau lần chạm đầu tiên => gọi Am.batDau() trong sự kiện chạm.

let ctx = null, tong = null, nhieu = null, ham = null, phoTT = null;
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
  /** Âm thanh khu phố (nền động, tự phát liên tục): xe cộ qua lại, chim hót, nhạc nhẹ, tiếng người nói chuyện xa xa. */
  pho(bat) {
    const c = san(); if (!c) return;
    if (!bat) {
      if (!phoTT) return;
      const p = phoTT; phoTT = null;
      p.bus.gain.cancelScheduledValues(c.currentTime); p.bus.gain.setValueAtTime(p.bus.gain.value, c.currentTime); p.bus.gain.linearRampToValueAtTime(0, c.currentTime + 0.6);
      p.doi.forEach((h) => { clearTimeout(h); clearInterval(h); });
      setTimeout(() => p.dung.forEach((f) => { try { f(); } catch { /* đã dừng */ } }), 800);
      return;
    }
    if (phoTT) return;
    const bus = c.createGain(); bus.gain.value = 0; bus.connect(tong);
    bus.gain.linearRampToValueAtTime(2.2, c.currentTime + 2.5); // nền êm nhưng nghe rõ
    const p = { bus, doi: [], dung: [] }; phoTT = p;
    // chỉ lên lịch khi âm thanh đã chạy thật (trình duyệt chặn đến khi chạm lần đầu), tránh dồn cục tiếng
    const hen = (f, ms) => { if (phoTT === p) p.doi.push(setTimeout(() => (phoTT !== p ? null : c.state === "running" ? f() : hen(f, 400)), ms)); };
    const lai = (tr) => { if (c.createStereoPanner) { const s = c.createStereoPanner(); s.pan.value = tr; s.connect(bus); return s; } return bus; };
    const nguonNhieu = (loai, f, q) => {
      const s = c.createBufferSource(); s.buffer = nhieu; s.loop = true;
      const fl = c.createBiquadFilter(); fl.type = loai; fl.frequency.value = f; fl.Q.value = q;
      s.connect(fl); s.start(0, Math.random()); p.dung.push(() => s.stop());
      return fl;
    };

    // 1) tiếng đường phố xa: ù trầm, lên xuống chậm
    { const fl = nguonNhieu("lowpass", 240, 0.7), g = c.createGain(); g.gain.value = 0.07; fl.connect(g); g.connect(bus);
      const doiMuc = () => { g.gain.linearRampToValueAtTime(ngau(0.04, 0.095), c.currentTime + ngau(2, 4)); hen(doiMuc, ngau(2500, 4500)); }; doiMuc(); }

    // 2) xe máy / ô tô chạy ngang (trái sang phải hoặc ngược lại), thỉnh thoảng bấm còi
    const xe = () => {
      const t = c.currentTime, dai = ngau(2.6, 4.2), huong = Math.random() < 0.5 ? -1 : 1, may = Math.random() < 0.72;
      const pan = lai(-0.9 * huong), cp = pan.pan;
      if (cp) { cp.setValueAtTime(-0.9 * huong, t); cp.linearRampToValueAtTime(0.9 * huong, t + dai); }
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(may ? 0.07 : 0.06, t + dai * 0.5); g.gain.linearRampToValueAtTime(0.0001, t + dai); g.connect(pan);
      if (may) { // động cơ xe máy: sóng răng cưa trầm, cao độ giảm dần khi xe đi qua (hiệu ứng Doppler)
        const o = c.createOscillator(); o.type = "sawtooth"; const f0 = ngau(75, 110);
        o.frequency.setValueAtTime(f0 * 1.18, t); o.frequency.linearRampToValueAtTime(f0 * 0.86, t + dai);
        const fl = c.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = 520; fl.Q.value = 2;
        const rung = c.createOscillator(); rung.frequency.value = ngau(22, 34); const rg = c.createGain(); rg.gain.value = 0.35;
        const am = c.createGain(); am.gain.value = 0.65; rung.connect(rg); rg.connect(am.gain); o.connect(fl); fl.connect(am); am.connect(g);
        o.start(t); rung.start(t); o.stop(t + dai + 0.1); rung.stop(t + dai + 0.1);
      } else { // ô tô: tiếng lốp xào xạc
        const s = c.createBufferSource(); s.buffer = nhieu; s.loop = true; const fl = c.createBiquadFilter(); fl.type = "bandpass"; fl.frequency.value = ngau(380, 620); fl.Q.value = 0.8;
        s.connect(fl); fl.connect(g); s.start(t, Math.random()); s.stop(t + dai + 0.1);
      }
      if (Math.random() < 0.22) { // bóp còi "píp píp"
        const lanBip = Math.random() < 0.5 ? 1 : 2;
        for (let i = 0; i < lanBip; i++) {
          const tb = t + dai * 0.35 + i * 0.28;
          [430, 540].forEach((f) => {
            const o = c.createOscillator(); o.type = "square"; o.frequency.value = f; const gg = c.createGain(); gg.gain.setValueAtTime(0.0001, tb);
            gg.gain.linearRampToValueAtTime(0.012, tb + 0.015); gg.gain.setValueAtTime(0.012, tb + 0.13); gg.gain.linearRampToValueAtTime(0.0001, tb + 0.16);
            const fl = c.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = 1600; o.connect(fl); fl.connect(gg); gg.connect(pan); o.start(tb); o.stop(tb + 0.2);
          });
        }
      }
      hen(xe, ngau(2200, 7000));
    };
    hen(xe, 900);

    // 3) chim hót: chuỗi nốt cao, trượt nhanh, ở vị trí ngẫu nhiên
    const chim = () => {
      const pan = lai(ngau(-0.8, 0.8)), n = 2 + Math.floor(Math.random() * 5), kieu = Math.random();
      let t = c.currentTime, f = ngau(2300, 3900);
      for (let i = 0; i < n; i++) {
        const dai = kieu < 0.5 ? ngau(0.05, 0.1) : ngau(0.09, 0.17), f2 = f * (Math.random() < 0.5 ? ngau(1.25, 1.7) : ngau(0.6, 0.85));
        const o = c.createOscillator(); o.type = "sine"; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(Math.min(5200, f2), t + dai);
        const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.02, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dai);
        o.connect(g); g.connect(pan); o.start(t); o.stop(t + dai + 0.03);
        t += dai + ngau(0.03, 0.09); if (kieu > 0.6) f = ngau(2300, 3900);
      }
      hen(chim, ngau(1400, 6500));
    };
    hen(chim, 1500);

    // 4) nhạc nhẹ: hợp âm nền mềm + vài nốt gảy thang ngũ âm, thong thả
    {
      const HOP = [[220, 261.6, 329.6], [174.6, 220, 261.6], [261.6, 329.6, 392], [196, 246.9, 293.7]]; // Am - F - C - G
      const NGU = [523.3, 587.3, 659.3, 784, 880, 1046.5]; let b = 0;
      const nhac0 = c.createGain(); nhac0.gain.value = 0.9; nhac0.connect(bus);
      const hopAm = () => {
        const t = c.currentTime, ch = HOP[b++ % HOP.length];
        ch.forEach((f, i) => {
          const o = c.createOscillator(); o.type = "triangle"; o.frequency.value = f * (i === 0 ? 0.5 : 1);
          const fl = c.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = 900; const g = c.createGain();
          g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.018, t + 1.6); g.gain.linearRampToValueAtTime(0.0001, t + 7.4);
          o.connect(fl); fl.connect(g); g.connect(nhac0); o.start(t); o.stop(t + 7.6);
        });
        hen(hopAm, 7000);
      };
      const gay = () => {
        const t = c.currentTime, f = NGU[Math.floor(Math.random() * NGU.length)];
        [1, 2].forEach((h, i) => {
          const o = c.createOscillator(); o.type = i ? "sine" : "triangle"; o.frequency.value = f * h; const g = c.createGain();
          g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(i ? 0.004 : 0.016, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
          o.connect(g); g.connect(nhac0); o.start(t); o.stop(t + 1.6);
        });
        hen(gay, Math.random() < 0.3 ? ngau(300, 500) : ngau(900, 2200));
      };
      hopAm(); hen(gay, 1200);
    }

    // 5) tiếng người nói chuyện xa xa: ì ào + từng "âm tiết" giọng người
    {
      const fl = nguonNhieu("bandpass", 650, 1.1), g = c.createGain(); g.gain.value = 0.03; fl.connect(g); g.connect(bus);
      const doi = () => { g.gain.linearRampToValueAtTime(ngau(0.015, 0.045), c.currentTime + ngau(0.8, 1.8)); fl.frequency.linearRampToValueAtTime(ngau(480, 900), c.currentTime + 1.5); hen(doi, ngau(900, 2000)); }; doi();
      const noi = () => {
        const pan = lai(ngau(-0.9, 0.9)), nguoiNu = Math.random() < 0.5, cao = nguoiNu ? ngau(190, 250) : ngau(105, 150), so = 2 + Math.floor(Math.random() * 5);
        let t = c.currentTime + 0.05;
        for (let i = 0; i < so; i++) {
          const dai = ngau(0.09, 0.2), o = c.createOscillator(); o.type = "sawtooth"; o.frequency.setValueAtTime(cao * ngau(0.9, 1.15), t); o.frequency.linearRampToValueAtTime(cao * ngau(0.85, 1.2), t + dai);
          const f1 = c.createBiquadFilter(); f1.type = "bandpass"; f1.frequency.value = ngau(450, 850); f1.Q.value = 4;
          const f2 = c.createBiquadFilter(); f2.type = "bandpass"; f2.frequency.value = ngau(1100, 2200); f2.Q.value = 5;
          const gg = c.createGain(); gg.gain.setValueAtTime(0.0001, t); gg.gain.linearRampToValueAtTime(0.022, t + 0.025); gg.gain.linearRampToValueAtTime(0.0001, t + dai);
          o.connect(f1); o.connect(f2); f1.connect(gg); f2.connect(gg); gg.connect(pan); o.start(t); o.stop(t + dai + 0.03);
          t += dai + ngau(0.02, 0.1);
        }
        hen(noi, Math.random() < 0.35 ? ngau(400, 900) : ngau(1500, 4200));
      };
      hen(noi, 1000); hen(noi, 2600);
    }
  },

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
