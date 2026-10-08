const { jsPDF } = window.jspdf;
let W = 1000, H = 700; const $ = id => document.getElementById(id);
const canvas = $('certCanvas'), ctx = canvas.getContext('2d');

const FONTS = ["Cinzel Decorative", "Cinzel", "Playfair Display", "Montserrat", "Poppins", "Great Vibes", "Alex Brush", "Dancing Script", "Pacifico", "Parisienne", "Pinyon Script", "Sacramento", "Satisfy", "Tangerine", "Allura", "Italianno", "Cormorant Garamond", "Lora", "Merriweather", "PT Serif", "Marcellus", "Bodoni Moda", "EB Garamond", "Inter", "Roboto", "Open Sans", "Lato", "Oswald", "Raleway", "Caveat", "Abril Fatface", "Bebas Neue", "Montez", "Niconne", "Rochester", "League Spartan", "DM Serif Display", "Arial", "Georgia", "Times New Roman"];

/* ---------- image registry (keeps undo history small: state only stores keys) ---------- */
const IM = {}; let imN = 0;
const readURL = f => new Promise(r => { const fr = new FileReader(); fr.onload = e => r(e.target.result); fr.readAsDataURL(f); });
const reg = src => new Promise(res => { const i = new Image(); i.onload = () => { const k = 'im' + (++imN); IM[k] = i; res(k); }; i.src = src; });

/* ---------- page size, 2 x 30 preset templates (landscape + A4 portrait), border lines ---------- */
const STD = { l: [1000, 700], p: [700, 990] };                   // landscape / A4 portrait (1:1.414)
const FRAC = { l: { title: .1714, lead: .2714, name: .3857, subtitle: .5, sig: .7, authName: .7571, authDesig: .7929 }, p: { title: .2, lead: .295, name: .385, subtitle: .465, sig: .74, authName: .8, authDesig: .83 } };
const isP = () => H > W;
const fy = r => Math.round(H * FRAC[isP() ? 'p' : 'l'][r]);
const lg = (c, x0, y0, x1, y1, a, b) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
const ST = {   // every style is drawn from W and H, so it works on any page size
  Frame: (c, p, s) => { c.lineWidth = 8; c.strokeStyle = p; c.strokeRect(30, 30, W - 60, H - 60); c.lineWidth = 2; c.strokeStyle = s; c.strokeRect(46, 46, W - 92, H - 92); c.fillStyle = s;[[30, 30], [W - 30, 30], [30, H - 30], [W - 30, H - 30]].forEach(([x, y]) => c.fillRect(x - 12, y - 12, 24, 24)); },
  Waves: (c, p, s) => { [[s, 16], [p, 0]].forEach(([col, o]) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0); c.lineTo(W, 60 + o); c.bezierCurveTo(W * .7, 120 + o, W * .3, o, 0, 80 + o); c.fill(); c.beginPath(); c.moveTo(0, H); c.lineTo(W, H); c.lineTo(W, H - 80 - o); c.bezierCurveTo(W * .7, H - o, W * .3, H - 120 - o, 0, H - 60 - o); c.fill(); }); },
  Corners: (c, p, s) => { [[0, 0, 1, 1], [W, 0, -1, 1], [0, H, 1, -1], [W, H, -1, -1]].forEach(([x, y, a, b]) => { [[p, W * .22], [s, W * .14]].forEach(([col, n]) => { c.fillStyle = col; c.beginPath(); c.moveTo(x, y); c.lineTo(x + a * n, y); c.lineTo(x, y + b * n); c.fill(); }); }); },
  Ribbon: (c, p, s) => { c.fillStyle = lg(c, 0, 0, 70, 0, p, s); c.fillRect(0, 0, 70, H); c.fillStyle = s; c.fillRect(70, 0, 8, H); c.fillRect(86, 0, 3, H); },
  Bands: (c, p, s) => { c.fillStyle = p; c.fillRect(0, 0, W, 80); c.fillRect(0, H - 60, W, 60); c.fillStyle = s; c.fillRect(0, 80, W, 8); c.fillRect(0, H - 68, W, 8); },
  Dots: (c, p, s) => { c.fillStyle = s; c.globalAlpha = .6; for (let x = 20; x < W; x += 26) for (let y = 20; y < H; y += 26) if (x < 70 || x > W - 70 || y < 70 || y > H - 70) { c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); } c.globalAlpha = 1; c.strokeStyle = p; c.lineWidth = 5; c.strokeRect(80, 80, W - 160, H - 160); },
  Burst: (c, p, s) => { c.globalAlpha = .1; c.fillStyle = p; for (let i = 0; i < 24; i++) { c.beginPath(); c.moveTo(W / 2, H / 2); c.arc(W / 2, H / 2, Math.max(W, H), i * Math.PI / 12, (i + .5) * Math.PI / 12); c.fill(); } c.globalAlpha = 1; c.lineWidth = 6; c.strokeStyle = s; c.strokeRect(24, 24, W - 48, H - 48); c.lineWidth = 2; c.strokeStyle = p; c.strokeRect(36, 36, W - 72, H - 72); },
  Stripes: (c, p, s) => { for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? s : p;[[0, 0, 1], [W, H, -1]].forEach(([x, y, d]) => { c.beginPath(); c.moveTo(x + d * i * 34, y); c.lineTo(x + d * (i * 34 + 34), y); c.lineTo(x, y + d * (i * 34 + 34)); c.lineTo(x, y + d * i * 34); c.fill(); }); } },
  Orbs: (c, p, s) => { [[0, 0, 190, p], [W, H, 230, p], [W, 0, 110, s], [0, H, 120, s]].forEach(([x, y, r, col]) => { c.fillStyle = col; c.globalAlpha = .85; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.globalAlpha = .3; c.beginPath(); c.arc(x, y, r + 30, 0, 7); c.fill(); }); c.globalAlpha = 1; },
  Glass: (c, p, s, d) => { c.fillStyle = lg(c, 0, 0, W, H, p, s); c.fillRect(0, 0, W, H); c.fillStyle = d ? 'rgba(10,10,20,.82)' : 'rgba(255,255,255,.9)'; c.beginPath(); c.roundRect(40, 40, W - 80, H - 80, 26); c.fill(); },
  Arch: (c, p, s) => { const ry = H * .09; c.fillStyle = p; c.beginPath(); c.ellipse(W / 2, 0, W * .62, ry, 0, 0, Math.PI); c.fill(); c.strokeStyle = s; c.lineWidth = 5; c.beginPath(); c.ellipse(W / 2, 0, W * .62, ry + 14, 0, 0, Math.PI); c.stroke(); c.fillStyle = p; c.fillRect(0, H - 46, W, 46); c.fillStyle = s; c.fillRect(0, H - 54, W, 5); },
  Diamond: (c, p, s) => { const d = (x, y, r) => { c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r, y); c.lineTo(x, y + r); c.lineTo(x - r, y); c.closePath(); c.fill(); }; c.fillStyle = p; for (let x = 30; x < W; x += 40) { d(x, 30, 9); d(x, H - 30, 9); } for (let y = 30; y < H; y += 40) { d(30, y, 9); d(W - 30, y, 9); } c.fillStyle = s; for (let x = 50; x < W - 20; x += 40) { d(x, 30, 4); d(x, H - 30, 4); } for (let y = 50; y < H - 20; y += 40) { d(30, y, 4); d(W - 30, y, 4); } c.strokeStyle = p; c.lineWidth = 2; c.strokeRect(54, 54, W - 108, H - 108); },
  Chevron: (c, p, s) => { [[s, 10], [p, 0]].forEach(([col, o]) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, 0); for (let x = 0; x <= W; x += 50) c.lineTo(x, 46 + o + (x / 50 % 2 ? 18 : 0)); c.lineTo(W, 0); c.fill(); c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 50) c.lineTo(x, H - 46 - o - (x / 50 % 2 ? 18 : 0)); c.lineTo(W, H); c.fill(); }); },
  Scallop: (c, p, s) => { c.fillStyle = p; const r = 16; for (let x = r; x < W + r; x += r * 2)[0, H].forEach(y => { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }); for (let y = r; y < H + r; y += r * 2)[0, W].forEach(x => { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }); c.strokeStyle = s; c.lineWidth = 3; c.strokeRect(34, 34, W - 68, H - 68); c.lineWidth = 1.5; c.strokeRect(42, 42, W - 84, H - 84); },
  Rays: (c, p, s) => { c.globalAlpha = .12; c.fillStyle = p; for (let i = 0; i < 18; i++) { c.beginPath(); c.moveTo(W / 2, -20); c.arc(W / 2, -20, Math.max(W, H) * 1.2, Math.PI * i / 18, Math.PI * (i + .5) / 18); c.fill(); } c.globalAlpha = 1; c.fillStyle = p; c.fillRect(0, H - 50, W, 50); c.fillStyle = s; c.fillRect(0, H - 58, W, 5); c.fillRect(0, 0, W, 8); },
  Guilloche: (c, p, s) => { for (let i = 0; i < 7; i++) { c.strokeStyle = i % 2 ? s : p; c.lineWidth = i % 3 ? 1 : 2.5; c.beginPath(); c.roundRect(14 + i * 7, 14 + i * 7, W - 28 - i * 14, H - 28 - i * 14, 10 + i * 3); c.stroke(); } c.fillStyle = s;[[24, 24], [W - 24, 24], [24, H - 24], [W - 24, H - 24]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 9, 0, 7); c.fill(); }); },
  Mosaic: (c, p, s) => { const q = 24;[[0, 0, 1, 1], [W, 0, -1, 1], [0, H, 1, -1], [W, H, -1, -1]].forEach(([x, y, a, b]) => { for (let i = 0; i < 7; i++) for (let j = 0; j < 7 - i; j++) { c.fillStyle = (i + j) % 2 ? s : p; c.fillRect(x + (a > 0 ? i * q : -(i + 1) * q), y + (b > 0 ? j * q : -(j + 1) * q), q, q); } }); },
  Splash: (c, p, s) => { c.fillStyle = s; c.beginPath(); c.moveTo(0, H * .9); c.lineTo(W, H * .8); c.lineTo(W, H * .84); c.lineTo(0, H * .94); c.fill(); c.fillStyle = p; c.beginPath(); c.moveTo(0, H * .94); c.lineTo(W, H * .84); c.lineTo(W, H); c.lineTo(0, H); c.fill(); c.beginPath(); c.moveTo(0, 0); c.lineTo(W * .32, 0); c.lineTo(0, H * .14); c.fill(); c.fillStyle = s; c.beginPath(); c.moveTo(W, 0); c.lineTo(W * .78, 0); c.lineTo(W, H * .1); c.fill(); },
  Pillar: (c, p, s) => { [0, W - 56].forEach(x => { const L = x === 0; c.fillStyle = p; c.fillRect(x, 0, 56, H); c.fillStyle = s; c.fillRect(L ? 56 : x - 6, 0, 6, H); c.fillRect(L ? 68 : x - 12.5, 0, 2.5, H); }); },
  Royal: (c, p, s) => { c.lineWidth = 14; c.strokeStyle = lg(c, 0, 0, W, H, p, s); c.strokeRect(24, 24, W - 48, H - 48); c.lineWidth = 2; c.strokeStyle = s; c.setLineDash([10, 6]); c.strokeRect(44, 44, W - 88, H - 88); c.setLineDash([]); [[44, 44], [W - 44, 44], [44, H - 44], [W - 44, H - 44]].forEach(([x, y]) => { c.fillStyle = p; c.beginPath(); c.arc(x, y, 13, 0, 7); c.fill(); c.fillStyle = s; c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill(); }); }
};
const PAL = [['Royal Burgundy', '#fffdf7', '#800020', '#d4af37'], ['Midnight Navy', '#f8fafc', '#0a192f', '#e6c687'], ['Emerald', '#f6fffa', '#065f46', '#d4af37'], ['Ocean', '#f0f9ff', '#0369a1', '#38bdf8'], ['Sunset', '#fff7ed', '#c2410c', '#f59e0b'], ['Violet', '#faf5ff', '#6d28d9', '#f0abfc'], ['Rose Gold', '#fff5f5', '#9f1239', '#e8b4a0'], ['Charcoal', '#ffffff', '#18181b', '#a1a1aa'], ['Cyber Neon', '#0b1020', '#22d3ee', '#a855f7', 1], ['Noir Gold', '#121212', '#d4af37', '#f5e6b3', 1]];
const SL = ['Frame', 'Waves', 'Corners', 'Ribbon', 'Bands', 'Dots', 'Burst', 'Stripes', 'Orbs', 'Glass', 'Arch', 'Diamond', 'Chevron', 'Scallop', 'Guilloche'];
const SP = ['Splash', 'Pillar', 'Royal', 'Mosaic', 'Rays', 'Waves', 'Corners', 'Frame', 'Glass', 'Burst', 'Arch', 'Scallop', 'Orbs', 'Diamond', 'Ribbon'];
const mkTH = (sty, off) => Array.from({ length: 30 }, (_, k) => { const P = PAL[(k * 7 + off) % 10], s = sty[k % 15]; return { name: `${P[0]} ${s}`, style: s, bg: P[1], primary: P[2], secondary: P[3], dark: !!P[4] }; });
const TH_L = mkTH(SL, 0), TH_P = mkTH(SP, 3); let TH = TH_L;   // 30 landscape + 30 A4 portrait, each style/palette pair is unique

