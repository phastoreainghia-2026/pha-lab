// Thống kê người chơi, tôn trọng riêng tư: KHÔNG cookie, KHÔNG thông tin cá nhân, chỉ đếm lượt và sự kiện ẩn danh.
// Gửi về GoatCounter (https://www.goatcounter.com) bằng một yêu cầu ảnh nhỏ; chỉ bật khi Khải điền mã GoatCounter
// ở trang quản trị (trường "goatcounter_ma"). Không có mã, đang chạy trên máy dev (localhost) hay người chơi bật
// "Do Not Track" thì KHÔNG gửi gì. Hàm tạo nhận phần phụ thuộc vào để kiểm thử được bằng Node.

export function taoThongKe({ ma = "", gui = null, tat = false, kichThuoc = "" } = {}) {
  const dung = !tat && /^[a-z0-9-]{2,40}$/.test(ma);
  const sach = (p) => "/" + String(p).toLowerCase().replace(/[^a-z0-9/_-]+/g, "-").replace(/^\/+/, "").slice(0, 120);
  const url = (p, tieuDe, laSuKien) => {
    const q = new URLSearchParams({ p: sach(p), t: String(tieuDe || "").slice(0, 80) });
    if (laSuKien) q.set("e", "true");
    if (kichThuoc) q.set("s", kichThuoc);
    return `https://${ma}.goatcounter.com/count?${q.toString()}`;
  };
  const phat = (u) => { if (!dung || !gui) return false; try { gui(u); } catch { /* bỏ qua */ } return true; };
  return {
    bat: dung,
    /** Lượt xem một màn hình: man("chu"), man("pha/m289") */
    man: (ten, tieuDe) => phat(url("man/" + ten, tieuDe || ten, false)),
    /** Sự kiện: su_kien("ly/xong/m289/3") */
    suKien: (ten, tieuDe) => phat(url("su-kien/" + ten, tieuDe || ten, true)),
    url,
  };
}

/** Bản dùng trong trình duyệt. */
export function thongKeTrinhDuyet(ma) {
  const dev = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  const dnt = navigator.doNotTrack === "1" || window.doNotTrack === "1";
  return taoThongKe({
    ma, tat: dev || dnt, kichThuoc: `${screen.width},${screen.height},${window.devicePixelRatio || 1}`,
    gui: (u) => { const i = new Image(); i.referrerPolicy = "no-referrer"; i.src = u; },
  });
}
