// Chấm điểm tự động từ dữ liệu (không có luật riêng cho từng món).
// Hàm thuần, không đụng DOM => chạy được cả trong trình duyệt lẫn Node (kiểm thử).

const fmt = (n) => (Math.round(n * 10) / 10).toString().replace(".", ",");

/** Danh sách việc cần làm của một món, theo đúng thứ tự bước. */
export function viecCanLam(mon, thaoTac) {
  const ds = [];
  mon.buoc.forEach((b, bi) => {
    for (const x of b.dung || []) {
      ds.push({ kieu: "them", nl: x.nl, luong: x.luong, don_vi: x.don_vi, toi_thieu: x.luong_toi_thieu ?? null, buoc: bi });
    }
    const tt = thaoTac.thao_tac[b.thao_tac];
    if (tt && tt.loai === "hanh_dong") {
      ds.push({ kieu: "hd", thao_tac: b.thao_tac, nhan: b.nhan || null, giay: b.thoi_gian_giay, buoc: bi });
    }
  });
  return ds;
}

function diemSo(thuc, dich, saiTuyetDoi) {
  const e = Math.abs(thuc - dich);
  if (e <= saiTuyetDoi) return 1;
  return Math.max(0, 1 - (e - saiTuyetDoi) / (2 * saiTuyetDoi));
}

/**
 * @param events [{kieu:"them", nl, luong} | {kieu:"hd", thao_tac, vong?, giay?}]
 * @param tenNl  hàm id -> tên hiển thị
 */
export function chamDiem(mon, events, thaoTac, cheDo, tenNl) {
  const dungSai = thaoTac.dung_sai;
  const tolRel = cheDo === "thu_thach" ? dungSai.thu_thach : dungSai.tap_su;
  const viec = viecCanLam(mon, thaoTac);
  const dungDen = new Set(); // chỉ số sự kiện đã dùng
  const buocLoi = mon.buoc.map(() => ({ loi: [], diem: [] }));
  const khop = []; // {buoc, idx}

  // Gộp các lần cho cùng một nguyên liệu thành một tổng
  const tong = {};
  events.forEach((e, i) => {
    if (e.kieu === "them") {
      (tong[e.nl] ||= { luong: 0, dau: i, idxs: [], ds: [] });
      tong[e.nl].luong += e.luong;
      tong[e.nl].idxs.push(i);
      tong[e.nl].ds.push(e);
    }
  });

  // Nguyên liệu chia làm nhiều phần (nhiều bước): mỗi lần cho = một phần, lần cuối gộp phần dư.
  const soPhan = {}, daLay = {};
  for (const v of viec) if (v.kieu === "them") soPhan[v.nl] = (soPhan[v.nl] || 0) + 1;

  let cuoi = -1;
  for (const v of viec) {
    let ds = 0;
    let idx = -1;
    const o = buocLoi[v.buoc];
    if (v.kieu === "them") {
      let t = tong[v.nl];
      const ten = tenNl(v.nl);
      if (t && soPhan[v.nl] > 1) {
        const k = (daLay[v.nl] = (daLay[v.nl] || 0) + 1) - 1;
        const phan = k < soPhan[v.nl] - 1 ? t.ds.slice(k, k + 1) : t.ds.slice(k);
        t = phan.length ? { luong: phan.reduce((a, e) => a + e.luong, 0), dau: t.idxs[k], idxs: t.idxs.slice(k, k + phan.length) } : null;
      }
      if (!t) {
        o.loi.push(`Quên cho ${fmt(v.luong)} ${v.don_vi} ${ten.toLowerCase()}.`);
      } else {
        idx = t.dau;
        t.idxs.forEach((i) => dungDen.add(i));
        if (v.don_vi === "ml" || v.don_vi === "g") {
          const tol = Math.max(tolRel * v.luong, dungSai.toi_thieu_don_vi);
          ds = diemSo(t.luong, v.luong, tol);
          if (ds < 0.999) {
            const lech = t.luong - v.luong;
            o.loi.push(`${lech < 0 ? "Thiếu" : "Dư"} ${ten.toLowerCase()}: cho ${fmt(t.luong)} ${v.don_vi}, cần ${fmt(v.luong)} ${v.don_vi} (±${fmt(tol)}).`);
          }
        } else {
          // đếm số lượng (miếng, trái, muỗng): đúng nếu nằm trong [toi_thieu .. luong]
          const lo = v.toi_thieu ?? v.luong;
          const khoang = t.luong < lo ? lo - t.luong : t.luong > v.luong ? t.luong - v.luong : 0;
          ds = Math.max(0, 1 - khoang * 0.5);
          if (khoang > 0) {
            const can = lo === v.luong ? fmt(v.luong) : `${fmt(lo)}-${fmt(v.luong)}`;
            o.loi.push(`${ten}: cho ${fmt(t.luong)} ${v.don_vi}, cần ${can} ${v.don_vi}.`);
          }
        }
      }
    } else {
      // hành động: lấy sự kiện cùng loại đầu tiên sau mốc trước; nếu không có thì lấy bất kỳ (sai thứ tự)
      const tt = thaoTac.thao_tac[v.thao_tac];
      const tenTt = (v.nhan ? (mon.hon_hop?.[v.nhan]?.ten || v.nhan) : tt.ten).toLowerCase();
      const cung = (e, i) => e.kieu === "hd" && e.thao_tac === v.thao_tac && (e.nhan || null) === v.nhan && !dungDen.has(i);
      let i = events.findIndex((e, k) => k > cuoi && cung(e, k));
      if (i < 0) i = events.findIndex(cung);
      if (i < 0) {
        o.loi.push(`Quên bước ${tenTt}.`);
      } else {
        const e = events[i];
        idx = i;
        dungDen.add(i);
        if (tt.kieu === "vong") {
          ds = Math.min(1, (e.vong || 0) / tt.so_vong_toi_thieu);
          if (ds < 0.999) o.loi.push(`${tt.ten} chưa đủ: ${Math.round(e.vong || 0)}/${tt.so_vong_toi_thieu} vòng.`);
        } else if (tt.kieu === "giu") {
          const g = e.giay || 0;
          if (v.giay) {
            const tol = Math.max(tt.sai_so_thoi_gian * v.giay, 1);
            ds = diemSo(g, v.giay, tol);
            if (ds < 0.999) o.loi.push(`${tt.ten} ${fmt(g)} giây, cần khoảng ${fmt(v.giay)} giây (±${fmt(tol)}).`);
          } else {
            ds = Math.min(1, g / tt.giay_toi_thieu);
            if (ds < 0.999) o.loi.push(`${tt.ten} chưa đủ lâu (${fmt(g)} giây, nên ít nhất ${tt.giay_toi_thieu} giây).`);
          }
        } else {
          ds = 1;
        }
      }
    }
    o.diem.push(ds);
    if (idx >= 0) {
      khop.push({ buoc: v.buoc, idx });
      if (v.kieu === "hd") cuoi = Math.max(cuoi, idx);
    }
  }

  // Thứ tự: cặp việc ở hai bước khác nhau mà làm ngược nhau là vi phạm.
  let cap = 0, saiCap = 0;
  const buocSaiThuTu = new Set();
  for (let a = 0; a < khop.length; a++) {
    for (let b = a + 1; b < khop.length; b++) {
      if (khop[a].buoc !== khop[b].buoc) {
        cap++;
        const nguoc = khop[a].buoc < khop[b].buoc ? khop[a].idx > khop[b].idx : khop[a].idx < khop[b].idx;
        if (nguoc) {
          saiCap++;
          buocSaiThuTu.add(khop[a].buoc);
          buocSaiThuTu.add(khop[b].buoc);
        }
      }
    }
  }
  const diemThuTu = cap ? 1 - saiCap / cap : 1;

  // Nguyên liệu thừa (không thuộc công thức)
  const trongCt = new Set(mon.nguyen_lieu.map((x) => x.nl));
  const thua = Object.keys(tong).filter((id) => !trongCt.has(id));

  const moiDiem = buocLoi.flatMap((b) => b.diem);
  const chinhXac = moiDiem.length ? moiDiem.reduce((a, b) => a + b, 0) / moiDiem.length : 0;
  const diemThua = Math.max(0, 1 - 0.35 * thua.length);

  // Thứ tự và "không dùng nhầm" chỉ có giá trị khi đã làm được việc: nhân với độ chính xác
  const tongDiem = Math.round(chinhXac * (60 + 25 * diemThuTu + 15 * diemThua));

  const chiTiet = mon.buoc.map((b, i) => {
    const o = buocLoi[i];
    const tb = o.diem.length ? o.diem.reduce((a, c) => a + c, 0) / o.diem.length : 1;
    const loi = [...o.loi];
    if (buocSaiThuTu.has(i)) loi.push("Làm sai thứ tự so với công thức.");
    return {
      thu_tu: b.thu_tu, hanh_dong: b.hanh_dong, diem: tb,
      ok: loi.length === 0, loi,
      meo: loi.length ? b.loi_thuong_gap || "" : "",
    };
  });

  return {
    tong: tongDiem,
    chinh_xac: chinhXac, thu_tu: diemThuTu, thua: thua.map((id) => tenNl(id)),
    chi_tiet: chiTiet, ds_viec: viec.length,
    sao: tongDiem >= 90 ? 3 : tongDiem >= 70 ? 2 : tongDiem >= 40 ? 1 : 0,
  };
}