function seal(c, p) {
  c.save(); c.translate(W / 2, H - 94); c.fillStyle = lg(c, -36, -36, 36, 36, '#f7e08a', '#b8891d'); c.beginPath();
  for (let i = 0; i < 48; i++) { const a = i * Math.PI / 24, r = i % 2 ? 34 : 40; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  c.closePath(); c.fill(); c.strokeStyle = p; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 27, 0, 7); c.stroke();
  c.fillStyle = p; c.font = 'bold 24px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('★', 0, 1); c.restore();
}
function paint(c, t) {
  c.fillStyle = t.bg; c.fillRect(0, 0, W, H);
  c.save(); ST[t.style](c, t.primary, t.secondary, t.dark); c.restore(); seal(c, t.primary);
}

/* border lines: independent overlay, also works on top of an uploaded template */
const along = (ins, step, fn) => { for (let x = ins + step / 2; x < W - ins; x += step) { fn(x, ins, 0); fn(x, H - ins, 0); } for (let y = ins + step / 2; y < H - ins; y += step) { fn(ins, y, 1); fn(W - ins, y, 1); } };
const BR = {
  Line: c => c.strokeRect(26, 26, W - 52, H - 52),
  Double: (c, w) => { c.strokeRect(22, 22, W - 44, H - 44); c.lineWidth = w / 2; c.strokeRect(34, 34, W - 68, H - 68); },
  Triple: (c, w) => { c.strokeRect(20, 20, W - 40, H - 40); c.lineWidth = w / 2; c.strokeRect(30, 30, W - 60, H - 60); c.lineWidth = w / 3; c.strokeRect(38, 38, W - 76, H - 76); },
  Dashed: c => { c.setLineDash([14, 9]); c.strokeRect(28, 28, W - 56, H - 56); },
  Dotted: (c, w) => { c.lineCap = 'round'; c.setLineDash([0, w * 3.2]); c.strokeRect(28, 28, W - 56, H - 56); },
  Rounded: c => { c.beginPath(); c.roundRect(26, 26, W - 52, H - 52, 32); c.stroke(); },
  Brackets: c => { const L = 70, i = 24;[[i, i, 1, 1], [W - i, i, -1, 1], [i, H - i, 1, -1], [W - i, H - i, -1, -1]].forEach(([x, y, a, b]) => { c.beginPath(); c.moveTo(x + a * L, y); c.lineTo(x, y); c.lineTo(x, y + b * L); c.stroke(); }); },
  Ornate: (c, w) => { BR.Brackets(c); c.lineWidth = w / 2; c.strokeRect(34, 34, W - 68, H - 68);[[24, 24], [W - 24, 24], [24, H - 24], [W - 24, H - 24]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 9, 0, 7); c.fill(); }); },
  Notched: c => { const n = 34, a = 24; c.beginPath(); c.moveTo(a + n, a); c.lineTo(W - a - n, a); c.lineTo(W - a, a + n); c.lineTo(W - a, H - a - n); c.lineTo(W - a - n, H - a); c.lineTo(a + n, H - a); c.lineTo(a, H - a - n); c.lineTo(a, a + n); c.closePath(); c.stroke(); },
  Wave: c => { [30, H - 30].forEach(y => { c.beginPath(); for (let x = 0; x <= W; x += 6) c.lineTo(x, y + Math.sin(x / 22) * 8); c.stroke(); }); [30, W - 30].forEach(x => { c.beginPath(); for (let y = 0; y <= H; y += 6) c.lineTo(x + Math.sin(y / 22) * 8, y); c.stroke(); }); },
  Scallop: c => along(30, 22, (x, y) => { c.beginPath(); c.arc(x, y, 10, 0, 7); c.stroke(); }),
  Zigzag: c => along(30, 16, (x, y, v) => { c.beginPath(); if (v) { c.moveTo(x - 4, y - 6); c.lineTo(x + 4, y); c.lineTo(x - 4, y + 6); } else { c.moveTo(x - 6, y - 4); c.lineTo(x, y + 4); c.lineTo(x + 6, y - 4); } c.stroke(); }),
  Diamonds: c => { along(30, 26, (x, y) => { c.beginPath(); c.moveTo(x, y - 7); c.lineTo(x + 7, y); c.lineTo(x, y + 7); c.lineTo(x - 7, y); c.closePath(); c.fill(); }); c.lineWidth = 1.5; c.strokeRect(48, 48, W - 96, H - 96); },
  Film: c => { along(26, 20, (x, y) => c.fillRect(x - 4, y - 4, 8, 8)); c.lineWidth = 1.5; c.strokeRect(44, 44, W - 88, H - 88); },
  Sparkle: c => along(30, 34, (x, y) => { c.beginPath(); c.moveTo(x, y - 9); c.quadraticCurveTo(x, y, x + 9, y); c.quadraticCurveTo(x, y, x, y + 9); c.quadraticCurveTo(x, y, x - 9, y); c.quadraticCurveTo(x, y, x, y - 9); c.fill(); })
};
function drawBorder(c, b) { c.save(); c.strokeStyle = c.fillStyle = b.col; c.lineWidth = b.w; c.lineJoin = 'round'; (BR[b.style] || BR.Line)(c, b.w); c.restore(); }

/* ---------- editor state (pure JSON, so undo/redo is a snapshot) ---------- */
let uid = 0, selId = null, showId = true, G = {}, drag = null, inl = null;
const multi = new Set();   // extra selected ids (shift-click); selId is the primary
let DATA = {};              // recipient name -> row of imported columns (lower-case keys)
let list = ["M. S. Dhoni", "Cristiano Ronaldo", "Lewis Hamilton"];
const T = (role, text, x, y, font, size, color, extra = {}) => ({ id: ++uid, k: 't', role, text, x, y, ox: x, oy: y, font, size, color, cs: 'original', ...extra });
function authSet(g, x, n, d) { return [T('authName', n, x, fy('authName'), 'Montserrat', 16, '#202124', { grp: g }), T('authDesig', d, x, fy('authDesig'), 'Inter', 13, '#5f6368', { grp: g })]; }
let S = {
  tpl: 0, bg: null, border: null, w: 1000, h: 700, items: [
    T('title', 'CERTIFICATE OF ACHIEVEMENT', W / 2, fy('title'), 'Cinzel Decorative', 36, '#800020', { cs: 'upper' }),
    T('lead', 'THIS IS PROUDLY PRESENTED TO', W / 2, fy('lead'), 'Poppins', 15, '#333333', { cs: 'upper' }),
    T('name', 'M. S. Dhoni', W / 2, fy('name'), 'Great Vibes', 62, '#111111'),
    T('subtitle', 'for outstanding performance, leadership, and dedicated service.', W / 2, fy('subtitle'), 'Lora', 18, '#3c4043'),
    ...authSet(1, 333, 'Dr. Robert Vance', 'Director of Education'), ...authSet(2, 667, 'Elena Rostova', 'Head of Operations')
  ]
};
const sel = () => S.items.find(i => i.id === selId);
const byRole = r => S.items.find(i => i.role === r);
const nameText = () => (byRole('name') || {}).text || '';
const fmt = (t, c) => !t ? '' : c === 'upper' ? t.toUpperCase() : c === 'lower' ? t.toLowerCase() : c === 'title' ? t.toLowerCase().replace(/(^|\s)\S/g, m => m.toUpperCase()) : t;
const ROLES = { title: 'Header Title', lead: 'Lead Text', name: 'Recipient Name', subtitle: 'Description', logo: 'Logo', image: 'Image', badge: 'Badge' };
const label = i => ROLES[i.role] || (i.role === 'authName' ? `Authority ${i.grp} Name` : i.role === 'authDesig' ? `Authority ${i.grp} Designation` : i.role === 'sig' ? `Signature ${i.grp}` : 'Text: ' + (i.text || '').slice(0, 18));

