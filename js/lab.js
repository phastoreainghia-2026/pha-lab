// Cảnh phòng lab 2.5D (SVG nhiều lớp, có chiều sâu). Chỉ là nền: không biết món nào cả.
// Các lớp: tường (mờ nhẹ, xa) -> kệ -> thiết bị -> quầy -> sàn. data-lop để parallax nghiêng theo tay chạm.
// Màu chai trên kệ ở quầy pha lấy từ nguyên liệu của món đang pha (dữ liệu).

const F = 'font-family="Be Vietnam Pro,system-ui,-apple-system,Segoe UI,sans-serif"';

const DEFS = `<defs>
<pattern id="gach" width="26" height="26" patternUnits="userSpaceOnUse"><rect width="26" height="26" fill="#cfe6e1"/><rect x=".7" y=".7" width="24.6" height="24.6" rx="2.5" fill="#e6f4f0" stroke="#b3d1ca" stroke-width="1"/><path d="M3 3H13" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/></pattern>
<filter id="mo" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.1"/></filter>
<linearGradient id="thep" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6f9fb"/><stop offset=".45" stop-color="#c9d2d9"/><stop offset=".55" stop-color="#b7c1c9"/><stop offset="1" stop-color="#8e9aa4"/></linearGradient>
<linearGradient id="thepD" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9aa6af"/><stop offset=".25" stop-color="#eef2f5"/><stop offset=".6" stop-color="#bcc6ce"/><stop offset="1" stop-color="#8a96a0"/></linearGradient>
<linearGradient id="go" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d09462"/><stop offset=".5" stop-color="#b87b4c"/><stop offset="1" stop-color="#8a5530"/></linearGradient>
<linearGradient id="san" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#454d5b"/><stop offset="1" stop-color="#232830"/></linearGradient>
<linearGradient id="kinh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset=".3" stop-color="#fff" stop-opacity=".12"/><stop offset=".75" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#fff" stop-opacity=".65"/></linearGradient>
<linearGradient id="tuong" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset=".35" stop-color="#000" stop-opacity="0"/><stop offset=".85" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient>
<radialGradient id="anh" cx=".5" cy="0" r="1"><stop offset="0" stop-color="#ffe3b8" stop-opacity=".95"/><stop offset="1" stop-color="#ffe3b8" stop-opacity="0"/></radialGradient>
<radialGradient id="bong" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".32"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
<radialGradient id="boke" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd9a0" stop-opacity=".55"/><stop offset="1" stop-color="#ffd9a0" stop-opacity="0"/></radialGradient>
<radialGradient id="vignet" cx=".5" cy=".45" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".38"/></radialGradient>
<pattern id="van" width="60" height="9" patternUnits="userSpaceOnUse"><path d="M0 2C15 0 30 4 60 2M0 6C20 8 40 4 60 6" stroke="#6b4125" stroke-opacity=".28" fill="none" stroke-width=".8"/></pattern>
</defs>`;