/**
 * Đơn giá (đ/đơn vị dùng) của một nguyên liệu: giá bán / quy cách của mã hàng đã chọn.
 * Chỉ tính khi tinh_gia bật (quy cách cùng đơn vị với lượng dùng); dữ liệu cũ chưa có cờ thì dùng gia_von_don_vi cũ.
 */
export function donGia(e) {
  if (e.tinh_gia === undefined) return e.gia_von_don_vi ?? null;
  const s = e.sku;
  if (!e.tinh_gia || !s || typeof s.gia_ban_sau_thue !== "number" || !(s.gia_ban_sau_thue >= 0) || typeof s.quy_cach !== "number" || !(s.quy_cach > 0)) return null;
  return s.gia_ban_sau_thue / s.quy_cach;
}

/** Chi phí nguyên liệu ước tính. Chỉ có tổng khi MỌI nguyên liệu (không miễn phí) đều có giá. */
export function tinhChiPhi(mon, thuVien) {
  const dong = [];
  let tong = 0;
  let chuaCo = 0;
  for (const x of mon.nguyen_lieu) {
    const e = thuVien[x.nl];
    if (e.mien_phi) {
      dong.push({ ten: e.ten, luong: x.luong, don_vi: x.don_vi, tien: 0, ghi_chu: "miễn phí / tính chung" });
    } else if (donGia(e) != null) {
      const tien = Math.round(donGia(e) * x.luong);
      tong += tien;
      dong.push({ ten: e.ten, luong: x.luong, don_vi: x.don_vi, tien, ma: e.sku?.ma });
    } else {
      chuaCo++;
      dong.push({ ten: e.ten, luong: x.luong, don_vi: x.don_vi, tien: null, ghi_chu: "chưa có giá" });
    }
  }
  return { dong, tong_da_co_gia: tong, chua_co_gia: chuaCo, day_du: chuaCo === 0 };
}