/* ---------- rendering ---------- */
const FL = new Set();
const themeOf = () => ({ ...(TH[S.tpl] || TH[0]), ...(S.tint || {}) });
const hash = s => { let h = 5381; for (const c of s) h = ((h * 33) ^ c.charCodeAt(0)) >>> 0; return h.toString(36).toUpperCase().padStart(4, '0').slice(-4); };
const certId = n => `CERT-${new Date().getFullYear()}-${String(Math.max(list.indexOf(n), 0) + 1).padStart(3, '0')}-${hash(n)}`;
const today = () => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
/* {{Column}} placeholders: filled per recipient from the imported file (plus {{Name}} {{Date}} {{ID}} {{Number}}) */
const sub = (t, n) => !t || !t.includes('{{') ? t : t.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (m, k) => {
  k = k.toLowerCase(); const r = DATA[n] || {};
  return k === 'name' ? n : r[k] ? r[k] : k === 'date' ? today() : k === 'id' ? certId(n) : k === 'number' ? String(list.indexOf(n) + 1) : m;
});
const FOIL = (c, x, y, w, h) => { const g = c.createLinearGradient(x, y, x + w, y + h);['#8a6a1a', '#f7e08a', '#c9a227', '#fff3b0', '#a77c16'].forEach((col, i, a) => g.addColorStop(i / (a.length - 1), col)); return g; };

/* Badge & seal library (drawn in a -0.5..0.5 unit square) */
const gold = c => lg(c, -.5, -.5, .5, .5, '#fff1a8', '#b8891d');
const burst = (c, n, r1, r2, rot = 0) => { c.beginPath(); for (let i = 0; i < n * 2; i++) { const a = i * Math.PI / n + rot, r = i % 2 ? r1 : r2; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); };
const ring = (c, r, col, w = .02) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.arc(0, 0, r, 0, 7); c.stroke(); };
const star = (c, col) => { c.fillStyle = col; burst(c, 5, .08, .2, -Math.PI / 2); c.fill(); };
const tails = (c, p) => { c.fillStyle = p;[-1, 1].forEach(d => { c.beginPath(); c.moveTo(d * .04, .2); c.lineTo(d * .3, .64); c.lineTo(d * .19, .56); c.lineTo(d * .1, .7); c.closePath(); c.fill(); }); };
const BD = {
  Rosette: (c, p) => { c.translate(0, -.1); c.scale(.78, .78); tails(c, p); c.fillStyle = gold(c); burst(c, 20, .42, .48); c.fill(); ring(c, .3, p); star(c, p); },
  Medal: (c, p) => { c.fillStyle = p; c.beginPath(); c.moveTo(-.22, -.5); c.lineTo(0, -.1); c.lineTo(.22, -.5); c.closePath(); c.fill(); c.fillStyle = gold(c); c.beginPath(); c.arc(0, .12, .3, 0, 7); c.fill(); c.translate(0, .12); ring(c, .22, p); star(c, p); },
  Starburst: (c, p) => { c.fillStyle = gold(c); burst(c, 12, .4, .5); c.fill(); c.fillStyle = p; c.beginPath(); c.arc(0, 0, .3, 0, 7); c.fill(); star(c, '#f2d46b'); },
  Laurel: (c, p) => { c.fillStyle = gold(c); for (let i = 0; i < 16; i++) { c.save(); c.rotate(i * Math.PI / 8); c.translate(.38, 0); c.beginPath(); c.ellipse(0, 0, .1, .045, 0, 0, 7); c.fill(); c.restore(); } c.fillStyle = p; c.beginPath(); c.arc(0, 0, .28, 0, 7); c.fill(); ring(c, .28, '#f2d46b'); star(c, '#f2d46b'); },
  Wax: (c, p) => { c.fillStyle = p; burst(c, 14, .4, .47); c.fill(); ring(c, .32, '#f2d46b'); star(c, '#f2d46b'); },
  Shield: (c, p) => { const path = () => { c.beginPath(); c.moveTo(-.34, -.4); c.lineTo(.34, -.4); c.lineTo(.34, .05); c.quadraticCurveTo(.34, .36, 0, .5); c.quadraticCurveTo(-.34, .36, -.34, .05); c.closePath(); }; path(); c.fillStyle = gold(c); c.fill(); c.save(); c.scale(.8, .8); path(); c.fillStyle = p; c.fill(); c.restore(); star(c, '#f2d46b'); },
  Hexagon: (c, p) => { c.fillStyle = gold(c); burst(c, 3, .46, .46); c.fill(); c.save(); c.scale(.8, .8); c.fillStyle = p; burst(c, 3, .46, .46); c.fill(); c.restore(); star(c, '#f2d46b'); },
  Verified: (c, p) => { c.fillStyle = gold(c); burst(c, 10, .43, .5); c.fill(); c.strokeStyle = p; c.lineWidth = .07; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(-.18, .02); c.lineTo(-.04, .16); c.lineTo(.2, -.14); c.stroke(); },
  Crown: (c, p) => { c.fillStyle = gold(c); c.beginPath(); c.moveTo(-.4, .22); c.lineTo(-.4, -.15); c.lineTo(-.2, .02); c.lineTo(0, -.3); c.lineTo(.2, .02); c.lineTo(.4, -.15); c.lineTo(.4, .22); c.closePath(); c.fill(); c.fillStyle = p; c.fillRect(-.4, .25, .8, .1);[-.4, 0, .4].forEach(x => { c.beginPath(); c.arc(x, x ? -.15 : -.3, .045, 0, 7); c.fill(); }); },
  Trophy: (c, p) => { c.fillStyle = gold(c); c.beginPath(); c.moveTo(-.22, -.36); c.lineTo(.22, -.36); c.quadraticCurveTo(.22, .1, 0, .14); c.quadraticCurveTo(-.22, .1, -.22, -.36); c.fill(); c.fillRect(-.04, .13, .08, .15); c.strokeStyle = '#d9ac3f'; c.lineWidth = .04;[-1, 1].forEach(d => { c.beginPath(); c.arc(d * .27, -.2, .09, 0, 7); c.stroke(); }); c.fillStyle = p; c.fillRect(-.18, .28, .36, .08); },
  Banner: (c, p) => { c.fillStyle = gold(c);[-1, 1].forEach(d => { c.beginPath(); c.moveTo(d * .34, -.02); c.lineTo(d * .5, -.02); c.lineTo(d * .42, .1); c.lineTo(d * .5, .22); c.lineTo(d * .34, .22); c.closePath(); c.fill(); }); c.fillStyle = p; c.fillRect(-.36, -.14, .72, .3); star(c, '#f2d46b'); },
  Diamond: (c, p) => { c.fillStyle = gold(c); c.beginPath(); c.moveTo(-.34, -.12); c.lineTo(-.18, -.34); c.lineTo(.18, -.34); c.lineTo(.34, -.12); c.lineTo(0, .38); c.closePath(); c.fill(); c.strokeStyle = p; c.lineWidth = .022; c.beginPath(); c.moveTo(-.34, -.12); c.lineTo(.34, -.12); c.moveTo(-.18, -.34); c.lineTo(-.08, -.12); c.lineTo(0, .38); c.moveTo(.18, -.34); c.lineTo(.08, -.12); c.lineTo(0, .38); c.stroke(); },
  Petal: (c, p) => { c.fillStyle = gold(c); for (let i = 0; i < 8; i++) { c.save(); c.rotate(i * Math.PI / 4); c.translate(.26, 0); c.beginPath(); c.ellipse(0, 0, .16, .09, 0, 0, 7); c.fill(); c.restore(); } c.fillStyle = p; c.beginPath(); c.arc(0, 0, .22, 0, 7); c.fill(); star(c, '#f2d46b'); },
  Stamp: (c, p) => { c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, .47, 0, 7); c.fill(); ring(c, .44, p, .035); ring(c, .36, p, .012); c.fillStyle = p; for (let i = 0; i < 28; i++) { const a = i * Math.PI / 14; c.beginPath(); c.arc(Math.cos(a) * .4, Math.sin(a) * .4, .012, 0, 7); c.fill(); } star(c, p); },
  GradCap: (c, p) => { c.fillStyle = p; c.beginPath(); c.moveTo(0, -.3); c.lineTo(.46, -.08); c.lineTo(0, .14); c.lineTo(-.46, -.08); c.closePath(); c.fill(); c.fillStyle = gold(c); c.beginPath(); c.moveTo(-.26, .02); c.lineTo(-.26, .2); c.quadraticCurveTo(0, .34, .26, .2); c.lineTo(.26, .02); c.lineTo(0, .14); c.closePath(); c.fill(); c.strokeStyle = '#d9ac3f'; c.lineWidth = .03; c.beginPath(); c.moveTo(.4, -.06); c.lineTo(.4, .2); c.stroke(); },
  Book: (c, p) => { c.fillStyle = gold(c);[-1, 1].forEach(d => { c.beginPath(); c.moveTo(d * .42, -.2); c.lineTo(d * .02, -.12); c.lineTo(d * .02, .28); c.lineTo(d * .42, .2); c.closePath(); c.fill(); }); c.strokeStyle = p; c.lineWidth = .025; c.beginPath(); c.moveTo(0, -.12); c.lineTo(0, .28); c.stroke();[-.04, .04, .12].forEach(y => { [-1, 1].forEach(d => { c.beginPath(); c.moveTo(d * .1, y - .04); c.lineTo(d * .34, y - .08); c.stroke(); }); }); },
  Bolt: (c, p) => { c.fillStyle = gold(c); c.beginPath(); c.moveTo(.1, -.42); c.lineTo(-.26, .06); c.lineTo(-.04, .06); c.lineTo(-.14, .42); c.lineTo(.26, -.08); c.lineTo(.04, -.08); c.closePath(); c.fill(); },
  Heart: (c, p) => { c.fillStyle = gold(c); c.beginPath(); c.moveTo(0, .36); c.bezierCurveTo(-.55, 0, -.3, -.36, 0, -.12); c.bezierCurveTo(.3, -.36, .55, 0, 0, .36); c.fill(); }
};
function drawBadge(c, style, x, y, s, col) { c.save(); c.translate(x, y); c.scale(s, s); c.shadowColor = 'rgba(0,0,0,.28)'; c.shadowBlur = 6; (BD[style] || BD.Rosette)(c, col || '#800020'); c.restore(); }

