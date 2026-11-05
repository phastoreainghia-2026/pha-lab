// Service worker Pha Lab: chạy offline sau lần tải đầu.
// - Vỏ ứng dụng (html/css/js/icon): lưu sẵn khi cài, luôn trả từ bộ nhớ rồi âm thầm cập nhật.
// - Dữ liệu (du_lieu/*.json): ưu tiên mạng để thấy giá/mã hàng mới nhất, mất mạng thì dùng bản đã lưu.
// Đổi nội dung code: tăng PHIEN_BAN để máy người chơi tải lại toàn bộ.
const PHIEN_BAN = "pha-lab-db1a426199";
const VO = ["./", "index.html", "style.css", "manifest.webmanifest", "js/main.js", "js/score.js", "js/glass.js", "js/share.js", "js/lab.js", "js/am_thanh.js", "js/giong.js", "js/khach.js", "js/tien_trinh.js", "js/hieu_ung.js", "js/thong_ke.js", "js/gia.js", "js/icon.js", "fonts/be-vietnam-pro-latin-500-normal.woff2", "fonts/be-vietnam-pro-latin-700-normal.woff2", "fonts/be-vietnam-pro-latin-800-normal.woff2", "fonts/be-vietnam-pro-vietnamese-500-normal.woff2", "fonts/be-vietnam-pro-vietnamese-700-normal.woff2", "fonts/be-vietnam-pro-vietnamese-800-normal.woff2", "fonts/OFL.txt", "js/vendor/confetti.min.js", "giong/index.json",
  "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png"];
const DU_LIEU = ["nguyen_lieu", "dung_cu", "thao_tac", "recipes", "hang_so_cua_hang", "cau_hinh_cua_hang", "game_cau_hinh", "giong_cau", "che_do_khach", "tien_trinh", "su_co", "huong_dan", "gia_tuy_chinh", "cua_hang_tuy_chinh", "mon_tuy_chinh", "can_bang_tuy_chinh", "log_chua_ho_tro"]
  .map((t) => `du_lieu/${t}.json`);

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(PHIEN_BAN).then((c) => c.addAll([...VO, ...DU_LIEU]).then(async () => {
    // giọng nói: lưu sẵn mọi file mp3 trong danh mục (lỗi một file không làm hỏng cả bản cài)
    try {
      const idx = await (await fetch("giong/index.json")).json();
      await Promise.all([...new Set(Object.values(idx.muc || {}))].map((f) => c.add("giong/" + f).catch(() => {})));
    } catch { /* chưa sinh giọng */ }
  })).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== PHIEN_BAN).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin || u.pathname.includes("/api/") || u.pathname.includes("/quan_tri/") || u.pathname.endsWith("admin.html") || u.pathname.endsWith("/js/admin.js")) return;
  const laDuLieu = u.pathname.includes("/du_lieu/");
  e.respondWith((async () => {
    const c = await caches.open(PHIEN_BAN);
    const cu = await c.match(r, { ignoreSearch: true });
    const mang = fetch(r).then((res) => { if (res.ok) c.put(r, res.clone()); return res; });
    if (laDuLieu) { try { return await mang; } catch { return cu || Response.error(); } }
    if (cu) { mang.catch(() => {}); return cu; }
    try { return await mang; } catch { return (await c.match("index.html")) || Response.error(); }
  })());
});
