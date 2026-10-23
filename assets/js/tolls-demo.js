/*
  Noise-robust tolls on the Wheatstone network (Sipione, Cianfanelli, Como,
  Fagnani, Park, IFAC CPHS 2026).

  Links: e1 = o→a, e2 = o→b, e3 = a→b, e4 = a→d, e5 = b→d, delays
  τ_e(f) = 2f (τ_3 = 0). Routes: p1 = (e1, e4), p2 = (e2, e5), p3 = (e1, e3, e5).
  With marginal-cost tolls every link costs τ_e + f τ_e' = 4f.

  - Live chain (logit dynamics): one random agent revises per tick and picks
    route j with probability ∝ θ_j exp(-c_j(y)/η), y the state after the move.
  - Invariant distribution, exact on the grid Δ_n (potential game, Gibbs form):
      π(x) ∝ n!/(a1! a2! a3!) · Π θ_γ^{a_γ} · exp(-Φ_n(x)/η),
      Φ_n = Σ_e Σ_{s≤N_e} c_e(s/n),  a = n x.
  - Toll update: θ_{k+1} = E_{π^{θ_k}}[X].
*/
(function () {
  "use strict";

  var NS = [25, 50, 100, 200, 400];
  var OPT = 2;          // total travel time at the optimum x* = (1/2, 1/2, 0)
  var MAX_K = 60;
  var NODES = { o: [34, 100], a: [160, 30], b: [160, 170], d: [286, 100] };
  var LINKS = [
    { from: "o", to: "a", label: "2f", paths: [0, 2] },
    { from: "o", to: "b", label: "2f", paths: [1] },
    { from: "a", to: "b", label: "0",  paths: [2] },
    { from: "a", to: "d", label: "2f", paths: [0] },
    { from: "b", to: "d", label: "2f", paths: [1, 2] }
  ];
  var SVGNS = "http://www.w3.org/2000/svg";

  var lfc = [0];
  function lf(m) {
    for (var i = lfc.length; i <= m; i++) lfc[i] = lfc[i - 1] + Math.log(i);
    return lfc[m];
  }

  // link loads N_e for route counts a = [a1, a2, a3]
  function loads(a0, a1, a2) { return [a0 + a2, a1, a2, a0, a1 + a2]; }

  // total travel time Σ_e f_e τ_e(f_e) at shares x
  function ttt(x0, x1, x2) {
    var f = loads(x0, x1, x2);
    return 2 * (f[0] * f[0] + f[1] * f[1] + f[3] * f[3] + f[4] * f[4]);
  }

  document.querySelectorAll("[data-tolls-demo]").forEach(init);

  function init(root) {
    var $ = function (s) { return root.querySelector(s); };
    var el = {
      modes: root.querySelectorAll("[data-mode]"),
      eta: $("[data-eta]"), etaOut: $("[data-eta-out]"),
      n: $("[data-n]"), nOut: $("[data-n-out]"),
      net: $(".td-net"), shares: root.querySelectorAll("[data-share]"),
      box: $(".td-simplex"), canvas: $(".td-simplex canvas"),
      ttt: $("[data-ttt]"), gap: $("[data-gap]"),
      iter: $("[data-iter]"), k: $("[data-k]"), note: $("[data-note]"),
      step: $("[data-step]"), play: $("[data-play]"), reset: $("[data-reset]"),
      chart: $("[data-chart]"), rows: $("[data-rows]")
    };
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var S = {
      mode: "marginal", eta: 1, n: 100,
      theta: [1 / 3, 1 / 3, 1 / 3], k: 0, hist: [],
      dist: null, a: null, trail: [], timer: 0, visible: true
    };
    var C = {};          // colours, read from CSS
    var G = null;        // simplex geometry
    var heat = document.createElement("canvas");

    // ------------------------------------------------------------ maths
    function distribution() {
      var n = S.n, eta = S.eta, L = S.theta.map(function (t) { return Math.log(Math.max(t, 1e-300)); });
      var W = n + 1, logp = new Float64Array(W * W).fill(-Infinity), max = -Infinity;
      var lfn = lf(n);
      for (var a1 = 0; a1 <= n; a1++) {
        for (var a2 = 0; a1 + a2 <= n; a2++) {
          var a0 = n - a1 - a2, N = loads(a0, a1, a2), pot = 0;
          for (var e = 0; e < 5; e++) if (e !== 2) pot += 2 * N[e] * (N[e] + 1) / n;
          var v = lfn - lfc[a0] - lfc[a1] - lfc[a2] + a0 * L[0] + a1 * L[1] + a2 * L[2] - pot / eta;
          logp[a1 * W + a2] = v;
          if (v > max) max = v;
        }
      }
      var p = new Float64Array(W * W), Z = 0, m = [0, 0, 0], T = 0, pmax = 0;
      for (a1 = 0; a1 <= n; a1++) {
        for (a2 = 0; a1 + a2 <= n; a2++) {
          var i = a1 * W + a2, q = Math.exp(logp[i] - max);
          p[i] = q; Z += q;
          var x0 = (n - a1 - a2) / n, x1 = a1 / n, x2 = a2 / n;
          m[0] += q * x0; m[1] += q * x1; m[2] += q * x2;
          T += q * ttt(x0, x1, x2);
          if (q > pmax) pmax = q;
        }
      }
      return { p: p, pmax: pmax, mean: m.map(function (v) { return v / Z; }), ttt: T / Z, n: n };
    }

    function chainStep() {
      var a = S.a, n = S.n, r = Math.random() * n;
      var i = r < a[0] ? 0 : r < a[0] + a[1] ? 1 : 2;
      var w = [0, 0, 0], tot = 0;
      for (var j = 0; j < 3; j++) {
        var y = a.slice(); y[i]--; y[j]++;
        var N = loads(y[0], y[1], y[2]);
        // link cost with marginal tolls: 4 f_e (the middle link is free)
        var c = j === 0 ? N[0] + N[3] : j === 1 ? N[1] + N[4] : N[0] + N[4];
        w[j] = Math.exp(-4 * c / n / S.eta) * (S.mode === "robust" ? S.theta[j] : 1);
        tot += w[j];
      }
      var u = Math.random() * tot, k = u < w[0] ? 0 : u < w[0] + w[1] ? 1 : 2;
      a[i]--; a[k]++;
    }

    function seedChain() {
      var m = S.dist.mean, n = S.n;
      var a1 = Math.round(m[1] * n), a2 = Math.min(n - a1, Math.round(m[2] * n));
      S.a = [n - a1 - a2, a1, a2];
      S.trail = [];
    }

    // ------------------------------------------------------------ colours
    function readColors() {
      var cs = getComputedStyle(root);
      var g = function (v) { return cs.getPropertyValue(v).trim(); };
      C = {
        ink: g("--text"), soft: g("--text-soft"), faint: g("--text-faint"),
        border: g("--border-strong"), road: g("--surface-2"), surface: g("--surface"),
        p: [g("--td-p1"), g("--td-p2"), g("--td-p3")],
        font: getComputedStyle(document.body).fontFamily
      };
      C.inkRGB = hexRGB(C.ink);
    }
    function hexRGB(h) {
      h = h.replace("#", "");
      if (h.length === 3) h = h.replace(/./g, "$&$&");
      var v = parseInt(h, 16);
      return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
    }

    // ------------------------------------------------------------ network
    var net = { strands: [], labels: [] };
    function buildNetwork() {
      var svg = el.net;
      svg.textContent = "";
      var gRoad = mk("g", { class: "td-roads" }), gStr = mk("g"), gNodes = mk("g", { class: "td-nodes" });
      svg.appendChild(gRoad); svg.appendChild(gStr); svg.appendChild(gNodes);
      LINKS.forEach(function (l) {
        var A = NODES[l.from], B = NODES[l.to];
        var dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy);
        var u = [dx / len, dy / len], nrm = [-u[1], u[0]];
        var P = [A[0] + u[0] * 12, A[1] + u[1] * 12], Q = [B[0] - u[0] * 12, B[1] - u[1] * 12];
        l.geo = { P: P, Q: Q, nrm: nrm };
        gRoad.appendChild(mk("line", { x1: P[0], y1: P[1], x2: Q[0], y2: Q[1], class: "td-road" }));
        l.strands = l.paths.map(function (p) {
          var s = mk("line", { class: "td-strand td-s" + (p + 1) });
          gStr.appendChild(s);
          return { p: p, node: s };
        });
        // delay label, pushed away from the centre of the drawing
        var mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
        var cx = mx - 160, cy = my - 100, cl = Math.hypot(cx, cy);
        var off = cl < 1 ? [16, 0] : [cx / cl * 18, cy / cl * 18];
        var t = mk("text", { x: mx + off[0], y: my + off[1] + 4, class: "td-cost" });
        t.textContent = l.label;
        gStr.appendChild(t);
      });
      Object.keys(NODES).forEach(function (k) {
        var c = NODES[k];
        gNodes.appendChild(mk("circle", { cx: c[0], cy: c[1], r: 11 }));
        var t = mk("text", { x: c[0], y: c[1] + 4 });
        t.textContent = k;
        gNodes.appendChild(t);
      });
    }
    function mk(tag, attrs) {
      var e = document.createElementNS(SVGNS, tag);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      return e;
    }
    function drawNetwork(x) {
      LINKS.forEach(function (l) {
        var ws = l.strands.map(function (s) { return 15 * x[s.p]; });
        var gap = 1.5, T = ws.reduce(function (s, w) { return s + w; }, 0) + gap * (ws.length - 1);
        var off = -T / 2, g = l.geo;
        l.strands.forEach(function (s, i) {
          var w = ws[i], c = off + w / 2;
          off += w + gap;
          s.node.setAttribute("x1", (g.P[0] + g.nrm[0] * c).toFixed(1));
          s.node.setAttribute("y1", (g.P[1] + g.nrm[1] * c).toFixed(1));
          s.node.setAttribute("x2", (g.Q[0] + g.nrm[0] * c).toFixed(1));
          s.node.setAttribute("y2", (g.Q[1] + g.nrm[1] * c).toFixed(1));
          s.node.setAttribute("stroke-width", Math.max(w, 0.01).toFixed(2));
          s.node.style.opacity = w < 0.25 ? 0 : 1;
        });
      });
      el.shares.forEach(function (b, i) { b.textContent = Math.round(100 * x[i]) + "%"; });
    }

    // ------------------------------------------------------------ simplex
    function layout() {
      var w = el.box.clientWidth;
      if (!w) return false;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var padX = 26, padT = 24, padB = 40;
      var side = w - 2 * padX, h = side * Math.sqrt(3) / 2;
      var H = Math.round(padT + h + padB);
      el.canvas.width = Math.round(w * dpr); el.canvas.height = Math.round(H * dpr);
      el.canvas.style.width = w + "px"; el.canvas.style.height = H + "px";
      G = { w: w, H: H, dpr: dpr, side: side, h: h, V1: [padX, padT + h], V2: [padX + side, padT + h], V3: [padX + side / 2, padT] };
      return true;
    }
    function pt(x) {
      return [x[0] * G.V1[0] + x[1] * G.V2[0] + x[2] * G.V3[0], x[0] * G.V1[1] + x[1] * G.V2[1] + x[2] * G.V3[1]];
    }
    function renderHeat() {
      if (!G) return;
      var D = S.dist, n = D.n, W = n + 1, dpr = G.dpr;
      var x0 = Math.floor(G.V1[0] * dpr), x1 = Math.ceil(G.V2[0] * dpr);
      var y0 = Math.floor(G.V3[1] * dpr), y1 = Math.ceil(G.V1[1] * dpr);
      heat.width = x1 - x0; heat.height = y1 - y0;
      var ctx = heat.getContext("2d"), img = ctx.createImageData(heat.width, heat.height), d = img.data;
      var rgb = C.inkRGB, inv = 1 / D.pmax;
      for (var py = 0; py < heat.height; py++) {
        var cy = (py + y0 + 0.5) / dpr, s2 = (G.V1[1] - cy) / G.h;
        if (s2 < 0 || s2 > 1) continue;
        for (var px = 0; px < heat.width; px++) {
          var cx = (px + x0 + 0.5) / dpr;
          var s1 = (cx - G.V1[0] - s2 * G.side / 2) / G.side;
          if (s1 < 0 || s1 + s2 > 1) continue;
          var a2 = Math.round(s2 * n), a1 = Math.min(n - a2, Math.round(s1 * n));
          var q = D.p[a1 * W + a2] * inv;
          if (q < 1e-4) continue;
          var o = 4 * (py * heat.width + px);
          d[o] = rgb[0]; d[o + 1] = rgb[1]; d[o + 2] = rgb[2];
          d[o + 3] = Math.round(230 * Math.pow(q, 0.5));
        }
      }
      ctx.putImageData(img, 0, 0);
      G.heatAt = [x0, y0];
    }
    function drawSimplex() {
      if (!G) return;
      var ctx = el.canvas.getContext("2d"), dpr = G.dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, el.canvas.width, el.canvas.height);
      ctx.drawImage(heat, G.heatAt[0], G.heatAt[1]);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // triangle
      ctx.beginPath();
      ctx.moveTo(G.V1[0], G.V1[1]); ctx.lineTo(G.V2[0], G.V2[1]); ctx.lineTo(G.V3[0], G.V3[1]); ctx.closePath();
      ctx.strokeStyle = C.border; ctx.lineWidth = 1; ctx.stroke();

      // vertex labels: route colour dot + name in text ink
      ctx.font = "500 12px " + C.font; ctx.textBaseline = "middle";
      [[G.V1, 0, 18], [G.V2, 1, 18], [G.V3, 2, -13]].forEach(function (v) {
        var x = v[0][0], y = v[0][1] + v[2], txt = "p" + "₁₂₃"[v[1]] + " only";
        var tw = ctx.measureText(txt).width, x0 = x - (tw + 12) / 2;
        if (v[1] === 0) x0 = Math.max(2, x0);
        if (v[1] === 1) x0 = Math.min(G.w - tw - 14, x0);
        ctx.fillStyle = C.p[v[1]];
        ctx.beginPath(); ctx.arc(x0 + 4, y, 4, 0, 2 * Math.PI); ctx.fill();
        ctx.fillStyle = C.soft; ctx.textAlign = "left";
        ctx.fillText(txt, x0 + 12, y);
      });

      // system optimum x* = (1/2, 1/2, 0)
      var o = pt([0.5, 0.5, 0]);
      ctx.beginPath(); ctx.arc(o[0], o[1], 6, 0, 2 * Math.PI);
      ctx.lineWidth = 2; ctx.strokeStyle = C.ink; ctx.stroke();
      ctx.fillStyle = C.soft; ctx.textAlign = "center"; ctx.font = "500 12px " + C.font;
      ctx.fillText("system optimum", o[0], o[1] + 18);

      // learned θ_k
      if (S.mode === "robust" && S.hist.length > 1) {
        ctx.setLineDash([3, 3]); ctx.strokeStyle = C.soft; ctx.lineWidth = 1.5;
        ctx.beginPath();
        S.hist.forEach(function (h, i) { var q = pt(h.theta); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); });
        ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = C.soft;
        S.hist.forEach(function (h) { var q = pt(h.theta); ctx.beginPath(); ctx.arc(q[0], q[1], 2.2, 0, 2 * Math.PI); ctx.fill(); });
        var last = pt(S.theta);
        ctx.textAlign = "left"; ctx.font = "italic 500 12px " + C.font;
        ctx.fillText("θ", last[0] + 8, last[1] - 8);
      }

      // live state and its recent trail
      if (S.a && !reduce) {
        if (S.trail.length > 1) {
          ctx.strokeStyle = C.ink; ctx.globalAlpha = 0.28; ctx.lineWidth = 1.2;
          ctx.beginPath();
          S.trail.forEach(function (q, i) { if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); });
          ctx.stroke(); ctx.globalAlpha = 1;
        }
        var c = pt([S.a[0] / S.n, S.a[1] / S.n, S.a[2] / S.n]);
        ctx.beginPath(); ctx.arc(c[0], c[1], 5, 0, 2 * Math.PI);
        ctx.fillStyle = C.ink; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = C.surface; ctx.stroke();
      }
    }

    // ------------------------------------------------------------ chart
    function drawChart() {
      var box = el.chart;
      if (S.mode !== "robust") { box.hidden = true; return; }
      box.hidden = false;
      var w = box.clientWidth || 600, H = 150, m = { l: 58, r: 14, t: 14, b: 30 };
      var iw = w - m.l - m.r, ih = H - m.t - m.b;
      var kmax = Math.max(10, S.k), ys = S.hist.map(function (h) { return h.ttt; });
      var ymax = Math.max.apply(null, ys), span = Math.max(ymax - OPT, 0.004);
      var y0 = OPT - span * 0.12, y1 = ymax + span * 0.12;
      var X = function (k) { return m.l + iw * k / kmax; };
      var Y = function (v) { return m.t + ih * (1 - (v - y0) / (y1 - y0)); };
      var d = S.hist.map(function (h, i) { return (i ? "L" : "M") + X(h.k).toFixed(1) + " " + Y(h.ttt).toFixed(1); }).join("");
      var last = S.hist[S.hist.length - 1];
      var xt = [0, Math.round(kmax / 2), kmax];
      var s = '<svg viewBox="0 0 ' + w + " " + H + '" width="' + w + '" height="' + H + '" role="img" aria-label="Expected total travel time after each toll update">';
      s += '<line class="td-ref" x1="' + m.l + '" x2="' + (m.l + iw) + '" y1="' + Y(OPT) + '" y2="' + Y(OPT) + '"/>';
      s += '<text class="td-ax" x="' + (m.l + 8) + '" y="' + (Y(OPT) - 6) + '" text-anchor="start">optimum</text>';
      s += '<text class="td-ax" x="' + (m.l - 8) + '" y="' + (Y(ymax) + 4) + '" text-anchor="end">' + ymax.toFixed(3) + "</text>";
      s += '<text class="td-ax" x="' + (m.l - 8) + '" y="' + (Y(OPT) + 4) + '" text-anchor="end">2.000</text>';
      xt.forEach(function (k) { s += '<text class="td-ax" x="' + X(k) + '" y="' + (H - 10) + '" text-anchor="middle">' + k + "</text>"; });
      s += '<text class="td-ax" x="' + (m.l - 12) + '" y="' + (H - 10) + '" text-anchor="end">update k</text>';
      s += '<line class="td-axis" x1="' + m.l + '" x2="' + (m.l + iw) + '" y1="' + (m.t + ih) + '" y2="' + (m.t + ih) + '"/>';
      s += '<path class="td-line" d="' + d + '"/>';
      s += '<circle class="td-dot" cx="' + X(last.k) + '" cy="' + Y(last.ttt) + '" r="4.5"/>';
      s += '<g class="td-hover" hidden><line class="td-rule" y1="' + m.t + '" y2="' + (m.t + ih) + '"/><circle class="td-dot" r="4.5"/></g>';
      s += '<rect class="td-hit" x="' + m.l + '" y="0" width="' + iw + '" height="' + H + '"/>';
      s += "</svg><div class=\"td-tip\" hidden></div>";
      box.innerHTML = s;

      var hov = box.querySelector(".td-hover"), rule = hov.querySelector("line"), dot = hov.querySelector("circle"), tip = box.querySelector(".td-tip");
      var hit = box.querySelector(".td-hit");
      hit.addEventListener("pointermove", function (ev) {
        var r = hit.getBoundingClientRect(), k = Math.round((ev.clientX - r.left) / r.width * kmax);
        var h = S.hist[Math.max(0, Math.min(S.hist.length - 1, k))];
        var cx = X(h.k), cy = Y(h.ttt);
        rule.setAttribute("x1", cx); rule.setAttribute("x2", cx);
        dot.setAttribute("cx", cx); dot.setAttribute("cy", cy);
        hov.hidden = false; tip.hidden = false;
        tip.innerHTML = "<b>k = " + h.k + "</b> · E[TTT] " + h.ttt.toFixed(3) + " · " + gapText(h.ttt);
        var tx = Math.min(Math.max(cx - tip.offsetWidth / 2, 0), w - tip.offsetWidth);
        tip.style.left = tx + "px"; tip.style.top = Math.max(cy - 40, 0) + "px";
      });
      hit.addEventListener("pointerleave", function () { hov.hidden = true; tip.hidden = true; });
    }
    function gapText(v) { return "+" + (100 * (v / OPT - 1)).toFixed(1) + "% vs optimum"; }

    function drawTable() {
      var rows = S.mode === "robust" ? S.hist : [{ k: 0, theta: S.theta, ttt: S.dist.ttt }];
      el.rows.innerHTML = rows.map(function (h) {
        return "<tr><td>" + h.k + "</td><td>" + h.theta[0].toFixed(3) + "</td><td>" + h.theta[1].toFixed(3) +
          "</td><td>" + h.theta[2].toFixed(3) + "</td><td>" + h.ttt.toFixed(3) + "</td></tr>";
      }).join("");
    }

    // ------------------------------------------------------------ state changes
    function update(resetChain) {
      S.dist = distribution();
      if (resetChain || !S.a) seedChain();
      if (S.mode === "robust" && (S.hist.length === 0 || S.hist[S.hist.length - 1].k !== S.k)) {
        S.hist.push({ k: S.k, theta: S.theta.slice(), ttt: S.dist.ttt });
      }
      el.ttt.textContent = S.dist.ttt.toFixed(3);
      el.gap.textContent = gapText(S.dist.ttt);
      el.k.textContent = S.k;
      el.step.disabled = S.k >= MAX_K;
      renderHeat(); drawSimplex(); drawChart(); drawTable();
      if (reduce) drawNetwork(S.dist.mean);
    }
    function restart() {
      stopPlay();
      S.theta = [1 / 3, 1 / 3, 1 / 3]; S.k = 0; S.hist = [];
      update(false);
    }
    function stepTolls() {
      if (S.k >= MAX_K) { stopPlay(); return; }
      S.theta = S.dist.mean.map(function (v) { return Math.max(v, 1e-12); });
      S.k++;
      update(false);
    }
    function stopPlay() {
      clearInterval(S.timer); S.timer = 0;
      el.play.setAttribute("aria-pressed", "false"); el.play.textContent = "Play";
    }

    el.modes.forEach(function (b) {
      b.addEventListener("click", function () {
        S.mode = b.dataset.mode;
        el.modes.forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
        el.iter.hidden = S.mode !== "robust";
        el.note.hidden = S.mode === "robust";
        restart();
      });
    });
    el.eta.addEventListener("input", function () {
      S.eta = parseFloat(el.eta.value);
      el.etaOut.textContent = S.eta.toFixed(1);
      restart();
    });
    el.n.addEventListener("input", function () {
      var old = S.n;
      S.n = NS[+el.n.value];
      el.nOut.textContent = S.n;
      if (S.a) {
        var a1 = Math.round(S.a[1] / old * S.n), a2 = Math.min(S.n - a1, Math.round(S.a[2] / old * S.n));
        S.a = [S.n - a1 - a2, a1, a2]; S.trail = [];
      }
      restart();
    });
    el.step.addEventListener("click", function () { stopPlay(); stepTolls(); });
    el.reset.addEventListener("click", restart);
    el.play.addEventListener("click", function () {
      if (S.timer) { stopPlay(); return; }
      if (S.k >= MAX_K) restart();
      el.play.setAttribute("aria-pressed", "true"); el.play.textContent = "Pause";
      S.timer = setInterval(stepTolls, 450);
    });

    // ------------------------------------------------------------ boot
    readColors();
    buildNetwork();
    layout();
    update(true);

    new ResizeObserver(function () { if (layout()) { S.trail = []; renderHeat(); drawSimplex(); drawChart(); } }).observe(el.box);
    var recolor = function () { readColors(); renderHeat(); drawSimplex(); drawChart(); };
    new MutationObserver(recolor).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", recolor);

    if (reduce) return;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { S.visible = e[0].isIntersecting; }).observe(root);
    }
    var frame = 0;
    (function loop() {
      if (S.visible && S.a) {
        var steps = Math.ceil(S.n / 10);
        for (var i = 0; i < steps; i++) chainStep();
        var x = [S.a[0] / S.n, S.a[1] / S.n, S.a[2] / S.n];
        if (++frame % 3 === 0) {
          S.trail.push(pt(x));
          if (S.trail.length > 40) S.trail.shift();
        }
        drawNetwork(x);
        drawSimplex();
      }
      requestAnimationFrame(loop);
    })();
  }
})();