function render(o = {}) {
  const sc = o.scale || 1; canvas.width = W * sc; canvas.height = H * sc; ctx.setTransform(sc, 0, 0, sc, 0, 0);
  const th = themeOf(), cur = o.name != null ? o.name : nameText();
  if (S.bg && IM[S.bg]) ctx.drawImage(IM[S.bg], 0, 0, W, H); else paint(ctx, th);
  if (S.border) drawBorder(ctx, S.border);
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  const ng = groups().length || 1;
  S.items.forEach(it => {
    if (it.hide) { it._b = null; return; }
    if (it.k !== 't') {
      if (it.k === 'i') { const im = IM[it.src]; if (im) ctx.drawImage(im, it.x - it.w / 2, it.y - it.h / 2, it.w, it.h); }
      else drawBadge(ctx, it.style, it.x, it.y, it.w, it.col);
      it._b = { x: it.x - it.w / 2, y: it.y - it.h / 2, w: it.w, h: it.h }; return;
    }
    const t = fmt(it.role === 'name' ? cur : sub(it.text, cur), it.cs), maxW = it.role === 'name' ? W * .84 : it.grp ? Math.min(230, W / (ng + 1) - 16) : W * .72;
    const fnt = z => `${it.ital ? 'italic ' : ''}${it.bold ? 'bold ' : ''}${z}px "${it.font}"`, LS = 'letterSpacing' in ctx;
    let s = it.size; ctx.font = fnt(s); if (LS) ctx.letterSpacing = (it.ls || 0) + 'px';
    if (it.role === 'name') while (s > 14 && ctx.measureText(t).width > maxW) { s -= 2; ctx.font = fnt(s); }
    const lines = []; let line = '';
    (t || ' ').split(' ').forEach(w => { const test = line ? line + ' ' + w : w; if (line && ctx.measureText(test).width > maxW) { lines.push(line); line = w; } else line = test; });
    lines.push(line);
    const w = Math.max(40, ...lines.map(l => ctx.measureText(l).width)), h = s * 1.25 + (lines.length - 1) * (s + 6);
    ctx.fillStyle = it.foil ? FOIL(ctx, it.x - w / 2, it.y - s, w, h) : it.color;
    if (it.shadow) { ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3; }
    lines.forEach((l, n) => ctx.fillText(l, it.x, it.y + n * (s + 6)));
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; if (LS) ctx.letterSpacing = '0px';
    it._b = { x: it.x - w / 2, y: it.y - s, w, h };
  });
  if (showId && list.includes(cur)) {
    const dk = th.dark && !S.bg; ctx.fillStyle = dk ? 'rgba(15,15,25,.85)' : 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.roundRect(W / 2 - 100, H - 26, 200, 18, 9); ctx.fill();
    ctx.font = '11px Inter'; ctx.fillStyle = dk ? '#94a3b8' : '#6b7280'; ctx.fillText(certId(cur), W / 2, H - 13);
  }
  if (!o.clean) overlay();
  S.items.forEach(i => { if (i.k === 't' && !FL.has(i.font)) { FL.add(i.font); document.fonts.load(`20px "${i.font}"`).then(() => { render(); buildStrip(); }); } });
}
function overlay() {
  ctx.save();
  if (G.x || G.y) { ctx.strokeStyle = '#ff2d95'; ctx.setLineDash([6, 5]); ctx.lineWidth = 1.2; ctx.beginPath(); if (G.x) { ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); } if (G.y) { ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); } ctx.stroke(); }
  const all = selAll(), k = W / canvas.getBoundingClientRect().width, p = 6 * k;
  all.forEach(it => {
    const b = it._b; if (!b) return;
    ctx.setLineDash([6 * k, 4 * k]); ctx.lineWidth = 1.6 * k; ctx.strokeStyle = it.lock ? '#f59e0b' : '#8b5cf6'; ctx.strokeRect(b.x - p, b.y - p, b.w + 2 * p, b.h + 2 * p); ctx.setLineDash([]);
    if (all.length === 1 && !it.lock) {   // resize handles: top-left, bottom-left, bottom-right
      ctx.fillStyle = '#fff'; ctx.lineWidth = 2 * k;
      [[b.x - p, b.y - p], [b.x - p, b.y + b.h + p], [b.x + b.w + p, b.y + b.h + p]].forEach(([x, y]) => { ctx.beginPath(); ctx.roundRect(x - 6 * k, y - 6 * k, 12 * k, 12 * k, 3 * k); ctx.fill(); ctx.stroke(); });
    }
  });
  const it = sel();
  if (it && it._b && all.length === 1 && !it.lock) {
    const b = it._b, cx = b.x + b.w + p, cy = b.y - p, r = 11 * k;  // removable "x" badge, like Canva
    ctx.fillStyle = '#f43f5e'; ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 6; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 * k; ctx.lineCap = 'round'; ctx.beginPath(); const d = r * .4; ctx.moveTo(cx - d, cy - d); ctx.lineTo(cx + d, cy + d); ctx.moveTo(cx + d, cy - d); ctx.lineTo(cx - d, cy + d); ctx.stroke();
  }
  ctx.restore();
}

/* ---------- history: undo / redo ---------- */
let hist = [], hp = -1, ct;
const snap = () => JSON.stringify(S, (k, v) => k[0] === '_' ? undefined : v);
function btns() { $('undoBtn').disabled = hp <= 0; $('redoBtn').disabled = hp >= hist.length - 1; }
function commit() {
  const s = snap(); if (hist[hp] === s) return;
  hist = hist.slice(0, hp + 1); hist.push(s); if (hist.length > 60) hist.shift(); hp = hist.length - 1; btns(); refreshTargets(); autosave();
}
const commitSoon = () => { clearTimeout(ct); ct = setTimeout(commit, 450); };
function restore(i) { hp = i; S = JSON.parse(hist[i]); if (!sel()) selId = null; refreshAll(); btns(); }
function undo() { clearTimeout(ct); commit(); if (hp > 0) restore(hp - 1); }
function redo() { clearTimeout(ct); if (hp < hist.length - 1) restore(hp + 1); }
$('undoBtn').onclick = undo; $('redoBtn').onclick = redo;

function refreshAll() {
  render(); buildAuth(); refreshTargets(); syncTypo(); markGallery(); dock(); buildStrip(); alignBarUpdate();
  if (list.includes(nameText())) $('previewSelect').value = nameText();
}

/* ---------- toast ---------- */
const bar = $('toast'); let tm;
function say(msg, pct) {
  bar.firstElementChild.textContent = msg; bar.lastElementChild.style.width = (pct || 0) + '%';
  bar.classList.add('show'); clearTimeout(tm); if (pct == null || pct >= 100) tm = setTimeout(() => bar.classList.remove('show'), 2600);
}

/* ---------- selection, docks and modals ---------- */
const selAll = () => S.items.filter(i => i.id === selId || multi.has(i.id));
function pick(id, add) {
  if (add && id && selId && id !== selId) { multi.has(id) ? multi.delete(id) : multi.add(id); }
  else if (!(add && id === selId)) { multi.clear(); selId = id; }
  if (!sel()) { selId = null; multi.clear(); }
  syncTypo(); dock(); render(); alignBarUpdate();
}
function dock() {
  const m = document.querySelector('.glass-modal.active');
  $('ctxPanel').classList.toggle('show', !!selId && !m);
  document.body.classList.toggle('docked', !!m || !!selId);
}
function closeModals() {
  document.querySelectorAll('.glass-modal').forEach(m => m.classList.remove('active'));
  document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
}
function openModal(id) {
  const was = $(id).classList.contains('active'); closeModals();
  if (!was) {
    $(id).classList.add('active'); document.querySelector(`.menu-btn[data-modal="${id}"]`).classList.add('active');
    if (id === 'modal-fonts') { if (!sel()) { const f = S.items.find(i => i.k === 't'); if (f) selId = f.id; } refreshTargets(); syncTypo(); render(); }
    if (id === 'modal-authorities') buildAuth();
    if (id === 'modal-layers') buildLayers();
  }
  dock();
}
document.querySelectorAll('.menu-btn').forEach(b => b.onclick = () => openModal(b.dataset.modal));
document.querySelectorAll('.close-modal').forEach(b => { const m = b.closest('.glass-modal'); if (m) b.onclick = () => { closeModals(); dock(); }; });

function removeSel() {
  const all = selAll().filter(i => !i.lock); if (!all.length) return say('Locked layers can’t be removed — unlock them first', 100);
  const n = all.length > 1 ? `${all.length} items` : label(all[0]);
  S.items = S.items.filter(x => !all.includes(x)); selId = null; multi.clear(); refreshAll(); commit(); say(`Removed “${n}” — press Undo to bring it back`, 100);
}

/* ---------- typography (modal + floating panel share the same controls) ---------- */
const typoHTML = p => `
  <div class="field"><label>Font Family</label><select id="${p}Font" class="glass-input"></select></div>
  <div class="field-row">
    <div class="field"><label>Font Size (px)</label><input type="number" id="${p}Size" class="glass-input" min="6" max="300" /><input type="range" id="${p}SizeR" min="8" max="140" /></div>
    <div class="field"><label>Text Color</label><input type="color" id="${p}Color" class="glass-input color-picker" /></div>
  </div>
  <div class="field"><label>Style & Effects</label>
    <div class="btn-group">
      <button class="glass-btn small tg" data-tg="bold"><b>B</b></button><button class="glass-btn small tg" data-tg="ital"><i>I</i></button>
      <button class="glass-btn small tg" data-tg="shadow">Shadow</button><button class="glass-btn small tg" data-tg="foil">🥇 Foil</button>
    </div>
  </div>
  <div class="field"><label>Letter Spacing</label><input type="range" id="${p}Ls" min="-2" max="20" step=".5" /></div>
  <div class="field"><label>Text Case Transformation</label>
    <div class="btn-group">
      <button class="glass-btn small cs" data-case="original">Normal</button><button class="glass-btn small cs" data-case="lower">lowercase</button>
      <button class="glass-btn small cs" data-case="upper">UPPERCASE</button><button class="glass-btn small cs" data-case="title">Title Case</button>
    </div>
  </div>`;
