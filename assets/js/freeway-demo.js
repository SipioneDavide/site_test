/*
  Freeway control demo (Sipione, Como, Nilsson: L-CSS 2026, arXiv:2512.19827).

  Plays back two precomputed runs of a multi-commodity cell transmission
  model during a morning peak (data in assets/data/freeway-demo.json, made by
  tools/freeway-demo/freeway_demo.m):
    - none: no control, FIFO diverge, the lane-drop queue blocks the off-ramp;
    - opt:  optimum of the convex relaxation, applied as speed limits by
            destination and ramp metering (exact: no congestion is created).
  States (0-based): 0/1 upstream through/exit, 2..9 cells M1..M4 (through,
  exit), 10 M5, 11 M6 (through only), 12 on-ramp queue.
*/
(function () {
  "use strict";

  var SVGNS = "http://www.w3.org/2000/svg";
  var SPS = 4;            // model steps (minutes) per second of animation
  var VIS = 0.75;         // cells per second crossed by a car at full speed
  var SCALE = 4;          // vehicles per drawn car
  var Y = 86, LANE = 4.9, X0 = 118, CW = 70, CRIT = 20, JAM = 60;
  var CAR = { w: 8.2, h: 4.7 };
  var RAMP_IN = [[78, 186], [186, Y + 8]];
  var RAMP_OUT = [[398, Y + 8], [500, 186]];

  document.querySelectorAll("[data-freeway-demo]").forEach(init);

  function init(root) {
    var D = JSON.parse(root.querySelector("[data-fd-data]").textContent);
    var svg = root.querySelector(".fd-net");
    var el = {
      modes: root.querySelectorAll("[data-mode]"),
      clock: root.querySelector("[data-clock]"),
      ttt: root.querySelector("[data-ttt]"), cmp: root.querySelector("[data-cmp]")
    };
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var S = { mode: "none", t: 0, hold: 0, visible: true, phase: {} };

    function mk(tag, attrs, parent) {
      var e = document.createElementNS(SVGNS, tag);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(e);
      return e;
    }
    function lerp(a, b, f) { return a + (b - a) * f; }

    // ---------------------------------------------------------- static drawing
    var gRoad = mk("g", {}, svg), gTint = mk("g", {}, svg), gCars = mk("g", {}, svg), gUI = mk("g", {}, svg);
    var tints = [];
    for (var j = 0; j < 6; j++) {
      tints.push(mk("rect", { x: X0 + j * CW, y: j === 5 ? Y - LANE - 5 : Y - 9.5, width: CW, height: j === 5 ? 10 : 19, class: "fd-tint" }, gTint));
    }
    mk("path", { d: "M" + RAMP_IN[0] + " L" + RAMP_IN[1], class: "td-road fd-ramp" }, gRoad);
    mk("path", { d: "M" + RAMP_OUT[0] + " L" + RAMP_OUT[1], class: "td-road fd-ramp" }, gRoad);
    mk("path", { d: "M14 " + Y + " H" + (X0 + 5 * CW), class: "td-road fd-main" }, gRoad);
    mk("path", { d: "M" + (X0 + 5 * CW) + " " + (Y - 8.5) + " H" + (X0 + 5 * CW + 22) + " L" + (X0 + 5 * CW) + " " + (Y + 9.5) + " Z", class: "fd-taper" }, gRoad);
    mk("path", { d: "M" + (X0 + 5 * CW) + " " + (Y - LANE) + " H592", class: "td-road fd-one" }, gRoad);
    mk("path", { d: "M14 " + Y + " H" + (X0 + 5 * CW), class: "hn-lane" }, gRoad);
    for (j = 0; j <= 6; j++) mk("line", { x1: X0 + j * CW, x2: X0 + j * CW, y1: Y - 12, y2: Y - 9.5, class: "fd-tick" }, gRoad);
    label(40, Y + 26, "upstream", "start");
    label(92, 200, "on-ramp", "middle");
    label(498, 200, "off-ramp", "middle");
    label(X0 + 5 * CW + 30, Y + 18, "lane drop", "start");
    label(592, Y - 14, "→", "end");
    function label(x, y, txt, anchor) {
      mk("text", { x: x, y: y, class: "fd-label", "text-anchor": anchor }, gRoad).textContent = txt;
    }

    // controls (optimal mode): speed-limit plates upstream, ramp meter
    var gCtl = mk("g", { class: "fd-ctl" }, gUI);
    mk("line", { x1: 74, x2: 74, y1: 42, y2: Y - 9, class: "fd-pole" }, gCtl);
    mk("line", { x1: 104, x2: 104, y1: 42, y2: Y - 9, class: "fd-pole" }, gCtl);
    var plates = [0, 1].map(function (c) {
      var g = mk("g", { transform: "translate(" + (c ? 104 : 74) + " 36)" }, gCtl);
      mk("rect", { x: -13, y: -10, width: 26, height: 20, rx: 4, class: "fd-plate fd-plate-" + (c ? "ext" : "thr") }, g);
      return mk("text", { y: 4, class: "fd-plate-num" }, g);
    });
    mk("text", { x: 89, y: 16, class: "fd-label", "text-anchor": "middle" }, gCtl).textContent = "speed limits";
    var meter = mk("text", { x: 196, y: 128, class: "fd-label", "text-anchor": "start" }, gCtl);
    // queue badges
    var qUp = mk("text", { x: 16, y: Y - 16, class: "fd-q", "text-anchor": "start" }, gUI);
    var qRamp = mk("text", { x: 46, y: 176, class: "fd-q", "text-anchor": "middle" }, gUI);

    // car pool
    var pool = [], used = 0;
    function car(x, y, deg, cls, op) {
      var r = pool[used];
      if (!r) { r = mk("rect", { x: -CAR.w / 2, y: -CAR.h / 2, width: CAR.w, height: CAR.h, rx: 1.8 }, gCars); pool.push(r); }
      used++;
      r.setAttribute("transform", "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ")" + (deg ? " rotate(" + deg.toFixed(0) + ")" : ""));
      r.setAttribute("class", "fd-car " + cls);
      r.style.opacity = op < 1 ? op.toFixed(2) : "";
      r.style.display = "";
    }

    // ---------------------------------------------------------- frame
    function sample(run, key, k, ti, f) {
      var a = run[key][k], hi = Math.min(ti + 1, a.length - 1);
      return lerp(a[Math.min(ti, a.length - 1)], a[hi], f);
    }
    function speed(run, k, ti) {
      var x = run.x[k][ti], z = run.z[k][Math.min(ti, run.z[k].length - 1)];
      return x > 0.05 ? Math.min(1, z / x) : 1;
    }
    function advance(key, sp, dt) {
      S.phase[key] = ((S.phase[key] || Math.random()) + sp * VIS * dt) % 1;
      return S.phase[key];
    }
    // n cars spread along [x1, x2] on a lane, moving with phase ph
    function stream(n, ph, x1, x2, y, cls) {
      var m = Math.ceil(n - 1e-6);
      for (var k = 0; k < m; k++) {
        var s = (ph + k / n) % 1, op = k === m - 1 ? n - (m - 1) : 1;
        car(lerp(x1, x2, s), y, 0, cls, op);
      }
    }
    function along(P0, P1, s) {
      return [lerp(P0[0], P1[0], s), lerp(P0[1], P1[1], s), Math.atan2(P1[1] - P0[1], P1[0] - P0[0]) * 180 / Math.PI];
    }

    function draw(dt) {
      var run = D[S.mode], T = D.T;
      var tf = Math.min(S.t, T), ti = Math.min(Math.floor(tf), T - 1), f = tf - ti;
      used = 0;

      // mainline cells
      for (var j = 0; j < 6; j++) {
        var kT = j < 4 ? 2 + 2 * j : 6 + j, kE = j < 4 ? 3 + 2 * j : -1;
        var xT = sample(run, "x", kT, ti, f), xE = kE >= 0 ? sample(run, "x", kE, ti, f) : 0;
        var x1 = X0 + j * CW + 3, x2 = X0 + (j + 1) * CW - 3;
        var rho = xT + xE;
        tints[j].style.opacity = Math.max(0, Math.min(1, (rho - CRIT) / (JAM - CRIT) * 1.6)) * 0.5;
        if (j < 4) {
          stream(xT / SCALE, advance("t" + j, speed(run, kT, ti), dt), x1, x2, Y - LANE, "fd-thr");
          stream(xE / SCALE, advance("e" + j, speed(run, kE, ti), dt), x1, x2, Y + LANE, "fd-ext");
        } else if (j === 4) {
          var ph = advance("t4", speed(run, kT, ti), dt);
          stream(xT / SCALE / 2, ph, x1, x2, Y - LANE, "fd-thr");
          stream(xT / SCALE / 2, (ph + 0.5 / Math.max(xT / SCALE / 2, 1)) % 1, x1, x2, Y + LANE, "fd-thr");
        } else {
          stream(xT / SCALE, advance("t5", speed(run, kT, ti), dt), x1, x2, Y - LANE, "fd-thr");
        }
      }

      // queues: upstream (both destinations) and on-ramp, stacked back from the merge
      var lamO = lerp(D.lamO[ti], D.lamO[Math.min(ti + 1, T - 1)], f), lamR = lerp(D.lamR[ti], D.lamR[Math.min(ti + 1, T - 1)], f);
      var upT = sample(run, "x", 0, ti, f), upE = sample(run, "x", 1, ti, f);
      var waitUp = Math.max(0, upT + upE - lamO), waitR = Math.max(0, sample(run, "x", 12, ti, f) - lamR);
      var share = upT + upE > 0 ? upT / (upT + upE) : 0.6;
      stack(Math.min(waitUp * share / SCALE, 11), X0 - 6, Y - LANE, "fd-thr");
      stack(Math.min(waitUp * (1 - share) / SCALE, 11), X0 - 6, Y + LANE, "fd-ext");
      qUp.textContent = waitUp >= 4 ? "queue " + Math.round(waitUp) : "";
      var nr = Math.min(waitR / SCALE, 11), mr = Math.ceil(nr - 1e-6);
      for (var k = 0; k < mr; k++) {
        var p = along(RAMP_IN[1], RAMP_IN[0], 0.08 + k * 0.085);
        car(p[0], p[1], p[2] + 180, "fd-thr", k === mr - 1 ? nr - (mr - 1) : 1);
      }
      qRamp.textContent = waitR >= 4 ? "queue " + Math.round(waitR) : "";
      // cars entering from the ramp
      var zr = run.z[12][ti] / SCALE * 1.4, phr = advance("ramp", 1, dt);
      for (k = 0; k < Math.ceil(zr - 1e-6); k++) {
        var s = 0.55 + 0.45 * ((phr + k / zr) % 1), q = along(RAMP_IN[0], RAMP_IN[1], s);
        car(q[0], q[1], q[2], "fd-thr", 1);
      }
      // off-ramp and downstream flows
      var zo = run.z[9][ti] / SCALE * 1.4, pho = advance("off", 1, dt);
      for (k = 0; k < Math.ceil(zo - 1e-6); k++) {
        var o = along(RAMP_OUT[0], RAMP_OUT[1], (pho + k / zo) % 1);
        car(o[0], o[1], o[2], "fd-ext", 1);
      }
      stream(run.z[11][ti] / SCALE * 0.9, advance("down", 1, dt), X0 + 6 * CW + 2, 590, Y - LANE, "fd-thr");

      for (k = used; k < pool.length; k++) pool[k].style.display = "none";

      // controls
      var opt = S.mode === "opt";
      gCtl.style.display = opt ? "" : "none";
      if (opt) {
        plates[0].textContent = Math.round(110 * D.opt.V[0][ti]);
        plates[1].textContent = Math.round(110 * D.opt.V[1][ti]);
        meter.textContent = "ramp meter " + Math.round(100 * D.opt.V[12][ti]) + "%";
      }

      // numbers
      var minutes = 30 + Math.round(tf);
      el.clock.textContent = (6 + Math.floor(minutes / 60)) + ":" + ("0" + (minutes % 60)).slice(-2);
      var cumA = D[S.mode].cum[Math.round(tf)] / 60, other = S.mode === "opt" ? "none" : "opt";
      var cumB = D[other].cum[Math.round(tf)] / 60;
      el.ttt.textContent = Math.round(cumA) + " veh·h";
      var diff = 100 * (D.opt.cum[Math.round(tf)] / D.none.cum[Math.round(tf)] - 1);
      el.cmp.textContent = (S.mode === "opt" ? "· without control " : "· with optimal control ") + Math.round(cumB) +
        (diff <= -0.5 ? " · control saves " + (-diff).toFixed(1) + "%" : "");
    }
    function stack(n, xEnd, y, cls) {
      var m = Math.ceil(n - 1e-6);
      for (var k = 0; k < m; k++) car(xEnd - k * 10, y, 0, cls, k === m - 1 ? n - (m - 1) : 1);
    }

    // ---------------------------------------------------------- interaction
    el.modes.forEach(function (b) {
      b.addEventListener("click", function () {
        S.mode = b.dataset.mode;
        el.modes.forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
        draw(0);
      });
    });

    if (reduce) { S.t = 58; draw(0); return; }
    draw(0);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { S.visible = e[0].isIntersecting; }).observe(root);
    }
    var prev = 0;
    (function loop(now) {
      var dt = prev ? Math.min((now - prev) / 1000, 0.25) : 0;
      prev = now;
      if (S.visible && dt) {
        if (S.t >= D.T) {                       // short pause at the end, then replay
          if ((S.hold += dt) > 2.5) { S.t = 0; S.hold = 0; }
        } else {
          S.t = Math.min(D.T, S.t + SPS * dt);
        }
        draw(dt);
      }
      requestAnimationFrame(loop);
    })(0);
  }
})();