const bong = (cx, cy, rx) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${Math.max(3, rx * 0.16)}" fill="url(#bong)"/>`;

const DEN_THA = (x) => `<g data-lop="2"><g class="treo"><line x1="${x}" y1="0" x2="${x}" y2="62" stroke="#3a3a3a" stroke-width="2"/><path d="M${x - 22} 84 Q${x} 46 ${x + 22} 84 Z" fill="#ff7a3d"/><path d="M${x - 18} 80 Q${x - 6} 56 ${x - 4} 52" stroke="#fff" stroke-opacity=".55" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="${x}" cy="84" rx="22" ry="3" fill="#ffe9c8"/><rect x="${x - 6}" y="82" width="12" height="5" rx="2" fill="#fff4d6"/></g>
<path class="den" d="M${x} 88 L${x - 44} 250 L${x + 44} 250 Z" fill="url(#anh)"/><circle cx="${x}" cy="86" r="22" fill="url(#boke)"/></g>`;

/** chai siro có nút, nhãn, bóng sáng và mức nước */
const CHAI = (x, y, mau, cao = 48) => `${bong(x + 11, y + cao + 1, 15)}<g stroke="#00000026"><rect x="${x}" y="${y}" width="22" height="${cao}" rx="6" fill="${mau}"/><rect x="${x + 5}" y="${y - 12}" width="12" height="14" rx="2" fill="#2b2a33" opacity=".85"/><rect x="${x + 6}" y="${y - 5}" width="10" height="5" fill="#fff" opacity=".25"/><rect x="${x + 2.5}" y="${y + cao * 0.34}" width="17" height="${cao * 0.34}" rx="2" fill="#fff" stroke="none"/><path d="M${x + 5} ${y + cao * 0.48}H${x + 17}M${x + 5} ${y + cao * 0.58}H${x + 14}" stroke="#9aa" stroke-width="1.2" stroke-linecap="round"/><path d="M${x + 4} ${y + 6}V${y + cao - 8}" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".5"/></g>`;

const KE = (x, y, w) => `<rect x="${x + 4}" y="${y + 9}" width="${w - 8}" height="5" fill="#000" opacity=".22"/><rect x="${x}" y="${y}" width="${w}" height="9" rx="2" fill="url(#go)"/><rect x="${x}" y="${y}" width="${w}" height="9" rx="2" fill="url(#van)"/><rect x="${x}" y="${y}" width="${w}" height="2" fill="#fff" opacity=".35"/><path d="M${x + 22} ${y + 9}v14M${x + w - 22} ${y + 9}v14" stroke="#5e3a20" stroke-width="5"/>`;

const HU = (x, y, mau) => `${bong(x + 17, y + 41, 24)}<g><rect x="${x}" y="${y}" width="34" height="40" rx="7" fill="url(#kinh)" stroke="#8fb0ac" stroke-width="1.4"/><rect x="${x + 3}" y="${y + 12}" width="28" height="26" rx="4" fill="${mau}"/><rect x="${x + 3}" y="${y + 12}" width="28" height="6" fill="#fff" opacity=".18"/><rect x="${x - 3}" y="${y - 9}" width="40" height="11" rx="3" fill="#b07a4a"/><rect x="${x - 3}" y="${y - 9}" width="40" height="3" fill="#fff" opacity=".3"/><path d="M${x + 6} ${y + 8}V${y + 34}" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/></g>`;

const LY = (x, y, w, h, ben) => `${bong(x + w / 2, y + h + 1, w * 0.7)}<path d="M${x} ${y}H${x + w}L${x + w - ben} ${y + h}H${x + ben}Z" fill="url(#kinh)" stroke="#8fb0ac" stroke-width="1.4"/><path d="M${x + 4} ${y + 4}L${x + ben + 3} ${y + h - 6}" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/><ellipse cx="${x + w / 2}" cy="${y}" rx="${w / 2}" ry="2.6" fill="#fff" fill-opacity=".35" stroke="#8fb0ac" stroke-width="1"/>`;

const SHAKER = (x, y, w, h) => `${bong(x + w / 2, y + h + 1, w * 0.8)}<path d="M${x} ${y}H${x + w}L${x + w - 4} ${y + h}H${x + 4}Z" fill="url(#thepD)" stroke="#7a858e"/><rect x="${x + 2}" y="${y - 11}" width="${w - 4}" height="13" rx="3" fill="url(#thepD)" stroke="#7a858e"/><rect x="${x + w / 2 - 4}" y="${y - 18}" width="8" height="8" rx="2" fill="#7a858e"/><path d="M${x + 5} ${y + 4}V${y + h - 6}" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>`;

const TUONG = (cao) => `<g data-lop="0"><g filter="url(#mo)"><rect width="390" height="${cao}" fill="url(#gach)"/></g><rect width="390" height="${cao}" fill="url(#tuong)"/><rect y="${cao - 30}" width="390" height="30" fill="#7e9a96" opacity=".3"/></g>`;

const BOKE = `<g data-lop="0" opacity=".9"><circle cx="30" cy="130" r="20" fill="url(#boke)"/><circle cx="360" cy="150" r="26" fill="url(#boke)"/><circle cx="200" cy="30" r="18" fill="url(#boke)"/></g>`;

/** Màn chủ: phòng lab đầy đủ (viewBox 390 x 520). */
export function canhPhongLab() {
  return `<svg class="canh" viewBox="0 0 390 520" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${DEFS}
${TUONG(470)}${BOKE}
<g data-lop="1">
<rect x="92" y="30" width="206" height="112" rx="7" fill="#7a4a2a"/><rect x="95" y="33" width="200" height="106" rx="6" fill="url(#go)"/><rect x="95" y="33" width="200" height="106" rx="6" fill="url(#van)"/>
<rect x="104" y="42" width="182" height="88" rx="3" fill="#25403a"/><rect x="104" y="42" width="182" height="88" rx="3" fill="none" stroke="#0007" stroke-width="2"/>
<path d="M112 120h28M250 56h26" stroke="#fff" stroke-opacity=".08" stroke-width="6" stroke-linecap="round"/>
<text x="195" y="77" text-anchor="middle" ${F} font-weight="800" font-size="25" fill="#f4f1e6">PHA LAB</text>
<line x1="132" y1="87" x2="258" y2="87" stroke="#f4f1e6" stroke-opacity=".6" stroke-dasharray="3 4"/>
<text x="195" y="107" text-anchor="middle" ${F} font-size="12.5" fill="#f4f1e6" opacity=".85">Phòng đào tạo pha chế</text>
<text x="195" y="123" text-anchor="middle" ${F} font-size="10.5" fill="#ffb98f">cùng Pha Store</text>
<rect x="150" y="131" width="90" height="5" rx="2" fill="#f4f1e6" opacity=".55"/>
</g>
${DEN_THA(46)}${DEN_THA(344)}
<g data-lop="1">
${KE(14, 196, 362)}
${LY(24, 150, 22, 46, 3)}${LY(52, 150, 22, 46, 3)}${LY(80, 150, 22, 46, 3)}${LY(112, 168, 26, 28, 3)}${LY(144, 168, 26, 28, 3)}
${SHAKER(186, 152, 28, 44)}${SHAKER(222, 156, 28, 40)}
<g fill="url(#thepD)" stroke="#7a858e"><path d="M262 176H284L278 196H268Z"/><path d="M290 186H308L304 196H294Z"/></g>
${LY(322, 160, 26, 36, 2).replace("fill=\"url(#kinh)\"", "fill=\"url(#kinh)\"")}<path d="M324 178H346L344 196H326Z" fill="#ffb347" opacity=".8"/>
${KE(14, 276, 362)}
${CHAI(26, 228, "#ffb347")}${CHAI(56, 232, "#7fae52", 44)}${CHAI(86, 226, "#ff7a8a", 50)}${CHAI(116, 234, "#a77bdc", 42)}${CHAI(146, 230, "#ffd23f", 46)}
${HU(190, 236, "#9a7b3c")}${HU(234, 236, "#6f9a45")}${HU(278, 236, "#7a3d22")}${HU(322, 240, "#f6edd6")}
</g>
<g data-lop="2">
<rect y="372" width="390" height="14" fill="url(#thep)"/><rect y="372" width="390" height="2" fill="#fff" opacity=".7"/>
<rect y="386" width="390" height="116" fill="#a9b3bb"/>
<g fill="url(#thep)" stroke="#78838c"><rect x="8" y="394" width="118" height="100" rx="4"/><rect x="136" y="394" width="118" height="100" rx="4"/><rect x="264" y="394" width="118" height="100" rx="4"/></g>
<g stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"><path d="M16 402L60 402"/><path d="M144 402L188 402"/><path d="M272 402L316 402"/></g>
<g fill="#59646c"><rect x="108" y="428" width="5" height="26" rx="2"/><rect x="236" y="428" width="5" height="26" rx="2"/><rect x="364" y="428" width="5" height="26" rx="2"/></g>
<path d="M0 372H390" stroke="#fff" stroke-opacity=".3"/>
${bong(48, 373, 34)}${bong(126, 373, 34)}${bong(256, 373, 66)}
<g><rect x="22" y="344" width="52" height="28" rx="5" fill="#2e3440"/><rect x="24" y="346" width="48" height="4" rx="2" fill="#fff" opacity=".12"/><circle class="led" cx="36" cy="358" r="3.2" fill="#ff5a4d"/><rect x="46" y="354" width="20" height="8" rx="2" fill="#4a5262"/>
<path d="M26 292H70L64 344H32Z" fill="url(#kinh)" stroke="#8fb0ac" stroke-width="1.4"/><path d="M29 318H67L64 344H32Z" fill="#ff9f43" opacity=".88"/><path d="M29 318H67" stroke="#ffd7a8" stroke-width="2"/><rect x="24" y="286" width="48" height="8" rx="3" fill="#2e3440"/><path d="M31 296L36 338" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/></g>
<g><rect x="96" y="338" width="60" height="34" rx="6" fill="#ff7a3d"/><rect x="98" y="340" width="56" height="5" rx="2" fill="#fff" opacity=".28"/><path d="M104 338Q126 300 148 338Z" fill="#ffb347"/><path d="M112 332Q122 312 128 308" stroke="#fff" stroke-opacity=".6" stroke-width="3" fill="none" stroke-linecap="round"/><rect x="118" y="318" width="16" height="14" rx="3" fill="#ffe2bf"/><circle cx="112" cy="355" r="3" fill="#fff"/></g>
<g><rect x="184" y="306" width="144" height="66" rx="9" fill="url(#thepD)" stroke="#6a747d"/><rect x="194" y="316" width="124" height="14" rx="4" fill="#2e3440"/><circle class="led" cx="208" cy="323" r="2.6" fill="#7dff95"/><circle cx="222" cy="323" r="2.6" fill="#ffd23f"/><rect x="238" y="320" width="60" height="6" rx="2" fill="#3f4858"/>
<g fill="#2e3440"><rect x="206" y="336" width="14" height="14"/><rect x="250" y="336" width="14" height="14"/><rect x="292" y="336" width="14" height="14"/></g><rect x="200" y="356" width="108" height="6" fill="#6a747d"/>
<path d="M212 356h16v-8h-16zM258 356h16v-8h-16z" fill="#fff" stroke="#c9cfd4"/>
<path class="hoi" d="M220 344q-5-10 0-18" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path class="hoi b" d="M266 344q5-10 0-18" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>
<g><rect x="338" y="316" width="44" height="56" rx="4" fill="#dce7ee" stroke="#8aa0ad"/><rect x="342" y="322" width="36" height="44" rx="2" fill="#a9d6f0" opacity=".75"/><path d="M345 326L352 360" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/><rect x="368" y="332" width="3" height="24" rx="1" fill="#6a747d"/></g>
</g>
<g data-lop="3"><rect y="502" width="390" height="18" fill="url(#san)"/><path d="M0 504H390" stroke="#fff" stroke-opacity=".18"/></g>
<rect width="390" height="520" fill="url(#vignet)"/>
</svg>`;
}

/** Quầy pha: nền tường + kệ chai (màu theo nguyên liệu của món) + bàn inox. viewBox 390 x 330 */
export function canhQuay(mauNguyenLieu = []) {
  const mau = mauNguyenLieu.slice(0, 8);
  const n = Math.max(mau.length, 1);
  const buoc = Math.min(44, 330 / n);
  const x0 = (390 - buoc * (n - 1) - 22) / 2;
  const chai = mau.map((c, i) => CHAI(Math.round(x0 + i * buoc), 52 + (i % 2) * 4, c, 46 - (i % 2) * 4)).join("");
  return `<svg class="canh" viewBox="0 0 390 330" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${DEFS}
${TUONG(290)}${BOKE}
<g data-lop="2"><path class="den" d="M195 0L85 215H305Z" fill="url(#anh)"/><line x1="195" y1="0" x2="195" y2="12" stroke="#3a3a3a" stroke-width="2"/><path d="M163 34Q195 0 227 34Z" fill="#ff7a3d"/><ellipse cx="195" cy="34" rx="32" ry="4" fill="#ffe9c8"/></g>
<g data-lop="1">${KE(14, 108, 362)}${chai}</g>
<g data-lop="2">
<rect y="282" width="390" height="14" fill="url(#thep)"/><rect y="282" width="390" height="2" fill="#fff" opacity=".7"/><rect y="296" width="390" height="34" fill="#a9b3bb"/>
${bong(55, 283, 44)}${bong(335, 283, 36)}${bong(288, 283, 20)}
<g><rect x="16" y="258" width="78" height="24" rx="5" fill="#2e3440"/><rect x="18" y="260" width="74" height="4" rx="2" fill="#fff" opacity=".12"/><rect x="28" y="247" width="54" height="14" rx="3" fill="#162014"/><text x="55" y="258" text-anchor="middle" font-family="monospace" font-weight="700" font-size="11" fill="#7dff95">0.0 g</text></g>
${SHAKER(318, 224, 34, 58)}
<g fill="url(#thepD)" stroke="#7a858e"><path d="M276 256H300L294 282H282Z"/><path d="M280 258H296" stroke="#fff" stroke-width="2" opacity=".7"/></g>
</g>
<rect width="390" height="330" fill="url(#vignet)"/>
</svg>`;
}

/** Nghiêng các lớp theo tay chạm/chuột để có chiều sâu (parallax). Gọi một lần sau khi chèn cảnh. */
export function batParallax(khung) {
  if (!khung || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const lop = [...khung.querySelectorAll("[data-lop]")];
  const he = { 0: -7, 1: -3.5, 2: 0, 3: 4 };
  const dat = (nx) => lop.forEach((g) => g.style.setProperty("transform", `translateX(${(he[g.dataset.lop] ?? 0) * nx}px)`));
  lop.forEach((g) => { g.style.transition = "transform .25s ease-out"; });
  khung.addEventListener("pointermove", (e) => {
    const r = khung.getBoundingClientRect();
    dat((e.clientX - r.left) / r.width * 2 - 1);
  });
  khung.addEventListener("pointerleave", () => dat(0));
}

/** Khuôn mặt khách (SVG nhỏ) theo hạt giống + tâm trạng: vui | binh_thuong | gian. Không dùng emoji. */
export function matKhach(seed = 0, tamTrang = "vui") {
  const da = ["#f6d3b3", "#e8b98e", "#d99f73", "#c68656"][seed % 4];
  const toc = ["#2b2a33", "#5a3a22", "#8a5a2b", "#3b2f4a", "#1f3a4a"][(seed >> 2) % 5];
  const kieu = (seed >> 1) % 3;
  const tocSvg = kieu === 0 ? `<path d="M7 24Q8 6 28 6Q48 6 49 24Q40 14 28 14Q16 14 7 24Z" fill="${toc}"/>`
    : kieu === 1 ? `<circle cx="28" cy="7" r="7" fill="${toc}"/><path d="M8 24Q9 8 28 8Q47 8 48 24Q40 16 28 16Q16 16 8 24Z" fill="${toc}"/>`
    : `<path d="M6 26Q4 4 28 4Q52 4 50 26Q46 12 28 12Q10 12 6 26Z" fill="${toc}"/><rect x="6" y="22" width="5" height="16" rx="2.5" fill="${toc}"/><rect x="45" y="22" width="5" height="16" rx="2.5" fill="${toc}"/>`;
  const mieng = tamTrang === "vui" ? '<path d="M19 38Q28 46 37 38" stroke="#7a2e2e" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
    : tamTrang === "binh_thuong" ? '<path d="M21 40H35" stroke="#7a2e2e" stroke-width="2.4" stroke-linecap="round"/>'
    : '<path d="M20 43Q28 35 36 43" stroke="#7a2e2e" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
  const may = tamTrang === "gian" ? '<path d="M15 22L24 25M41 22L32 25" stroke="#2b2a33" stroke-width="2.4" stroke-linecap="round"/>' : "";
  const ma = tamTrang === "gian" ? '<circle cx="14" cy="34" r="4" fill="#ff7a6a" opacity=".5"/><circle cx="42" cy="34" r="4" fill="#ff7a6a" opacity=".5"/>' : '<circle cx="14" cy="34" r="3.5" fill="#ff9a8a" opacity=".35"/><circle cx="42" cy="34" r="3.5" fill="#ff9a8a" opacity=".35"/>';
  return `<svg viewBox="0 0 56 56" width="56" height="56" aria-hidden="true"><circle cx="28" cy="30" r="22" fill="${da}"/>${tocSvg}${ma}<circle cx="20" cy="29" r="2.6" fill="#2b2a33"/><circle cx="36" cy="29" r="2.6" fill="#2b2a33"/>${may}${mieng}</svg>`;
}