$('mTypo').innerHTML = typoHTML('m'); $('cTypo').innerHTML = typoHTML('c');
const textSel = () => { const it = sel(); return it && it.k === 't' ? it : null; };
const texts = () => selAll().filter(i => i.k === 't' && !i.lock);
['m', 'c'].forEach(p => {
  FONTS.forEach(f => $(p + 'Font').add(new Option(f, f)));
  const apply = (f, src) => {      // only the field you touched is applied, to every selected text
    const ts = texts(); if (!ts.length) return; const v = parseFloat($(p + (src === 'r' ? 'SizeR' : 'Size')).value);
    ts.forEach(it => { if (f === 'font') it.font = $(p + 'Font').value; if (f === 'color') it.color = $(p + 'Color').value; if (f === 'size' && v) it.size = Math.max(6, Math.min(300, v)); if (f === 'ls') it.ls = +$(p + 'Ls').value; });
    render(); syncTypo(); commitSoon();
  };
  $(p + 'Font').onchange = () => apply('font'); $(p + 'Color').oninput = () => apply('color'); $(p + 'Ls').oninput = () => apply('ls');
  $(p + 'Size').oninput = () => apply('size', 'n'); $(p + 'SizeR').oninput = () => apply('size', 'r');
  document.querySelectorAll(`#${p}Typo .cs`).forEach(b => b.onclick = () => { texts().forEach(it => it.cs = b.dataset.case); render(); syncTypo(); commit(); });
  document.querySelectorAll(`#${p}Typo .tg`).forEach(b => b.onclick = () => { const f = textSel(); if (!f) return; const nv = !f[b.dataset.tg]; texts().forEach(it => it[b.dataset.tg] = nv); render(); syncTypo(); commit(); });
});
const personalMap = { personalNameInput: 'name', personalTitleInput: 'title', personalLeadInput: 'lead', personalSubtitleInput: 'subtitle' };
function syncTypo() {
  const it = sel(), t = !!textSel(), n = selAll().length;
  $('cLabel').textContent = n > 1 ? `${n} items selected` : it ? label(it) : 'Selected';
  $('cTextBox').hidden = !t || n > 1; $('cTypo').hidden = !t; $('cImgBox').hidden = !(it && it.k !== 't') || n > 1;
  $('cImgColF').hidden = !(it && it.k === 'b');
  ['m', 'c'].forEach(p => {
    const set = (id, v) => { const e = $(p + id); if (e !== document.activeElement) e.value = v; };
    $(p + 'Typo').classList.toggle('off', !t);
    if (t) { set('Font', it.font); set('Size', it.size); set('SizeR', it.size); set('Color', it.color); set('Ls', it.ls || 0); }
    document.querySelectorAll(`#${p}Typo .cs`).forEach(b => b.classList.toggle('active', t && b.dataset.case === it.cs));
    document.querySelectorAll(`#${p}Typo .tg`).forEach(b => b.classList.toggle('active', t && !!it[b.dataset.tg]));
  });
  if (t && $('cText') !== document.activeElement) $('cText').value = it.text;
  if (it && it.k !== 't') { $('cImgW').value = it.w; if (it.col) $('cImgCol').value = it.col; }
  $('mTarget').value = selId || ''; markLayers();
  Object.entries(personalMap).forEach(([id, r]) => { const e = $(id), x = byRole(r); if (x && e !== document.activeElement) e.value = x.text; });
}
function refreshTargets() { const s = $('mTarget'); s.innerHTML = ''; S.items.forEach(i => s.add(new Option(label(i), i.id))); s.value = selId || ''; buildLayers(); }
$('mTarget').onchange = e => pick(+e.target.value);
$('cText').oninput = e => { const it = textSel(); if (!it) return; it.text = e.target.value; render(); syncTypo(); commitSoon(); };
$('cImgW').oninput = e => { const it = sel(); if (!it || it.k === 't') return; const w = +e.target.value; it.h = it.h * w / it.w; it.w = w; render(); commitSoon(); };
$('cImgCol').oninput = e => { const it = sel(); if (it) { it.col = e.target.value; render(); commitSoon(); } };
$('cDel').onclick = removeSel; $('cClose').onclick = () => pick(null);
$('cReset').onclick = () => { selAll().filter(i => !i.lock).forEach(i => { i.x = i.ox; i.y = i.oy; }); render(); commit(); };

/* ---------- canvas interaction + zoom + resize handles ---------- */
let zoom = null, pinch = null, rs = null, lastTap = {};
const vp = document.querySelector('.canvas-viewport');
const zoomNow = () => zoom || canvas.getBoundingClientRect().width / W;
function applyFit() {   // fit the page to the screen (width AND height), for landscape and portrait
  if (zoom) return; const cs = getComputedStyle(vp), avail = vp.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const w = Math.max(240, Math.min(avail, W, innerHeight * .86 * W / H)); canvas.style.width = w + 'px'; canvas.style.maxWidth = 'none'; $('zoomLbl').textContent = Math.round(w / W * 100) + '%';
}
function setZoom(z) {
  if (z == null) { zoom = null; applyFit(); }
  else { zoom = Math.max(.3, Math.min(3, z)); canvas.style.width = W * zoom + 'px'; canvas.style.maxWidth = 'none'; $('zoomLbl').textContent = Math.round(zoom * 100) + '%'; }
  render();
}
$('zoomIn').onclick = () => setZoom(zoomNow() * 1.2); $('zoomOut').onclick = () => setZoom(zoomNow() / 1.2); $('zoomFit').onclick = () => setZoom(null);
vp.addEventListener('wheel', e => { if (e.ctrlKey) { e.preventDefault(); setZoom(zoomNow() * (e.deltaY < 0 ? 1.1 : .9)); } }, { passive: false });
const d2 = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
canvas.addEventListener('touchstart', e => { if (e.touches.length === 2) { drag = null; rs = null; pinch = { d: d2(e.touches), z: zoomNow() }; } }, { passive: true });
canvas.addEventListener('touchmove', e => { if (pinch && e.touches.length === 2) { e.preventDefault(); setZoom(pinch.z * d2(e.touches) / pinch.d); } }, { passive: false });
canvas.addEventListener('touchend', e => { if (e.touches.length < 2) pinch = null; });

const pt = e => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height, k: W / r.width }; };
const hit = p => { for (let n = S.items.length - 1; n >= 0; n--) { const b = S.items[n]._b; if (b && p.x >= b.x - 8 && p.x <= b.x + b.w + 8 && p.y >= b.y - 8 && p.y <= b.y + b.h + 8) return S.items[n]; } return null; };
const onX = p => { const it = sel(); if (!it || !it._b || it.lock || selAll().length > 1) return false; const b = it._b; return Math.hypot(p.x - (b.x + b.w + 6 * p.k), p.y - (b.y - 6 * p.k)) < 14 * p.k; };
function handleAt(p) {   // which resize handle (if any) is under the pointer
  const it = sel(); if (!it || !it._b || it.lock || selAll().length > 1) return null; const b = it._b, d = 6 * p.k;
  const hs = { tl: [b.x - d, b.y - d], bl: [b.x - d, b.y + b.h + d], br: [b.x + b.w + d, b.y + b.h + d] };
  for (const k in hs) if (Math.hypot(p.x - hs[k][0], p.y - hs[k][1]) < 16 * p.k) return k; return null;
}
const tip = $('hoverTip');
const showTip = (e, t) => { if (!t) return tip.classList.remove('show'); tip.textContent = t; tip.style.left = Math.min(e.clientX + 14, innerWidth - 250) + 'px'; tip.style.top = e.clientY + 18 + 'px'; tip.classList.add('show'); };

canvas.addEventListener('pointerdown', e => {
  if (pinch) return;
  const p = pt(e); closeInline(); showTip(e, null);
  if (onX(p)) return removeSel();
  const hd = handleAt(p);
  if (hd) {   // start resizing the selected item from a corner handle
    const it = sel(), b = { ...it._b }, an = hd === 'tl' ? [b.x + b.w, b.y + b.h] : hd === 'bl' ? [b.x + b.w, b.y] : [b.x, b.y];
    rs = { it, hd, b, ax: an[0], ay: an[1], h0: it.h, s0: it.size }; canvas.setPointerCapture(e.pointerId); return;
  }
  const h = hit(p); if (h) closeModals(); pick(h ? h.id : null, e.shiftKey);
  if (h && h.k === 't' && e.pointerType === 'touch') {   // double-tap to type on phones
    const now = Date.now(); if (lastTap.id === h.id && now - lastTap.t < 350 && !h.lock) openInline(h); lastTap = { id: h.id, t: now };
  }
  if (h && !h.lock && selAll().includes(h)) {
    drag = { it: h, px: p.x, py: p.y, sx: e.clientX, sy: e.clientY, moved: false, all: selAll().filter(i => !i.lock).map(i => [i, i.x, i.y]) };
    canvas.setPointerCapture(e.pointerId);
  }
});
canvas.addEventListener('pointermove', e => {
  const p = pt(e);
  if (rs) {
    const { it, hd, b } = rs;
    if (it.k === 't') { const nw = Math.max(20, 2 * Math.abs(p.x - it.x)); it.size = Math.max(6, Math.min(300, rs.s0 * nw / b.w)); }
    else {
      const sx = hd === 'br' ? 1 : -1, sy = hd === 'tl' ? -1 : 1, nw = Math.max(24, (p.x - rs.ax) * sx);
      it.w = nw; it.h = Math.max(8, rs.h0 * nw / b.w); it.x = rs.ax + sx * it.w / 2; it.y = rs.ay + sy * it.h / 2;
    }
    render(); syncTypo(); return;
  }
  if (drag) {
    if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 4) return;
    drag.moved = true; const a0 = drag.all.find(a => a[0] === drag.it); if (!a0) return;
    let dx = p.x - drag.px, dy = p.y - drag.py; G = {};
    if (Math.abs(a0[1] + dx - W / 2) < 8) { dx = W / 2 - a0[1]; G.x = 1; } if (Math.abs(a0[2] + dy - H / 2) < 8) { dy = H / 2 - a0[2]; G.y = 1; }
    drag.all.forEach(([i, x, y]) => { i.x = Math.max(0, Math.min(W, x + dx)); i.y = Math.max(0, Math.min(H, y + dy)); }); render(); return;
  }
  const x = onX(p), hd = handleAt(p), h = x ? sel() : hd ? sel() : hit(p);
  canvas.style.cursor = x ? 'pointer' : hd ? (hd === 'bl' ? 'nesw-resize' : 'nwse-resize') : h ? (h.lock ? 'not-allowed' : 'move') : 'default';
  showTip(e, h ? (x ? '✕ Click to remove this field' : hd ? '↔ Drag to resize' : h.lock ? `${label(h)} — 🔒 locked (unlock it in Layers)` : `${label(h)} — click to select, drag to move${h.k === 't' ? ', double-click to type' : ''}`) : null);
});
const endDrag = () => { if ((drag && drag.moved) || rs) commit(); drag = null; rs = null; G = {}; render(); };
canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('pointerleave', () => showTip(null, null));
canvas.addEventListener('dblclick', e => { const h = hit(pt(e)); if (h && h.k === 't' && !h.lock) { pick(h.id); openInline(h); } });

