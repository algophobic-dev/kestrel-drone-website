// Moving chart background: a faint aeronautical-chart wireframe that drifts behind the page.
// <script src="js/bg.js" data-mode="plane" defer></script>   planes flying along airways (company and EFB sites)
// <script src="js/bg.js" data-mode="drone" defer></script>   drones over a facility-map grid (Kestrel Drone site)
// Shared by the three websites: copy this one file when it changes. Holds still when the visitor prefers reduced motion.
(() => {
  const mode = document.currentScript?.dataset.mode === 'drone' ? 'drone' : 'plane';
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none';
  document.body.prepend(cv);
  const g = cv.getContext('2d');

  // One tile of chart, repeated in every direction, so the drift never runs out.
  const TW = 1400, TH = 1000;
  let seed = mode === 'drone' ? 7 : 3;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const C = { line: 'rgba(43,179,160,0.085)', tick: 'rgba(43,179,160,0.12)', blue: 'rgba(61,139,255,0.13)', mag: 'rgba(217,70,239,0.11)', ink: 'rgba(238,243,246,0.24)', num: 'rgba(238,243,246,0.075)' };

  // In drone mode the dashed ring sits on the facility grid, like a Class D surface area.
  const rings = mode === 'drone' ? [{ x: 380, y: 300, r: [60, 120, 180], solid: true }, { x: 1060, y: 640, r: [120], solid: false }] : [{ x: 380, y: 300, r: [60, 120, 180], solid: true }, { x: 1080, y: 720, r: [55], solid: false }];
  const vor = { x: 960, y: 230, r: 95 };
  const pts = [[vor.x, vor.y], [rings[0].x, rings[0].y], [rings[1].x, rings[1].y], [120, 860], [1320, 520], [650, 940], [700, 60]];
  const airways = [[3, 1, 0], [1, 6], [0, 4], [0, 2], [2, 5], [1, 5]];
  const segs = airways.flatMap(a => a.slice(1).map((b, i) => [pts[a[i]], pts[b]]));
  const planes = mode === 'plane' ? segs.map((s, i) => ({ s, t: rnd(), v: 0.018 + rnd() * 0.02, back: i % 2 === 1 })) : [];
  // Drone mode: a facility-map grid around the ringed airport, with ceilings that rise away from it.
  const grid = [];
  if (mode === 'drone') {
    const cx = 1060, cy = 640, n = 5, sz = 48;
    for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) {
      const d = Math.hypot(i, j); if (d > n) continue;
      grid.push({ x: cx + i * sz, y: cy + j * sz, sz, c: d < 1.5 ? 0 : d < 3 ? 100 : d < 4.2 ? 200 : 400 });
    }
  }
  const drones = mode === 'drone' ? [...Array(7)].map(() => ({ x: 200 + rnd() * 1000, y: 120 + rnd() * 760, ax: 30 + rnd() * 60, ay: 20 + rnd() * 50, w: 0.15 + rnd() * 0.2, p: rnd() * 6.28 })) : [];
  const stadium = { x: 1180, y: 330, r: 110 };

  const PLANE = new Path2D('M12 2l2 7 8 5v2l-8-2.5V19l2.5 2v1L12 21l-4.5 1v-1L10 19v-5.5L2 16v-2l8-5z');
  function drawPlane(x, y, ang) {
    g.save(); g.translate(x, y); g.rotate(ang); g.scale(0.95, 0.95); g.translate(-12, -12);
    g.fillStyle = C.ink; g.fill(PLANE); g.restore();
  }
  function drawDrone(x, y, spin) {
    g.save(); g.translate(x, y); g.strokeStyle = C.ink; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(-7, -7); g.lineTo(7, 7); g.moveTo(7, -7); g.lineTo(-7, 7); g.stroke();
    for (const [a, b] of [[-7, -7], [7, -7], [-7, 7], [7, 7]]) { g.beginPath(); g.arc(a, b, 4.2, spin, spin + 5.2); g.stroke(); }
    g.fillStyle = C.ink; g.fillRect(-2.5, -2.5, 5, 5); g.restore();
  }

  function tile(ox, oy, time) {
    g.save(); g.translate(ox, oy);
    // Latitude and longitude lines, with a tick every minute like a sectional's.
    g.lineWidth = 1; g.strokeStyle = C.line; g.beginPath();
    for (let x = 0; x < TW; x += 175) { g.moveTo(x, 0); g.lineTo(x, TH); }
    for (let y = 0; y < TH; y += 125) { g.moveTo(0, y); g.lineTo(TW, y); }
    g.stroke();
    g.strokeStyle = C.tick; g.beginPath();
    for (let x = 0; x < TW; x += 175) for (let y = 0; y < TH; y += 12.5) { const l = (y % 62.5 === 0) ? 6 : 3; g.moveTo(x - l, y); g.lineTo(x + l, y); }
    for (let y = 0; y < TH; y += 125) for (let x = 0; x < TW; x += 17.5) { const l = (x % 87.5 === 0) ? 6 : 3; g.moveTo(x, y - l); g.lineTo(x, y + l); }
    g.stroke();
    if (mode === 'drone') {
      g.lineWidth = 1; g.font = '600 10px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      for (const q of grid) {
        g.strokeStyle = q.c === 0 ? 'rgba(239,83,80,0.08)' : q.c <= 100 ? 'rgba(242,177,52,0.07)' : 'rgba(43,179,160,0.065)';
        g.strokeRect(q.x - q.sz / 2, q.y - q.sz / 2, q.sz, q.sz);
        g.fillStyle = C.num; g.fillText(q.c, q.x, q.y);
      }
      g.setLineDash([6, 6]); g.strokeStyle = 'rgba(201,160,74,0.14)'; g.beginPath(); g.arc(stadium.x, stadium.y, stadium.r, 0, 6.29); g.stroke(); g.setLineDash([]);
    } else {
      // Airways between fixes.
      g.lineWidth = 1.2; g.strokeStyle = C.line; g.setLineDash([10, 7]); g.beginPath();
      for (const [a, b] of segs) { g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); }
      g.stroke(); g.setLineDash([]);
      // VOR compass rose.
      g.strokeStyle = C.blue; g.lineWidth = 1; g.beginPath(); g.arc(vor.x, vor.y, vor.r, 0, 6.29); g.stroke();
      g.beginPath();
      for (let k = 0; k < 72; k++) { const a = k * Math.PI / 36, l = k % 6 === 0 ? 12 : 5; g.moveTo(vor.x + Math.sin(a) * vor.r, vor.y - Math.cos(a) * vor.r); g.lineTo(vor.x + Math.sin(a) * (vor.r - l), vor.y - Math.cos(a) * (vor.r - l)); }
      g.stroke();
      g.beginPath(); g.moveTo(vor.x, vor.y - vor.r - 10); g.lineTo(vor.x - 5, vor.y - vor.r); g.lineTo(vor.x + 5, vor.y - vor.r); g.closePath(); g.fillStyle = C.blue; g.fill();
      g.beginPath(); g.arc(vor.x, vor.y, 4, 0, 6.29); g.stroke();
    }
    // Airspace rings: solid blue like Class B, dashed like Class D.
    for (const R of rings) {
      g.lineWidth = R.solid ? 1.6 : 1.3; g.strokeStyle = R.solid ? C.blue : C.mag; g.setLineDash(R.solid ? [] : [7, 6]);
      for (const r of R.r) { g.beginPath(); g.arc(R.x, R.y, r, 0, 6.29); g.stroke(); }
      g.setLineDash([]); g.fillStyle = R.solid ? C.blue : C.mag; g.beginPath(); g.arc(R.x, R.y, 3.5, 0, 6.29); g.fill();
    }
    // Things that move.
    for (const p of planes) {
      const t = ((p.t + time * p.v) % 1 + 1) % 1, [a, b] = p.back ? [p.s[1], p.s[0]] : p.s;
      const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
      drawPlane(x, y, Math.atan2(b[0] - a[0], -(b[1] - a[1])));
    }
    for (const d of drones) drawDrone(d.x + Math.sin(time * d.w + d.p) * d.ax, d.y + Math.sin(time * d.w * 1.7 + d.p) * d.ay, time * 9);
    g.restore();
  }

  let w = 0, h = 0, dpr = 1;
  function size() { dpr = Math.min(devicePixelRatio || 1, 2); w = innerWidth; h = innerHeight; cv.width = w * dpr; cv.height = h * dpr; }
  function frame(now) {
    const time = still ? 0 : now / 1000;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    // The whole chart drifts slowly up and to the left.
    const dx = -((time * 9) % TW), dy = -((time * 5) % TH);
    // Shapes near a tile's edge can reach into the next tile, so draw a margin past the screen.
    for (let x = dx - TW; x < w + 450; x += TW) for (let y = dy - TH; y < h + 450; y += TH) if (x + TW > -450 && y + TH > -450) tile(x, y, time);
  }
  size(); addEventListener('resize', () => { size(); if (still) frame(0); });
  if (still) { frame(0); return; }
  let last = 0;
  const loop = now => { if (!document.hidden && now - last > 33) { last = now; frame(now); } requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
})();
