/*
  Noise-adaptive tolls on the Wheatstone network (Sipione, Cianfanelli, Como,
  Fagnani, Park, IFAC CPHS 2026).

  Links: o→a, o→b, a→b, a→d, b→d with delays τ(f) = 2f (a→b is free).
  Routes: p1 = o–a–d, p2 = o–b–d, p3 = o–a–b–d. With marginal-cost tolls
  every link costs τ + f τ' = 4f. Optimum: half on p1, half on p2 (TTT = 2).

  - Cars: each driver loops o → d; on arrival it revises its route with the
    logit rule, probability ∝ θ_j exp(-c_j(y)/η), y the state after the move.
  - Numbers: exact invariant distribution of the logit chain on Δ_n
    (Gibbs form), π(x) ∝ n!/(a1! a2! a3!) Π θ^a exp(-Φ_n/η).
  - Noise-adaptive tolls: -η log θ_γ on each route, with θ_{k+1} = E_{π^{θ_k}}[X].
*/
(function () {
  "use strict";

  var N = 40, ETA = 1, OPT = 2;
  var TRIP = 5;            // seconds for one trip o → d
  var EVERY = 2.2;         // seconds between toll updates
  var MAX_K = 25;
  var SVGNS = "http://www.w3.org/2000/svg";
  var P = { o: [40, 118], a: [200, 36], b: [200, 200], d: [360, 118] };
  var ROUTES = [["o", "a", "d"], ["o", "b", "d"], ["o", "a", "b", "d"]];
  var LANE = 3.4;          // lane offset on the shared roads
  var OWN = [["a", "d"], ["o", "b"], ["a", "b"]];   // exclusive road of each route

  // link loads for route counts (a0, a1, a2): o→a, o→b, a→b, a→d, b→d
  function loads(a0, a1, a2) { return [a0 + a2, a1, a2, a0, a1 + a2]; }
  function ttt(x0, x1, x2) {
    var f = loads(x0, x1, x2);
    return 2 * (f[0] * f[0] + f[1] * f[1] + f[3] * f[3] + f[4] * f[4]);
  }
  var LF = [0];
  for (var i = 1; i <= N; i++) LF[i] = LF[i - 1] + Math.log(i);

  function distribution(theta) {
    var L = theta.map(function (t) { return Math.log(Math.max(t, 1e-300)); });
    var states = [], max = -Infinity;
    for (var a1 = 0; a1 <= N; a1++) {
      for (var a2 = 0; a1 + a2 <= N; a2++) {
        var a0 = N - a1 - a2, f = loads(a0, a1, a2), pot = 0;
        for (var e = 0; e < 5; e++) if (e !== 2) pot += 2 * f[e] * (f[e] + 1) / N;
        var v = LF[N] - LF[a0] - LF[a1] - LF[a2] + a0 * L[0] + a1 * L[1] + a2 * L[2] - pot / ETA;
        states.push([a0, a1, a2, v]);
        if (v > max) max = v;
      }
    }
    var Z = 0, m = [0, 0, 0], T = 0;
    states.forEach(function (s) {
      var q = Math.exp(s[3] - max), x0 = s[0] / N, x1 = s[1] / N, x2 = s[2] / N;
      Z += q; m[0] += q * x0; m[1] += q * x1; m[2] += q * x2; T += q * ttt(x0, x1, x2);
    });
    return { mean: m.map(function (v) { return v / Z; }), ttt: T / Z };
  }

  document.querySelectorAll("[data-tolls-demo]").forEach(init);

  function init(root) {
    var svg = root.querySelector(".td-net");
    var el = {
      modes: root.querySelectorAll("[data-mode]"),
      ttt: root.querySelector("[data-ttt]"), gap: root.querySelector("[data-gap]"),
      shares: root.querySelectorAll("[data-share]")
    };
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var S = { mode: "marginal", theta: [1 / 3, 1 / 3, 1 / 3], k: 0, dist: null, visible: true, clock: 0, sinceUpdate: 0 };

    // ---------------------------------------------------------- geometry
    function mk(tag, attrs, parent) {
      var e = document.createElementNS(SVGNS, tag);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(e);
      return e;
    }
    function seg(from, to) {
      var A = P[from], B = P[to], dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy);
      return { A: A, B: B, u: [dx / len, dy / len], len: len };
    }
    // lane offset of route r on road (from, to): outer lane for the direct
    // route, inner lane for the middle route, centre when the road is not shared
    function laneOffset(r, from, to) {
      var shared = (from === "o" && to === "a") || (from === "b" && to === "d");
      if (!shared) return 0;
      var s = seg(from, to), nrm = [-s.u[1], s.u[0]];
      var mid = [(s.A[0] + s.B[0]) / 2, (s.A[1] + s.B[1]) / 2];
      var out = (mid[0] - 200) * nrm[0] + (mid[1] - 118) * nrm[1] > 0 ? 1 : -1;
      return (r === 2 ? -1 : 1) * out * LANE;
    }
    var routes = ROUTES.map(function (nodes, r) {
      var segs = [], total = 0;
      for (var i = 0; i + 1 < nodes.length; i++) {
        var s = seg(nodes[i], nodes[i + 1]);
        s.off = laneOffset(r, nodes[i], nodes[i + 1]);
        s.start = total; total += s.len;
        segs.push(s);
      }
      return { segs: segs, len: total };
    });
    function along(r, s) {
      var R = routes[r], d = s * R.len, g = R.segs[R.segs.length - 1];
      for (var i = 0; i < R.segs.length; i++) if (d < R.segs[i].start + R.segs[i].len) { g = R.segs[i]; break; }
      var t = Math.min(d - g.start, g.len), nrm = [-g.u[1], g.u[0]];
      return {
        x: g.A[0] + g.u[0] * t + nrm[0] * g.off,
        y: g.A[1] + g.u[1] * t + nrm[1] * g.off,
        deg: Math.atan2(g.u[1], g.u[0]) * 180 / Math.PI
      };
    }

    // ---------------------------------------------------------- drawing
    var gRoads = mk("g", {}, svg), gTags = mk("g", { class: "td-tags" }), gCars = mk("g", {}, svg), gNodes = mk("g", {}, svg);
    svg.appendChild(gTags);
    [["o", "a"], ["o", "b"], ["a", "b"], ["a", "d"], ["b", "d"]].forEach(function (l) {
      var A = P[l[0]], B = P[l[1]], d = "M" + A[0] + " " + A[1] + " L" + B[0] + " " + B[1];
      var shared = (l[0] === "o" && l[1] === "a") || (l[0] === "b" && l[1] === "d");
      mk("path", { d: d, class: "td-road" + (shared ? " td-road-2" : "") }, gRoads);
      if (shared) mk("path", { d: d, class: "hn-lane" }, gRoads);
      // delay label, pushed away from the centre
      var mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, cx = mx - 200, cy = my - 118, cl = Math.hypot(cx, cy);
      var off = cl < 1 ? [-20, 4] : [cx / cl * 20, cy / cl * 20 + 4];
      mk("text", { x: mx + off[0], y: my + off[1], class: "td-cost" }, gRoads).textContent = l[0] === "a" && l[1] === "b" ? "free" : "2·flow";
    });
    Object.keys(P).forEach(function (k) {
      var big = k === "o" || k === "d";
      mk("circle", { cx: P[k][0], cy: P[k][1], r: big ? 11 : 7, class: big ? "hn-hub" : "hn-node" }, gNodes);
      if (big) mk("text", { x: P[k][0], y: P[k][1] + 4, class: "td-node" }, gNodes).textContent = k;
    });
    // toll tags on each route's own road
    var tags = OWN.map(function (l, r) {
      var A = P[l[0]], B = P[l[1]], mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
      var g = mk("g", { class: "td-tag", transform: "translate(" + (r === 2 ? mx + 34 : mx) + " " + (r === 2 ? my : my + (my < 118 ? -22 : 22)) + ")" }, gTags);
      mk("rect", { x: -27, y: -10, width: 54, height: 20, rx: 10 }, g);
      var t = mk("text", { y: 4 }, g);
      return { g: g, t: t };
    });

    // ---------------------------------------------------------- drivers
    var cars = [];
    function assign(shares) {
      // route of each driver from target shares, interleaved so cars spread out
      var counts = [Math.round(shares[0] * N), Math.round(shares[1] * N)];
      counts.push(N - counts[0] - counts[1]);
      var order = [];
      for (var r = 0; r < 3; r++) for (var j = 0; j < counts[r]; j++) order.push([(j + 0.5) / counts[r], r]);
      order.sort(function (p, q) { return p[0] - q[0]; });
      return order.map(function (o) { return o[1]; });
    }
    var start = assign([0.42, 0.42, 0.16]);
    for (var c = 0; c < N; c++) {
      var rect = mk("rect", { x: -4.6, y: -2.6, width: 9.2, height: 5.2, rx: 2, class: "td-car" }, gCars);
      cars.push({ r: start[c], phase: c / N, node: rect, last: 0 });
    }
    function counts() {
      var a = [0, 0, 0];
      cars.forEach(function (c) { a[c.r]++; });
      return a;
    }
    function revise(car) {
      var a = counts(), w = [0, 0, 0], tot = 0;
      a[car.r]--;
      for (var j = 0; j < 3; j++) {
        var y = a.slice(); y[j]++;
        var f = loads(y[0], y[1], y[2]);
        var c = j === 0 ? f[0] + f[3] : j === 1 ? f[1] + f[4] : f[0] + f[4];
        w[j] = Math.exp(-4 * c / N / ETA) * (S.mode === "robust" ? S.theta[j] : 1);
        tot += w[j];
      }
      var u = Math.random() * tot;
      car.r = u < w[0] ? 0 : u < w[0] + w[1] ? 1 : 2;
    }
    function drawCars() {
      var a = [0, 0, 0];
      cars.forEach(function (c) {
        var s = reduce ? c.phase : (S.clock / TRIP + c.phase) % 1;
        if (!reduce && s < c.last) revise(c);         // arrived at d: choose again
        c.last = s;
        a[c.r]++;
        var p = along(c.r, s), fade = Math.min(1, s / 0.04, (1 - s) / 0.04);
        c.node.setAttribute("transform", "translate(" + p.x.toFixed(1) + " " + p.y.toFixed(1) + ") rotate(" + p.deg.toFixed(0) + ")");
        c.node.setAttribute("class", "td-car td-c" + (c.r + 1));
        c.node.style.opacity = fade.toFixed(2);
      });
      el.shares.forEach(function (b, i) { b.textContent = Math.round(100 * a[i] / N) + "%"; });
    }

    // ---------------------------------------------------------- numbers
    function show() {
      el.ttt.textContent = S.dist.ttt.toFixed(3);
      var gap = 100 * (S.dist.ttt / OPT - 1);
      el.gap.textContent = (gap < 0.05 ? "at the optimum (2.000)" : gap.toFixed(1) + "% above the optimum (2.000)") +
        (S.mode === "robust" ? " · toll update " + S.k : "");
      var maxT = Math.max.apply(null, S.theta);
      tags.forEach(function (t, r) {
        var toll = ETA * Math.log(maxT / S.theta[r]);
        var on = S.mode === "robust" && toll >= 0.05;
        t.g.classList.toggle("on", on);
        if (on) t.t.textContent = "toll " + toll.toFixed(1);
      });
    }
    function setMode(m) {
      S.mode = m; S.k = 0; S.sinceUpdate = 0;
      S.theta = [1 / 3, 1 / 3, 1 / 3];
      S.dist = distribution(S.theta);
      if (reduce && m === "robust") while (S.k < MAX_K) step();
      el.modes.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.mode === m)); });
      if (reduce) relayout();
      show();
    }
    function step() {
      S.theta = S.dist.mean.map(function (v) { return Math.max(v, 1e-12); });
      S.dist = distribution(S.theta);
      S.k++;
    }
    function relayout() {
      var r = assign(S.dist.mean);
      cars.forEach(function (c, i) { c.r = r[i]; });
      drawCars();
    }

    el.modes.forEach(function (b) { b.addEventListener("click", function () { if (b.dataset.mode !== S.mode || S.mode === "robust") setMode(b.dataset.mode); }); });
    setMode("marginal");
    drawCars();
    if (reduce) { relayout(); return; }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { S.visible = e[0].isIntersecting; }).observe(root);
    }
    var prev = 0;
    (function loop(now) {
      var dt = prev ? Math.min((now - prev) / 1000, 0.25) : 0;
      prev = now;
      if (S.visible && dt) {
        S.clock += dt;
        if (S.mode === "robust" && S.k < MAX_K && (S.sinceUpdate += dt) >= EVERY) {
          S.sinceUpdate = 0;
          step(); show();
        }
        drawCars();
      }
      requestAnimationFrame(loop);
    })(0);
  }
})();