function closeInline() { if (inl) { const i = inl; inl = null; i.remove(); } }
function openInline(it) {
  closeInline(); const r = canvas.getBoundingClientRect(), sx = r.width / W, b = it._b, w = Math.max(220, b.w * sx + 40);
  const inp = document.createElement('input'); inp.className = 'inline-edit'; inp.value = it.text;
  Object.assign(inp.style, { width: w + 'px', left: Math.max(4, r.left + it.x * sx - w / 2) + 'px', top: r.top + (b.y + b.h / 2) * sx - 18 + 'px' });
  const done = ok => { if (inl !== inp) return; if (ok && inp.value.trim()) { it.text = inp.value; syncTypo(); render(); commit(); } closeInline(); };
  inp.onblur = () => done(true); inp.onkeydown = e => { if (e.key === 'Enter') done(true); if (e.key === 'Escape') done(false); };
  document.body.appendChild(inp); inl = inp; inp.focus(); inp.select();
}

/* ---------- toolbar: auto align, text box, cert id, delete background ---------- */
$('alignBtn').onclick = () => {
  const f = S.items.map(i => [i, i.x, i.y]); let t = 0;
  (function step() {
    t += .12; const e = 1 - Math.pow(1 - Math.min(t, 1), 3);
    f.forEach(([i, x, y]) => { i.x = x + (i.ox - x) * e; i.y = y + (i.oy - y) * e; }); render();
    if (t < 1) requestAnimationFrame(step); else { commit(); say('Everything is back in its original position', 100); }
  })();
};
$('addTextBtn').onclick = () => {
  const d = themeOf().dark && !S.bg; closeModals();
  const it = T('text', 'Type your text here', W / 2, Math.round(H * .62), 'Poppins', 24, d ? '#ffffff' : '#222222'); S.items.push(it);
  selId = it.id; multi.clear(); refreshAll(); commit(); setTimeout(() => { $('cText').focus(); $('cText').select(); }, 60);
};
$('idBtn').onclick = () => { showId = !showId; render(); };

/* ---------- page size: landscape or A4 portrait (also follows an uploaded template) ---------- */
function layoutDefaults() {   // re-place the default fields for the current page shape
  S.items.forEach(i => { if (['title', 'lead', 'name', 'subtitle'].includes(i.role)) { i.x = i.ox = W / 2; i.y = i.oy = fy(i.role); } else if (i.grp) { i.y = i.oy = fy(i.role); } });
  rebalance();
}
function dimRaw(w, h) {
  W = w; H = h; S.w = w; S.h = h; TH = isP() ? TH_P : TH_L; if (S.tpl >= TH.length) S.tpl = 0;
  gallery(); borderGallery(); applyFit();
}
function setDim(w, h) {
  if (w === W && h === H) return; const sx = w / W, sy = h / H;
  S.items.forEach(i => { i.x *= sx; i.y *= sy; i.ox *= sx; i.oy *= sy; });
  dimRaw(w, h); layoutDefaults();
}
function setOrient(o) {
  const [w, h] = STD[o]; if (w === W && h === H && !S.bg) return;
  S.bg = null; S.tint = null; setDim(w, h); applyTheme(S.tpl);
  say(o === 'p' ? 'A4 Portrait ready — 30 matching designs below' : 'Landscape ready — 30 matching designs below', 100);
}
document.querySelectorAll('[data-orient]').forEach(b => b.onclick = () => setOrient(b.dataset.orient));
function resetBg() {
  const had = S.bg || S.tpl !== 0; $('templateInput').value = ''; S.bg = null;
  const [w, h] = STD[isP() ? 'p' : 'l']; setDim(w, h); applyTheme(0);
  say(had ? 'Template background deleted — default restored' : 'Already on the default background', 100);
}
$('clearTemplateBtn').onclick = resetBg; $('removePresetBgBtn').onclick = resetBg;

/* ---------- templates ---------- */
function applyTheme(i) {
  const t = TH[i], d = t.dark; S.tpl = i; S.bg = null; S.tint = null;
  const col = { title: d ? t.secondary : t.primary, name: d ? '#ffffff' : '#111111', lead: d ? '#cbd5e1' : '#444444', subtitle: d ? '#cbd5e1' : '#444444', authName: d ? '#ffffff' : '#202124', authDesig: d ? '#cbd5e1' : '#5f6368' };
  S.items.forEach(x => { if (col[x.role]) x.color = col[x.role]; });
  refreshAll(); commit();
}
function gallery() {
  const g = $('templateGrid'); g.innerHTML = ''; g.classList.toggle('tall', isP());
  TH.forEach((t, i) => {
    const c = document.createElement('div'); c.className = 'template-card';
    const cv = document.createElement('canvas'); cv.width = 200; cv.height = Math.round(200 * H / W); const x = cv.getContext('2d'); x.scale(200 / W, 200 / W); paint(x, t);
    c.append(cv, Object.assign(document.createElement('h4'), { textContent: t.name })); c.onclick = () => applyTheme(i); g.appendChild(c);
  });
}
const markGallery = () => {
  document.querySelectorAll('#templateGrid .template-card').forEach((c, i) => c.classList.toggle('active', i === S.tpl && !S.bg));
  document.querySelectorAll('#borderGrid .template-card').forEach(c => c.classList.toggle('active', !!S.border && c.dataset.s === S.border.style));
  document.querySelectorAll('[data-orient]').forEach(b => b.classList.toggle('active', b.dataset.orient === (isP() ? 'p' : 'l')));
  const th = themeOf(); [['tintP', th.primary], ['tintS', th.secondary]].forEach(([id, v]) => { if ($(id) !== document.activeElement) $(id).value = v; });
  if (S.border) { if ($('bdCol') !== document.activeElement) $('bdCol').value = S.border.col; if ($('bdW') !== document.activeElement) $('bdW').value = S.border.w; } else if ($('bdCol') !== document.activeElement) $('bdCol').value = th.secondary;
};
$('shuffleBtn').onclick = () => applyTheme(Math.floor(Math.random() * TH.length));

/* custom background: portrait or landscape is detected from the image, so A4 templates fit exactly */
async function useBg() {
  const f = $('templateInput').files[0]; if (!f) return say('Choose an image first', 100);
  const k = await reg(await readURL(f)), im = IM[k], r = im.height / im.width; let w, h;
  if (r > 1) { w = 700; h = Math.round(700 * r); } else { w = 1000; h = Math.round(1000 * r); }
  h = Math.max(450, Math.min(1500, h)); setDim(w, h); S.bg = k; refreshAll(); commit();
  say(`Template applied — ${r > 1 ? 'portrait' : 'landscape'} page detected, nothing stretched`, 100);
}
$('uploadTemplateBtn').onclick = useBg; $('templateInput').onchange = useBg;

/* logo / extra images: placed at a sensible size straight away, resize with the corner handles */
async function addImage(f) {
  const k = await reg(await readURL(f)), im = IM[k], r = im.height / im.width, role = byRole('logo') ? 'image' : 'logo';
  let w = Math.min(160, Math.max(60, im.width)), h = w * r; if (h > 140) { h = 140; w = h / r; }
  const x = W / 2, y = role === 'logo' ? 78 : Math.round(H * .36), it = { id: ++uid, k: 'i', role, src: k, x, y, ox: x, oy: y, w, h };
  S.items.push(it); closeModals(); selId = it.id; multi.clear(); refreshAll(); commit(); say('Image added — drag the corner handles to resize it', 100);
}
$('logoInput').onchange = e => { const f = e.target.files[0]; if (f) addImage(f).then(() => { e.target.value = ''; }); };
$('applyLogoBtn').onclick = () => $('logoInput').click();

/* ---------- personal setup + recipients ---------- */
const previewSelect = $('previewSelect');
function updateRecipientDropdown() { previewSelect.innerHTML = ''; list.forEach(r => previewSelect.add(new Option(r, r))); if (list.includes(nameText())) previewSelect.value = nameText(); }
function setName(v) { const it = byRole('name'); if (it) it.text = v; previewSelect.value = v; syncTypo(); render(); markStrip(); }
previewSelect.onchange = e => { setName(e.target.value); commitSoon(); };
Object.entries(personalMap).forEach(([id, r]) => $(id).addEventListener('input', e => { const it = byRole(r); if (it) { it.text = e.target.value; render(); commitSoon(); } }));
$('applyPersonalBtn').onclick = () => {
  const n = $('personalNameInput').value.trim();
  if (n && !list.includes(n)) { list.unshift(n); updateRecipientDropdown(); }
  if (n) setName(n); commit(); say('Certificate updated', 100);
};

/* ---------- authorities (up to 4) ---------- */
const groups = () => [...new Set(S.items.filter(i => i.grp).map(i => i.grp))].sort((a, b) => a - b);
const gi = (g, r) => S.items.find(i => i.grp === g && i.role === r);
function rebalance() { const gs = groups(); gs.forEach((g, n) => { const x = W / (gs.length + 1) * (n + 1); S.items.filter(i => i.grp === g).forEach(i => { i.x = i.ox = x; }); }); }
function buildAuth() {
  const box = $('authoritiesContainer'); box.innerHTML = '';
  groups().forEach(g => {
    const nm = gi(g, 'authName'), ds = gi(g, 'authDesig'), div = document.createElement('div'); div.className = 'auth-box';
    div.innerHTML = `<h4>Authority ${g}</h4><div class="field"><label>Upload Signature Image</label><input type="file" accept="image/*" class="glass-input sigf" /></div>
      <div class="field-row"><div class="field"><label>Name</label><input type="text" class="glass-input an" ${nm ? '' : 'disabled'} /></div>
      <div class="field"><label>Designation</label><input type="text" class="glass-input ad" ${ds ? '' : 'disabled'} /></div></div>`;
    box.appendChild(div);
    const bind = (sel_, it) => { const e = div.querySelector(sel_); e.value = it ? it.text : '(removed)'; if (it) e.oninput = () => { it.text = e.value; render(); syncTypo(); commitSoon(); }; };
    bind('.an', nm); bind('.ad', ds);
    div.querySelector('.sigf').onchange = async e => {
      const f = e.target.files[0]; if (!f) return; const k = await reg(await readURL(f)), im = IM[k], w = 140, h = Math.min(70, w * im.height / im.width);
      const s = gi(g, 'sig'), x = nm ? nm.x : 500;
      if (s) { s.src = k; s.w = w; s.h = h; } else S.items.push({ id: ++uid, k: 'i', role: 'sig', grp: g, src: k, x, y: fy('sig'), ox: x, oy: fy('sig'), w, h });
      refreshAll(); commit(); say('Signature added', 100);
    };
  });
}
$('addAuthBtn').onclick = () => {
  const gs = groups(); if (gs.length >= 4) return say('Maximum 4 authorities supported', 100);
  const g = Math.max(0, ...gs) + 1; S.items.push(...authSet(g, W / 2, `Authority ${g} Name`, `Designation ${g}`));
  const d = (TH[S.tpl] || TH[0]).dark && !S.bg; if (d) S.items.filter(i => i.grp === g).forEach(i => i.color = i.role === 'authName' ? '#ffffff' : '#cbd5e1');
  rebalance(); refreshAll(); commit();
};
$('removeAuthBtn').onclick = () => {
  const gs = groups(); if (gs.length <= 1) return say('At least one authority is required', 100);
  const g = gs[gs.length - 1]; S.items = S.items.filter(i => i.grp !== g); if (!sel()) selId = null; rebalance(); refreshAll(); commit();
};
$('applyAuthoritiesBtn').onclick = () => { render(); commit(); say('Signatures & authorities updated', 100); };

