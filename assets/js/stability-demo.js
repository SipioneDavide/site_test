/*
  Stability of dynamical multi-commodity flow networks (Sipione, Como,
  CDC 2025; extended version for IEEE TAC).

  A road with an entrance (on-ramp, no supply constraint) and cells 1..4;
  cell 3 is a narrow section. Two commodities, cars (c) and trucks (t):
    demand   d^k(x) = v_k x,              v_c = 1, v_t = 0.7
    supply   s_i(y) = max(0, β_i − y),    y = x_c + 2 x_t   (trucks take twice the space)
  Cell-to-cell flows follow the FIFO rule (both commodities scaled by the
  same fraction when the downstream supply binds). The last cell leaves
  freely. Capacity region of cell i (Definition 3 of the paper):
    μ_c + μ_t < β_i − μ_c / v_c − 2 μ_t / v_t
    ⇔  2 μ_c + (1 + 2 / 0.7) μ_t < β_i ,
  and the stability region is the intersection over the cells (here the
  narrow section decides).
*/
(function () {
  "use strict";

  var SVGNS = "http://www.w3.org/2000/svg";
  var V = [1, 0.7], W = [1, 2];
  var BETA = [3, 3, 2, 3];               // cells 1..4 (cell 3 = narrow section)
  var COEF = [1 + W[0] / V[0], 1 + W[1] / V[1]];
  var BMIN = Math.min.apply(null, BETA);
  var LMAX = [1.5, 0.8];                 // axes of the region panel
  var SIM = 1.6;                         // model time units per second
  var VIS = 0.9;                         // cells per second crossed at full speed
  var SCALE = 0.16;                      // traffic volume per drawn car
  var Y = 58, LANE = 4.9, X0 = 118, CW = 92;
  var CAR = [8.2, 4.7], TRUCK = [14, 5.2];

  document.querySelectorAll("[data-stability-demo]").forEach(init);

  function init(root) {
    var road = root.querySelector(".sd-road"), reg = root.querySelector(".sd-region");
    var el = {
      status: root.querySelector("[data-status]"),
      lc: root.querySelector("[data-lc]"), lt: root.querySelector("[data-lt]")
    };
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // state: x[cell][k], cell 0 = entrance
    var S = { lam: [0.62, 0.16], x: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]], z: null, visible: true, phase: {} };

    function mk(tag, attrs, parent) {
      var e = document.createElementNS(SVGNS, tag);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(e);
      return e;
    }
    function lerp(a, b, f) { return a + (b - a) * f; }

    // ---------------------------------------------------------- dynamics
    function flows(x) {
      var D = x.map(function (c) { return [V[0] * c[0], V[1] * c[1]]; });
      var z = [];
      for (var i = 0; i < 5; i++) {
        var a = 1;
        if (i < 4) {                                   // FIFO: one fraction for both commodities
          var j = i + 1, s = Math.max(0, BETA[j - 1] - (x[j][0] + W[1] * x[j][1])), dem = D[i][0] + D[i][1];
          if (dem > s) a = dem > 0 ? s / dem : 0;
        }
        z.push([a * D[i][0], a * D[i][1]]);
      }
      return z;
    }
    function simulate(T) {
      var h = 0.01, n = Math.ceil(T / h);
      for (var s = 0; s < n; s++) {
        var z = flows(S.x);
        for (var i = 0; i < 5; i++) {
          for (var k = 0; k < 2; k++) {
            var inflow = i === 0 ? S.lam[k] : z[i - 1][k];
            S.x[i][k] = Math.max(0, S.x[i][k] + h * (inflow - z[i][k]));
          }
        }
      }
      S.z = flows(S.x);
    }
    function inside(l) { return COEF[0] * l[0] + COEF[1] * l[1] < BMIN; }

    // ---------------------------------------------------------- road
    var gRoad = mk("g", {}, road), gTint = mk("g", {}, road), gCars = mk("g", {}, road), gUI = mk("g", {}, road);
    var NAR = X0 + 2 * CW, NAR2 = NAR + CW;
    mk("path", { d: "M14 " + Y + " H" + NAR, class: "td-road fd-main" }, gRoad);
    mk("path", { d: "M" + NAR2 + " " + Y + " H592", class: "td-road fd-main" }, gRoad);
    mk("path", { d: "M" + NAR + " " + (Y - LANE) + " H" + NAR2, class: "td-road fd-one" }, gRoad);
    mk("path", { d: "M" + NAR + " " + (Y - 9.5) + " L" + (NAR + 16) + " " + (Y - 9.5) + " L" + NAR + " " + (Y + 9.5) + " Z", class: "fd-taper" }, gRoad);
    mk("path", { d: "M" + NAR2 + " " + (Y - 9.5) + " L" + (NAR2 - 16) + " " + (Y - 9.5) + " L" + NAR2 + " " + (Y + 9.5) + " Z", class: "fd-taper" }, gRoad);
    mk("path", { d: "M14 " + Y + " H" + NAR, class: "hn-lane" }, gRoad);
    mk("path", { d: "M" + NAR2 + " " + Y + " H592", class: "hn-lane" }, gRoad);
    for (var j = 0; j <= 4; j++) mk("line", { x1: X0 + j * CW, x2: X0 + j * CW, y1: Y - 13.5, y2: Y - 11, class: "fd-tick" }, gRoad);
    lab(40, Y + 28, "entrance", "start");
    lab((NAR + NAR2) / 2, Y + 22, "narrow section", "middle");
    lab(592, Y - 16, "→", "end");
    function lab(x, y, t, a) { mk("text", { x: x, y: y, class: "fd-label", "text-anchor": a }, gRoad).textContent = t; }
    var tints = [];
    for (j = 0; j < 4; j++) {
      var narrow = j === 2;
      tints.push(mk("rect", { x: X0 + j * CW, y: narrow ? Y - LANE - 5 : Y - 9.5, width: CW, height: narrow ? 10 : 19, class: "fd-tint" }, gTint));
    }
    var qText = mk("text", { x: 16, y: Y - 18, class: "fd-q", "text-anchor": "start" }, gUI);

    var pool = [], used = 0;
    function glyph(x, y, truck, op) {
      var r = pool[used];
      if (!r) { r = mk("rect", { rx: 1.8 }, gCars); pool.push(r); }
      used++;
      var d = truck ? TRUCK : CAR;
      r.setAttribute("x", (x - d[0] / 2).toFixed(1)); r.setAttribute("y", (y - d[1] / 2).toFixed(1));
      r.setAttribute("width", d[0]); r.setAttribute("height", d[1]);
      r.setAttribute("class", "fd-car " + (truck ? "fd-ext" : "fd-thr"));
      r.style.opacity = op < 1 ? op.toFixed(2) : "";
      r.style.display = "";
    }
    function advance(key, sp, dt) {
      S.phase[key] = ((S.phase[key] || Math.random()) + sp * VIS * dt) % 1;
      return S.phase[key];
    }
    function speed(i, k) { return S.x[i][k] > 1e-3 ? Math.min(1, S.z[i][k] / S.x[i][k]) : V[k]; }
    // one lane, one commodity
    function stream(n, ph, x1, x2, y, truck) {
      var m = Math.ceil(n - 1e-6);
      for (var k = 0; k < m; k++) glyph(lerp(x1, x2, (ph + k / n) % 1), y, truck, k === m - 1 ? n - (m - 1) : 1);
    }
    // one lane shared by both commodities, interleaved
    function mixed(nc, nt, ph, x1, x2, y) {
      var tot = nc + nt, m = Math.ceil(tot - 1e-6), acc = 0;
      for (var k = 0; k < m; k++) {
        acc += nt / Math.max(tot, 1e-9);
        var truck = acc >= 1 - 1e-9;
        if (truck) acc -= 1;
        glyph(lerp(x1, x2, (ph + k / tot) % 1), y, truck, k === m - 1 ? tot - (m - 1) : 1);
      }
    }

    function drawRoad(dt) {
      used = 0;
      for (var c = 1; c <= 4; c++) {
        var x1 = X0 + (c - 1) * CW + 3, x2 = X0 + c * CW - 3;
        var nc = S.x[c][0] / SCALE, nt = S.x[c][1] / SCALE * 0.6;
        var y = S.x[c][0] + W[1] * S.x[c][1];
        tints[c - 1].style.opacity = (Math.max(0, Math.min(1, (y - 0.5 * BETA[c - 1]) / (0.5 * BETA[c - 1]) * 1.4)) * 0.5).toFixed(2);
        if (c === 3) {
          var sp = (speed(c, 0) * S.x[c][0] + speed(c, 1) * S.x[c][1]) / Math.max(S.x[c][0] + S.x[c][1], 1e-9);
          mixed(nc, nt, advance("m", sp || 1, dt), x1, x2, Y - LANE);
        } else {
          stream(nc, advance("c" + c, speed(c, 0), dt), x1, x2, Y - LANE, false);
          stream(nt, advance("t" + c, speed(c, 1), dt), x1, x2, Y + LANE, true);
        }
      }
      // entrance: cars arriving and the queue, stacked back from cell 1
      var wait = [Math.max(0, S.x[0][0] - S.lam[0] / V[0]), Math.max(0, S.x[0][1] - S.lam[1] / V[1])];
      var free = [S.x[0][0] - wait[0], S.x[0][1] - wait[1]];
      stream(free[0] / SCALE, advance("c0", 1, dt), 18, X0 - 3, Y - LANE, false);
      stream(free[1] / SCALE * 0.6, advance("t0", V[1], dt), 18, X0 - 3, Y + LANE, true);
      var qc = Math.min(wait[0] / SCALE, 9), qt = Math.min(wait[1] / SCALE * 0.6, 5);
      for (var k = 0; k < Math.ceil(qc - 1e-6); k++) glyph(X0 - 7 - k * 10, Y - LANE, false, k === Math.ceil(qc - 1e-6) - 1 ? qc - k : 1);
      for (k = 0; k < Math.ceil(qt - 1e-6); k++) glyph(X0 - 10 - k * 16, Y + LANE, true, k === Math.ceil(qt - 1e-6) - 1 ? qt - k : 1);
      var q = (wait[0] + W[1] * wait[1]) / SCALE;
      qText.textContent = q >= 3 ? "queue " + Math.round(q) : "";
      for (k = used; k < pool.length; k++) pool[k].style.display = "none";
    }

    // ---------------------------------------------------------- region panel
    var P = { l: 34, r: 12, t: 12, b: 34 }, PW = 220 - P.l - P.r, PH = 180 - P.t - P.b;
    function px(l) { return [P.l + PW * l[0] / LMAX[0], P.t + PH * (1 - l[1] / LMAX[1])]; }
    var a = px([0, 0]), bx = px([BMIN / COEF[0], 0]), by = px([0, BMIN / COEF[1]]);
    mk("path", { d: "M" + a + " L" + bx + " L" + by + " Z", class: "sd-fill" }, reg);
    mk("line", { x1: bx[0], y1: bx[1], x2: by[0], y2: by[1], class: "sd-edge" }, reg);
    mk("line", { x1: P.l, y1: P.t + PH, x2: P.l + PW, y2: P.t + PH, class: "sd-axis" }, reg);
    mk("line", { x1: P.l, y1: P.t, x2: P.l, y2: P.t + PH, class: "sd-axis" }, reg);
    mk("text", { x: P.l + PW, y: P.t + PH + 22, class: "fd-label", "text-anchor": "end" }, reg).textContent = "cars entering →";
    var yl = mk("text", { x: 0, y: 0, class: "fd-label", "text-anchor": "end", transform: "translate(" + (P.l - 12) + " " + P.t + ") rotate(-90)" }, reg);
    yl.textContent = "trucks entering →";
    var regLab = px([0.16, 0.12]);
    mk("text", { x: regLab[0], y: regLab[1], class: "sd-reg-label" }, reg).textContent = "stable";
    var hit = mk("rect", { x: P.l, y: P.t, width: PW, height: PH, class: "sd-hit" }, reg);
    var dot = mk("circle", { r: 7, class: "sd-dot", tabindex: 0, role: "slider", "aria-label": "Inflow of cars and trucks (arrow keys to move)" }, reg);

    function setLam(l) {
      S.lam = [Math.max(0, Math.min(LMAX[0], l[0])), Math.max(0, Math.min(LMAX[1], l[1]))];
      var p = px(S.lam), ok = inside(S.lam);
      dot.setAttribute("cx", p[0].toFixed(1)); dot.setAttribute("cy", p[1].toFixed(1));
      dot.classList.toggle("out", !ok);
      dot.setAttribute("aria-valuetext", "cars " + S.lam[0].toFixed(2) + ", trucks " + S.lam[1].toFixed(2) + (ok ? ", stable" : ", unstable"));
      el.lc.textContent = S.lam[0].toFixed(2); el.lt.textContent = S.lam[1].toFixed(2);
      el.status.textContent = ok
        ? "Inside the stability region: the traffic settles to free flow."
        : "Outside the stability region: the queue grows without bound.";
      el.status.classList.toggle("out", !ok);
      if (reduce) { S.x = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]; simulate(40); drawRoad(0); }
    }
    function fromEvent(ev) {
      var m = reg.getScreenCTM().inverse(), p = reg.createSVGPoint();
      p.x = ev.clientX; p.y = ev.clientY; p = p.matrixTransform(m);
      return [(p.x - P.l) / PW * LMAX[0], (1 - (p.y - P.t) / PH) * LMAX[1]];
    }
    var dragging = false;
    [hit, dot].forEach(function (t) {
      t.addEventListener("pointerdown", function (ev) {
        dragging = true; reg.setPointerCapture(ev.pointerId); setLam(fromEvent(ev)); ev.preventDefault();
      });
    });
    reg.addEventListener("pointermove", function (ev) { if (dragging) setLam(fromEvent(ev)); });
    reg.addEventListener("pointerup", function () { dragging = false; });
    reg.addEventListener("pointercancel", function () { dragging = false; });
    dot.addEventListener("keydown", function (ev) {
      var d = { ArrowRight: [0.05, 0], ArrowLeft: [-0.05, 0], ArrowUp: [0, 0.03], ArrowDown: [0, -0.03] }[ev.key];
      if (d) { setLam([S.lam[0] + d[0], S.lam[1] + d[1]]); ev.preventDefault(); }
    });

    // ---------------------------------------------------------- boot
    setLam(S.lam);
    simulate(12);
    drawRoad(0);
    if (reduce) return;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { S.visible = e[0].isIntersecting; }).observe(root);
    }
    var prev = 0;
    (function loop(now) {
      var dt = prev ? Math.min((now - prev) / 1000, 0.1) : 0;
      prev = now;
      if (S.visible && dt) { simulate(SIM * dt); drawRoad(dt); }
      requestAnimationFrame(loop);
    })(0);
  }
})();
