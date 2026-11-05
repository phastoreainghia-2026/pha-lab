// Tạo ảnh chia sẻ (share-card PNG) bằng canvas. Không biết món nào cả.

function taiAnh(src) {
  return new Promise((ok, loi) => { const i = new Image(); i.onload = () => ok(i); i.onerror = loi; i.src = src; });
}

function chuGon(ctx, text, x, y, rong, cao) {
  const tu = text.split(" ");
  let dong = "", yy = y;
  for (const t of tu) {
    const thu = dong ? dong + " " + t : t;
    if (ctx.measureText(thu).width > rong && dong) { ctx.fillText(dong, x, yy); dong = t; yy += cao; } else dong = thu;
  }
  ctx.fillText(dong, x, yy);
  return yy;
}

/** @returns Promise<Blob PNG>  | svgChuoi: SVG của ly đã serialize */
export async function taoAnhChiaSe({ cuaHang, tenMon, diem, sao, cheDo, svgChuoi, tongTien, uuDai = "", mauChuDao = "#ff7a3d" }) {
  const W = 1080, H = 1350;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");
  const nen = g.createLinearGradient(0, 0, 0, H);
  nen.addColorStop(0, "#fff3e6"); nen.addColorStop(1, "#ffe0c7");
  g.fillStyle = nen; g.fillRect(0, 0, W, H);

  // logo chữ Pha Store (chưa có file logo; thêm "logo" vào cau_hinh_cua_hang.json để dùng ảnh)
  g.fillStyle = mauChuDao;
  g.beginPath(); g.roundRect(60, 60, 360, 96, 28); g.fill();
  g.fillStyle = "#fff"; g.font = "900 56px system-ui, sans-serif"; g.textBaseline = "middle";
  g.fillText(cuaHang.ten || "Pha Store", 90, 110);
  g.fillStyle = "#6b6874"; g.font = "600 30px system-ui, sans-serif";
  g.textAlign = "right"; g.fillText("Pha Lab · " + (cheDo === "thu_thach" ? "Thử thách" : "Tập sự"), W - 60, 110);

  g.textAlign = "left"; g.textBaseline = "alphabetic";
  g.fillStyle = "#2b2a33"; g.font = "800 64px system-ui, sans-serif";
  const yCuoi = chuGon(g, tenMon, 60, 260, W - 120, 76);

  // ly
  try {
    const hinh = await taiAnh("data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgChuoi));
    const h = 620, w = h * (200 / 300);
    g.drawImage(hinh, W / 2 - w / 2 - 200, yCuoi + 50, w, h);
  } catch { /* không vẽ được ly thì bỏ qua */ }

  // điểm
  g.textAlign = "center";
  g.fillStyle = mauChuDao; g.font = "900 220px system-ui, sans-serif";
  g.fillText(String(diem), W / 2 + 220, yCuoi + 360);
  g.fillStyle = "#f5a623"; g.font = "80px system-ui, sans-serif";
  g.fillText("★".repeat(sao) + "☆".repeat(3 - sao), W / 2 + 220, yCuoi + 470);
  g.fillStyle = "#6b6874"; g.font = "600 36px system-ui, sans-serif";
  g.fillText("điểm pha chế", W / 2 + 220, yCuoi + 530);
  if (tongTien != null) {
    g.fillStyle = "#2b2a33"; g.font = "700 38px system-ui, sans-serif";
    g.fillText("Nguyên liệu ước tính " + tongTien.toLocaleString("vi-VN") + "đ/ly", W / 2 + 220, yCuoi + 600);
  }

  if (uuDai) {
    g.textAlign = "center";
    g.fillStyle = mauChuDao; g.beginPath(); g.roundRect(60, H - 290, W - 120, 84, 24); g.fill();
    g.fillStyle = "#fff"; g.font = "700 36px system-ui, sans-serif";
    g.fillText("Ưu đãi: " + uuDai.slice(0, 60), W / 2, H - 238);
  }
  g.textAlign = "left";
  g.fillStyle = "#2b2a33"; g.font = "700 44px system-ui, sans-serif";
  g.fillText("Học pha chế thực chiến cùng " + (cuaHang.ten || "Pha Store"), 60, H - 150);
  g.fillStyle = "#6b6874"; g.font = "500 34px system-ui, sans-serif";
  g.fillText([cuaHang.dia_chi, cuaHang.facebook?.replace(/^https?:\/\/(www\.)?/, "")].filter(Boolean).join(" · "), 60, H - 90);

  return new Promise((ok) => c.toBlob(ok, "image/png"));
}

export async function luuHoacChiaSe(blob, tenFile) {
  const file = new File([blob], tenFile, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: "Pha Lab" }); return "chia_se"; } catch { /* người dùng huỷ => tải về */ }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = tenFile; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return "tai_ve";
}