/* ---------- import names (.csv / .xlsx) + {{placeholder}} columns ---------- */
let COLS = [];
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
async function readNames(f) {
  let rows;
  if (/\.xlsx?$/i.test(f.name)) { const wb = XLSX.read(await f.arrayBuffer()); rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false }); }
  else rows = Papa.parse((await f.text()).replace(/^\uFEFF/, '')).data;
  const hdr = rows[0] || [], h = hdr.findIndex(x => /name|participant|student|recipient/i.test(String(x))), col = h >= 0 ? h : 0, start = h >= 0 ? 1 : 0;
  const keys = h >= 0 ? hdr.map(x => String(x ?? '').trim().toLowerCase()) : [], names = [], data = {};
  rows.slice(start).forEach(r => {
    r = r || []; const n = String(r[col] ?? '').trim(); if (!n || data[n]) return; names.push(n); data[n] = {};
    keys.forEach((k, i) => { if (k && r[i] != null && String(r[i]).trim() !== '') data[n][k] = String(r[i]).trim(); });
  });
  return { names, data, cols: keys.filter(Boolean) };
}
function buildChips() {
  const box = $('colChips'); box.innerHTML = '';
  ['Name', 'Date', 'ID', 'Number', ...COLS.filter(c => !['name', 'date', 'id', 'number'].includes(c)).map(cap)].forEach(c => {
    const b = document.createElement('button'); b.className = 'chip'; b.textContent = `{{${c}}}`; b.title = 'Click to insert into the selected text';
    b.onclick = () => insertToken(b.textContent); box.appendChild(b);
  });
}
function insertToken(tok) {
  const it = textSel();
  if (!it) { if (navigator.clipboard) navigator.clipboard.writeText(tok); return say(`Copied ${tok} — select a text on the certificate first to insert it`, 100); }
  it.text += (it.text ? ' ' : '') + tok; render(); syncTypo(); commit(); say(`Inserted ${tok} — it changes for every recipient`, 100);
}
$('loadCsvBtn').onclick = async () => {
  const f = $('csvInput').files[0]; if (!f) return say('Choose a .csv or .xlsx file first', 100);
  try {
    const r = await readNames(f); if (!r.names.length) return say('No names found — put them in column 1 or under a “Name” header', 100);
    list = r.names; DATA = r.data; COLS = r.cols; updateRecipientDropdown(); buildChips(); setName(r.names[0]); buildStrip(); commit();
    say(`Imported ${r.names.length} names` + (COLS.length > 1 ? ` and ${COLS.length - 1} extra column(s) — use them as {{Column}}` : ''), 100);
  } catch (err) { say('Could not read that file — try .csv or .xlsx', 100); }
};
$('sampleCsvBtn').onclick = () => {
  const b = new Blob(['Name,Course,Date,Rank\nAarav Sharma,Web Development,12 March 2026,1st\nIsha Verma,AI/ML Workshop,12 March 2026,2nd\nRohan Mehta,Cloud Study Jam,13 March 2026,Participant\n'], { type: 'text/csv' });
  triggerDownload(URL.createObjectURL(b), 'sample_recipients.csv');
};

/* ---------- export (JPG / PDF, no zip) ---------- */
function triggerDownload(url, name) { const a = document.createElement('a'); a.download = name; a.href = url; document.body.appendChild(a); a.click(); a.remove(); }
const fontsReady = () => Promise.all([...new Set(S.items.filter(i => i.k === 't').map(i => i.font))].map(f => document.fonts.load(`20px "${f}"`)));
const shot = name => { render({ scale: +$('qualitySel').value, clean: true, name }); return canvas.toDataURL('image/jpeg', .95); };
const safe = (s, i) => String(i + 1).padStart(3, '0') + '_' + (String(s).replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '') || 'certificate');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const a4 = () => $('paperSel').value === 'a4';
const ori = () => isP() ? 'p' : 'l';
const newPdf = () => a4() ? new jsPDF(ori(), 'mm', 'a4') : new jsPDF(ori(), 'px', [W, H]);
const pdfPage = (d, url, first) => {   // image is fitted (never stretched) and centred on the page
  const pw = a4() ? (isP() ? 210 : 297) : W, ph = a4() ? (isP() ? 297 : 210) : H, k = Math.min(pw / W, ph / H), iw = W * k, ih = H * k;
  if (!first) d.addPage(a4() ? 'a4' : [W, H], ori()); d.addImage(url, 'JPEG', (pw - iw) / 2, (ph - ih) / 2, iw, ih);
};
async function one(fmt) {
  await fontsReady(); const n = nameText(), url = shot(n), f = (n.replace(/[^\w-]+/g, '_') || 'certificate') + '_Certificate';
  if (fmt === 'jpg') triggerDownload(url, f + '.jpg'); else { const d = newPdf(); pdfPage(d, url, true); d.save(f + '.pdf'); }
  render(); say('Downloaded ' + f + '.' + fmt, 100);
}
async function batch(mode) {      // 'jpg' = separate JPGs | 'pdfs' = separate PDFs | 'pdf' = one combined PDF
  if (!list.length) return say('Import names first', 100);
  await fontsReady(); let pdf = null;
  for (let i = 0; i < list.length; i++) {
    const url = shot(list[i]), fn = safe(list[i], i);
    if (mode === 'jpg') { triggerDownload(url, fn + '.jpg'); await sleep(380); }
    else if (mode === 'pdfs') { const d = newPdf(); pdfPage(d, url, true); d.save(fn + '.pdf'); await sleep(380); }
    else { pdf = pdf || newPdf(); pdfPage(pdf, url, i === 0); await sleep(0); }
    say(`Generating ${i + 1} / ${list.length}`, Math.round((i + 1) / list.length * 100) - 1);
  }
  if (mode === 'pdf') pdf.save('Certificates.pdf');
  render(); confetti(); say(`Done! ${list.length} certificates ready`, 100);
}
$('downloadSingleJpgBtn').onclick = () => one('jpg'); $('downloadSinglePdfBtn').onclick = () => one('pdf');
$('downloadBatchJpgBtn').onclick = () => batch('jpg'); $('downloadBatchPdfBtn').onclick = () => batch('pdfs');
$('downloadBatchCombinedBtn').onclick = () => batch('pdf');
$('enterpriseBatchPdfBtn').onclick = () => batch('pdf'); $('enterpriseBatchJpgBtn').onclick = () => batch('jpg');

/* ---------- recipient strip with long-name warnings ---------- */
function nameFit(n) {
  const it = byRole('name'); if (!it) return 1; ctx.save(); ctx.font = `${it.ital ? 'italic ' : ''}${it.bold ? 'bold ' : ''}${it.size}px "${it.font}"`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = (it.ls || 0) + 'px'; const w = ctx.measureText(fmt(n, it.cs)).width; ctx.restore(); return Math.min(1, W * .84 / (w || 1));
}
function buildStrip() {
  const box = $('strip'); box.innerHTML = ''; let bad = 0;
  list.forEach(n => {
    const f = nameFit(n), warn = f < .72; if (warn) bad++;
    const b = document.createElement('button'); b.className = 'chip' + (warn ? ' warn' : ''); b.dataset.n = n; b.textContent = (warn ? '⚠ ' : '') + n;
    b.title = warn ? `Long name — shrinks to ${Math.round(f * 100)}% to fit` : 'Preview this recipient'; b.onclick = () => { setName(n); commitSoon(); }; box.appendChild(b);
  });
  $('stripInfo').textContent = `${list.length} recipient${list.length === 1 ? '' : 's'}` + (bad ? ` · ⚠ ${bad} long name${bad > 1 ? 's' : ''}` : ''); markStrip();
}
function markStrip() { document.querySelectorAll('#strip .chip').forEach(c => { const on = c.dataset.n === nameText(); c.classList.toggle('on', on); if (on && c.scrollIntoView) c.scrollIntoView({ block: 'nearest', inline: 'center' }); }); }

/* ---------- layers: show/hide, lock, reorder, delete ---------- */
function buildLayers() {
  const box = $('layersList'); if (!box) return; box.innerHTML = '';
  [...S.items].reverse().forEach(it => {
    const r = document.createElement('div'); r.className = 'lrow'; r.dataset.id = it.id;
    r.innerHTML = `<button data-a="hide" title="Show / hide">${it.hide ? '🚫' : '👁'}</button><button data-a="lock" title="Lock / unlock">${it.lock ? '🔒' : '🔓'}</button><span class="ln"></span><button data-a="up" title="Bring forward">▲</button><button data-a="down" title="Send backward">▼</button><button data-a="del" title="Delete">✕</button>`;
    const ln = r.querySelector('.ln'); ln.textContent = label(it); ln.onclick = e => pick(it.id, e.shiftKey);
    r.querySelectorAll('button').forEach(b => b.onclick = () => layerAct(it, b.dataset.a)); box.appendChild(r);
  });
  markLayers();
}
function markLayers() { const ids = selAll().map(i => i.id); document.querySelectorAll('#layersList .lrow').forEach(r => r.classList.toggle('on', ids.includes(+r.dataset.id))); }
function layerAct(it, a) {
  const i = S.items.indexOf(it);
  if (a === 'hide') it.hide = !it.hide; else if (a === 'lock') it.lock = !it.lock;
  else if (a === 'up' && i < S.items.length - 1) [S.items[i], S.items[i + 1]] = [S.items[i + 1], S.items[i]];
  else if (a === 'down' && i > 0) [S.items[i], S.items[i - 1]] = [S.items[i - 1], S.items[i]];
  else if (a === 'del') { if (it.lock) return say('Unlock the layer first', 100); S.items.splice(i, 1); if (selId === it.id) selId = null; multi.delete(it.id); }
  refreshAll(); commit();
}

