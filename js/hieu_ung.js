// Hiệu ứng thưởng: pháo giấy (canvas-confetti, ISC, chép sẵn trong js/vendor nên chạy offline) + rung nhẹ trên Android.
// Tôn trọng "giảm chuyển động" của máy: bật chế độ đó thì không có pháo giấy, không rung.
// Thư viện chỉ được tải khi lần đầu cần dùng.

let nap = null;
const giam = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } };
const MAU = ["#ff7a3d", "#ffb347", "#ffd23f", "#2d8fdd", "#2e9e5b", "#ffffff"];

function napConfetti() {
  if (!nap) {
    nap = new Promise((ok, loi) => {
      if (window.confetti) return ok(window.confetti);
      const s = document.createElement("script");
      s.src = "js/vendor/confetti.min.js";
      s.onload = () => ok(window.confetti);
      s.onerror = () => { nap = null; loi(new Error("confetti")); };
      document.head.appendChild(s);
    });
  }
  return nap;
}

const RUNG = { ba_sao: [30, 50, 30, 50, 90], len_hang: [60, 40, 60, 40, 140], mo_moi: [40, 40, 40], bo_di: [90, 50, 90], loi: 30 };

export const Hieu = {
  rung(kieu) {
    if (giam() || navigator.userActivation?.hasBeenActive === false) return; // trình duyệt chặn rung nếu người chơi chưa chạm lần nào
    try { navigator.vibrate?.(typeof kieu === "string" ? RUNG[kieu] : kieu); } catch { /* bỏ qua */ }
  },

  /** kieu: ba_sao | len_hang | mo_moi */
  async phao(kieu) {
    if (giam()) return;
    try {
      const c = await napConfetti();
      const co = { colors: MAU, zIndex: 80, disableForReducedMotion: true };
      if (kieu === "ba_sao") {
        c({ ...co, particleCount: 70, angle: 60, spread: 70, startVelocity: 58, origin: { x: 0.05, y: 0.85 } });
        c({ ...co, particleCount: 70, angle: 120, spread: 70, startVelocity: 58, origin: { x: 0.95, y: 0.85 } });
      } else if (kieu === "len_hang") {
        let n = 0;
        const h = setInterval(() => {
          c({ ...co, particleCount: 45, spread: 100, startVelocity: 45, origin: { x: Math.random(), y: Math.random() * 0.4 }, scalar: 1.1 });
          if (++n >= 5) clearInterval(h);
        }, 260);
      } else {
        c({ ...co, particleCount: 80, spread: 110, startVelocity: 40, origin: { x: 0.5, y: 0.4 }, scalar: 0.9 });
      }
    } catch { /* không tải được thì thôi, không ảnh hưởng chơi */ }
  },

  /**
   * Chạy cụm hiệu ứng ở màn kết quả.
   * { baSao: được 3 sao, hang: vừa lên hạng, moi: vừa mở khóa món / nhận huy hiệu / xong thử thách ngày, boDi: khách bỏ đi }
   */
  chayThuong({ baSao = false, hang = false, moi = false, boDi = false } = {}) {
    if (boDi) this.rung("bo_di");
    if (baSao) setTimeout(() => { this.phao("ba_sao"); this.rung("ba_sao"); }, 250);
    if (hang) setTimeout(() => { this.phao("len_hang"); this.rung("len_hang"); }, 1500);
    else if (moi) setTimeout(() => { this.phao("mo_moi"); this.rung("mo_moi"); }, 1500);
  },
};
