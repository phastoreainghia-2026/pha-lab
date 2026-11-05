// Giọng nói tiếng Việt (nam, thân thiện). Phát file mp3 đã sinh sẵn (tao_giong.py) nên chạy offline.
// Khoá tra cứu = nguyên văn câu hiển thị. Không có file cho câu đó thì thử giọng trình duyệt (vi-VN), không có nữa thì im lặng.
// Trình duyệt chỉ cho phát sau lần chạm đầu tiên.

let chi = {};          // câu -> tên file
let cau = null;        // giong_cau.json
let hien = null;       // audio đang phát {a, xong}
let tat = false;
let hangCho = Promise.resolve();
try { tat = localStorage.getItem("phalab.tat_giong") === "1"; } catch { /* bỏ qua */ }

export const Giong = {
  async nap() {
    try {
      const [i, c] = await Promise.all([
        fetch("giong/index.json").then((r) => (r.ok ? r.json() : { muc: {} })),
        fetch("du_lieu/giong_cau.json").then((r) => (r.ok ? r.json() : null)),
      ]);
      chi = i.muc || {};
      cau = c;
    } catch { /* offline hoặc chưa sinh giọng: im lặng */ }
  },
  cau() { return cau; },
  dangTat() { return tat; },
  datTat(v) {
    tat = !!v;
    try { localStorage.setItem("phalab.tat_giong", tat ? "1" : "0"); } catch { /* bỏ qua */ }
    if (tat) this.dung();
  },
  coGiong(text) { return !!chi[text]; },

  dung() {
    if (hien) { try { hien.a.pause(); } catch { /* bỏ qua */ } hien.xong(); hien = null; }
    try { speechSynthesis?.cancel(); } catch { /* bỏ qua */ }
  },

  /**
   * Đọc một câu. Mặc định ngắt câu đang đọc. { xep: true } = đọc sau khi câu hiện tại xong.
   * Trả Promise, xong khi đọc hết (hoặc quá thời gian chờ / không có tiếng) => dùng .then(tiếng_động) để "nói trước, động sau".
   */
  noi(text, { xep = false, toiDa = 6000, hopLe = null } = {}) {
    if (tat || !text) return Promise.resolve();
    const chay = () => new Promise((xong0) => {
      if (hopLe && !hopLe()) return xong0(); // câu đã lỗi thời (người chơi làm tiếp rồi)
      let daXong = false;
      const xong = () => { if (!daXong) { daXong = true; clearTimeout(h); xong0(); } };
      const h = setTimeout(xong, toiDa);
      const tenFile = chi[text];
      if (tenFile) {
        const a = new Audio("giong/" + tenFile);
        a.onended = a.onerror = xong;
        hien = { a, xong };
        a.play().catch(xong);
        return;
      }
      // dự phòng: giọng của trình duyệt
      try {
        if (!("speechSynthesis" in window)) return xong();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "vi-VN";
        const v = speechSynthesis.getVoices().filter((x) => x.lang?.toLowerCase().startsWith("vi"));
        u.voice = v.find((x) => /nam|an\b|male/i.test(x.name)) || v[0] || null;
        u.onend = u.onerror = xong;
        hien = { a: { pause: () => speechSynthesis.cancel() }, xong };
        speechSynthesis.speak(u);
      } catch { xong(); }
    });
    if (xep) { hangCho = hangCho.then(chay); return hangCho; }
    this.dung();
    hangCho = chay();
    return hangCho;
  },
};