/* ---------- align tools (to each other, or to the page when one item is selected) ---------- */
function alignBarUpdate() { $('alignBar').hidden = !selAll().length; }
function alignSel(m) {
  const a = selAll().filter(i => i._b && !i.lock); if (!a.length) return; const page = a.length === 1, bs = a.map(i => i._b);
  const L = page ? 0 : Math.min(...bs.map(b => b.x)), R = page ? W : Math.max(...bs.map(b => b.x + b.w)), Tp = page ? 0 : Math.min(...bs.map(b => b.y)), B = page ? H : Math.max(...bs.map(b => b.y + b.h));
  if (m === 'dh' || m === 'dv') {
    if (a.length < 3) return say('Select 3 or more items to space them evenly', 100);
    const h = m === 'dh', s = [...a].sort((p, q) => h ? p._b.x - q._b.x : p._b.y - q._b.y), tot = s.reduce((n, i) => n + (h ? i._b.w : i._b.h), 0), gap = ((h ? R - L : B - Tp) - tot) / (s.length - 1);
    let pos = h ? L : Tp; s.forEach(i => { const d = pos - (h ? i._b.x : i._b.y); if (h) i.x += d; else i.y += d; pos += (h ? i._b.w : i._b.h) + gap; });
  } else a.forEach(i => {
    const b = i._b;
    if (m === 'l') i.x += L - b.x; if (m === 'r') i.x += R - (b.x + b.w); if (m === 'c') i.x += (L + R) / 2 - (b.x + b.w / 2);
    if (m === 't') i.y += Tp - b.y; if (m === 'b') i.y += B - (b.y + b.h); if (m === 'm') i.y += (Tp + B) / 2 - (b.y + b.h / 2);
  });
  render(); commit();
}
document.querySelectorAll('#alignBar [data-al]').forEach(b => b.onclick = () => alignSel(b.dataset.al));

/* ---------- badges, border lines, template colours ---------- */
function badgeGallery() {
  const g = $('badgeGrid');
  Object.keys(BD).forEach(s => {
    const c = document.createElement('div'); c.className = 'template-card'; const cv = document.createElement('canvas'); cv.width = cv.height = 110; drawBadge(cv.getContext('2d'), s, 55, 55, 90, '#800020');
    c.append(cv, Object.assign(document.createElement('h4'), { textContent: s })); c.onclick = () => addBadge(s); g.appendChild(c);
  });
}
function addBadge(style) {
  const x = W - 120, y = H - 120, it = { id: ++uid, k: 'b', role: 'badge', style, col: themeOf().primary, x, y, ox: x, oy: y, w: 90, h: 90 }; S.items.push(it);
  closeModals(); selId = it.id; multi.clear(); refreshAll(); commit(); say(`${style} added — drag, resize with the corners, or recolour it`, 100);
}
function borderGallery() {
  const g = $('borderGrid'); g.innerHTML = '';
  Object.keys(BR).forEach(s => {
    const c = document.createElement('div'); c.className = 'template-card'; c.dataset.s = s; const cv = document.createElement('canvas'); cv.width = 200; cv.height = Math.round(200 * H / W);
    const x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 200, cv.height); x.scale(200 / W, 200 / W); drawBorder(x, { style: s, col: '#374151', w: 4 });
    c.append(cv, Object.assign(document.createElement('h4'), { textContent: s })); c.onclick = () => { S.border = { style: s, col: $('bdCol').value, w: +$('bdW').value }; render(); markGallery(); commit(); }; g.appendChild(c);
  });
}
$('bdCol').oninput = $('bdW').oninput = () => { if (S.border) { S.border.col = $('bdCol').value; S.border.w = +$('bdW').value; render(); commitSoon(); } };
$('bdNone').onclick = () => { S.border = null; render(); markGallery(); commit(); };
['tintP', 'tintS'].forEach(id => $(id).oninput = () => {
  S.tint = { primary: $('tintP').value, secondary: $('tintS').value }; const t = byRole('title');
  if (t && !TH[S.tpl].dark) t.color = S.tint.primary; render(); commitSoon();
});
$('tintReset').onclick = () => { S.tint = null; const th = TH[S.tpl], t = byRole('title'); if (t) t.color = th.dark ? th.secondary : th.primary; refreshAll(); commit(); };

/* ---------- save / load / autosave ---------- */
const KEY = 'certstudio.v2';
const pack = () => ({ v: 2, S: JSON.parse(snap()), list, DATA, COLS, showId, imgs: Object.fromEntries(Object.entries(IM).map(([k, i]) => [k, i.src])) });
let st; function autosave() { clearTimeout(st); st = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(pack())); } catch (e) { /* storage full: skip */ } }, 600); }
async function unpack(d) {
  if (!d || !d.S || !d.S.items) throw new Error('bad file');
  for (const [k, src] of Object.entries(d.imgs || {})) await new Promise(r => { const i = new Image(); i.onload = () => { IM[k] = i; r(); }; i.onerror = r; i.src = src; });
  S = d.S; list = d.list && d.list.length ? d.list : list; DATA = d.DATA || {}; COLS = d.COLS || []; showId = d.showId !== false;
  S.items = S.items.filter(i => i.k !== 'q'); dimRaw(S.w || 1000, S.h || 700);
  uid = Math.max(uid, 0, ...S.items.map(i => i.id)); imN = Math.max(imN, 0, ...Object.keys(IM).map(k => +k.slice(2) || 0));
  selId = null; multi.clear(); updateRecipientDropdown(); buildChips(); hist = []; hp = -1; commit(); refreshAll();
}
$('saveBtn').onclick = () => { triggerDownload(URL.createObjectURL(new Blob([JSON.stringify(pack())], { type: 'application/json' })), 'Certificate_Design.json'); say('Design saved to a .json file', 100); };
$('loadBtn').onclick = () => $('loadInput').click();
$('loadInput').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  try { await unpack(JSON.parse(await f.text())); say('Design loaded', 100); } catch (err) { say('That file is not a Certificate Studio design', 100); } e.target.value = '';
};
$('newBtn').onclick = () => { if (confirm('Start a new design? Your autosaved work will be cleared.')) { localStorage.removeItem(KEY); location.reload(); } };

/* ---------- polish: confetti, theme, keyboard ---------- */
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas'); c.style.cssText = 'position:fixed;inset:0;z-index:700;pointer-events:none'; c.width = innerWidth; c.height = innerHeight; document.body.appendChild(c);
  const g = c.getContext('2d'), cols = ['#4285f4', '#ea4335', '#fbbc05', '#34a853', '#f0abfc'];
  const ps = Array.from({ length: 140 }, () => ({ x: c.width / 2, y: c.height * .65, vx: (Math.random() - .5) * 16, vy: -Math.random() * 18 - 4, r: Math.random() * 6 + 3, c: cols[Math.random() * 5 | 0], a: Math.random() * 6 }));
  let f = 0; (function tick() {
    g.clearRect(0, 0, c.width, c.height);
    ps.forEach(p => { p.vy += .45; p.x += p.vx; p.y += p.vy; p.a += .2; g.fillStyle = p.c; g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); g.restore(); });
    if (++f < 110) requestAnimationFrame(tick); else c.remove();
  })();
}
$('themeToggle').onclick = () => { const l = document.body.classList.toggle('light-mode'); $('themeToggle').textContent = l ? '☀️ Light' : '🌙 Dark'; };
function duplicate() {
  const src = selAll(); if (!src.length) return; multi.clear();
  const cp = src.map(it => { const c = JSON.parse(JSON.stringify(it, (k, v) => k[0] === '_' ? undefined : v)); c.id = ++uid; c.x += 20; c.y += 20; c.ox = c.x; c.oy = c.y; c.lock = false; return c; });
  S.items.push(...cp); selId = cp[0].id; cp.slice(1).forEach(c => multi.add(c.id)); refreshAll(); commit(); say('Duplicated', 100);
}
addEventListener('keydown', e => {
  if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  const k = e.key, mod = e.ctrlKey || e.metaKey, it = sel(), K = k.toLowerCase();
  if (mod && K === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
  else if (mod && K === 'y') { e.preventDefault(); redo(); }
  else if (mod && K === 'd') { e.preventDefault(); duplicate(); }
  else if (mod && K === 'a') { e.preventDefault(); const a = S.items.filter(i => i._b); multi.clear(); selId = a.length ? a[0].id : null; a.slice(1).forEach(i => multi.add(i.id)); syncTypo(); dock(); render(); alignBarUpdate(); }
  else if (it && (k === 'Delete' || k === 'Backspace')) { e.preventDefault(); removeSel(); }
  else if (it && k.startsWith('Arrow')) { e.preventDefault(); const d = e.shiftKey ? 10 : 1; selAll().filter(i => !i.lock).forEach(i => { if (k === 'ArrowLeft') i.x -= d; if (k === 'ArrowRight') i.x += d; if (k === 'ArrowUp') i.y -= d; if (k === 'ArrowDown') i.y += d; }); render(); commitSoon(); }
  else if (k === 'Escape') pick(null);
  else if (k === '+' || k === '=') setZoom(zoomNow() * 1.2); else if (k === '-') setZoom(zoomNow() / 1.2); else if (k === '0') setZoom(null);
  else if (!it && (k === 'ArrowRight' || k === 'ArrowLeft') && list.length) { const n = (list.indexOf(nameText()) + (k === 'ArrowRight' ? 1 : -1) + list.length) % list.length; setName(list[n]); commitSoon(); }
});
addEventListener('resize', () => { if (zoom) $('zoomLbl').textContent = Math.round(zoom * 100) + '%'; else applyFit(); render(); });

/* ---------- startup ---------- */
(async () => {
  gallery(); borderGallery(); badgeGallery(); updateRecipientDropdown(); buildChips();
  try { const raw = localStorage.getItem(KEY); if (raw) { await unpack(JSON.parse(raw)); say('Restored your last session', 100); } else { commit(); refreshAll(); } }
  catch (e) { commit(); refreshAll(); }
  setZoom(null); document.fonts.ready.then(() => { render(); buildStrip(); });
})();
