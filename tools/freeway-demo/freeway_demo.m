% Freeway demo for the website: multi-commodity CTM, no control vs the
% optimum of the convex relaxation (VSL + ramp metering), as in
% Sipione-Como-Nilsson (L-CSS 2026, arXiv:2512.19827). Writes freeway-demo.json
% next to this file: copy it to assets/data/ (scenario used on the site:
% P = struct("Q",10,"peakEnd",60,"exitShare",0.4,"lamPeak",14,"rampPeak",5,"T",145)).
%
% Mainline cells M1..M6, an origin buffer O0 upstream of M1, an on-ramp
% queue R merging into M2, an off-ramp after M4 and a lane drop at the end
% of M6. Commodities: through traffic (to the end) and exiting traffic
% (to the off-ramp). Units: vehicles, time steps.

if ~exist("P", "var"), P = struct("Q", 10, "peakEnd", 60, "exitShare", 0.4, "lamPeak", 14, "rampPeak", 5, "T", 145); end

% ---- states: [cell, commodity]  (cell 0 = origin, 7 = ramp; commodity 1 = through, 2 = exit)
cellOf = [0 0 1 1 2 2 3 3 4 4 5 6 7];
comOf  = [1 2 1 2 1 2 1 2 1 2 1 1 1];
succ   = [3 4 5 6 7 8 9 10 11 0 12 0 5];   % 0 = leaves the network
K = numel(cellOf);

% ---- parameters
v = 1;  C = 20;  w = 0.5;  cbar = 30;  Q = P.Q;    % free speed, capacity, wave speed, supply intercept, lane drop
T = P.T;  peak = 6:P.peakEnd;                       % horizon and morning peak (steps)
lamO = 6 * ones(1, T);  lamO(peak) = P.lamPeak;      % mainline arrivals
lamR = 2 * ones(1, T);  lamR(peak) = P.rampPeak;     % on-ramp arrivals (through only)
exitShare = P.exitShare;
lam = zeros(K, T);
lam(1, :) = (1 - exitShare) * lamO;  lam(2, :) = exitShare * lamO;  lam(13, :) = lamR;

% initial free-flow equilibrium of the off-peak demand
x0 = [3.6 2.4 3.6 2.4 5.6 2.4 5.6 2.4 5.6 2.4 5.6 5.6 2]';

% ================================================================ no control
[Xn, Zn] = simulate(x0, lam, ones(K, T), ones(1, T), cellOf, succ, v, C, w, cbar, Q, T);

% ================================================================ convex relaxation (LP)
nX = K * (T + 1);  nZ = K * T;  N = nX + nZ;
ix = @(k, t) k + (t - 1) * K;            % t = 1..T+1
iz = @(k, t) nX + k + (t - 1) * K;       % t = 1..T

Aeq = sparse(K * T + K, N);  beq = zeros(K * T + K, 1);  r = 0;
for t = 1:T
  for k = 1:K
    r = r + 1;
    Aeq(r, ix(k, t + 1)) = 1;  Aeq(r, ix(k, t)) = -1;  Aeq(r, iz(k, t)) = 1;
    for kk = find(succ == k), Aeq(r, iz(kk, t)) = -1; end
    beq(r) = lam(k, t);
  end
end
for k = 1:K, r = r + 1; Aeq(r, ix(k, 1)) = 1; beq(r) = x0(k); end

rows = {};  rhs = [];
for t = 1:T
  for k = 1:K                                   % demand: z <= v x
    a = sparse(1, N); a(iz(k, t)) = 1; a(ix(k, t)) = -v; rows{end + 1} = a; rhs(end + 1) = 0;
  end
  for j = 1:6
    ks = find(cellOf == j);                      % sending capacity of cell j
    a = sparse(1, N); a(iz(ks, t)) = 1; rows{end + 1} = a; rhs(end + 1) = C - (j == 6) * (C - Q);
    kin = find(ismember(succ, ks));              % inflow into cell j
    a = sparse(1, N); a(iz(kin, t)) = 1; rows{end + 1} = a; rhs(end + 1) = C;
    a = sparse(1, N); a(iz(kin, t)) = 1; a(ix(ks, t)) = w; rows{end + 1} = a; rhs(end + 1) = cbar;
  end
end
A = vertcat(rows{:});  b = rhs(:);
% tie-break among optimal solutions: vehicles wait in the origin and ramp
% queues rather than on the mainline (does not change the optimal TTT)
main = repmat(cellOf(:) >= 1 & cellOf(:) <= 6, T + 1, 1);
f = [ones(nX, 1) + 1e-4 * main; zeros(nZ, 1)];
opts = optimoptions('linprog', 'Display', 'none', 'Algorithm', 'dual-simplex');
[sol, ~, flag] = linprog(f, A, b, Aeq, beq, zeros(N, 1), [], opts);
ttt = sum(sol(1:nX));
fprintf('linprog exit flag %d\n', flag);
Xo = reshape(sol(1:nX), K, T + 1);  Zo = reshape(sol(nX + 1:end), K, T);

% ---- recovered controls: speed per cell and commodity, ramp meter
V = ones(K, T);
for t = 1:T
  for k = 1:K
    if Xo(k, t) > 1e-9, V(k, t) = min(1, Zo(k, t) / (v * Xo(k, t))); end
  end
end
U = V(13, :);
[Xc, Zc] = simulate(x0, lam, V, U, cellOf, succ, v, C, w, cbar, Q, T);

fprintf('TTT no control      %.1f\n', sum(Xn(:)));
fprintf('TTT relaxation (LP) %.1f\n', ttt);
fprintf('TTT controlled sim  %.1f   (max |x - x_LP| = %.2e)\n', sum(Xc(:)), max(abs(Xc(:) - Xo(:))));
fprintf('exit flow lost to blocking, no control: peak off-ramp flow %.2f vs demand %.2f\n', ...
  max(Zn(10, :)), exitShare * 14);

% ---- export
W = T - 15;                     % drop the end-of-horizon steps from the animation
out.T = W;  out.peak = [peak(1) peak(end)];  out.cellOf = cellOf;  out.comOf = comOf;
out.C = C;  out.w = w;  out.cbar = cbar;  out.Q = Q;
out.none = pack(Xn(:, 1:W + 1), Zn(:, 1:W));  out.opt = pack(Xc(:, 1:W + 1), Zc(:, 1:W));
out.opt.V = round(V(:, 1:W), 3);
out.lamO = lamO(1:W);  out.lamR = lamR(1:W);
fid = fopen(fullfile(fileparts(mfilename('fullpath')), 'freeway-demo.json'), 'w');
fprintf(fid, '%s', jsonencode(out));  fclose(fid);
disp('wrote freeway-demo.json');

% ================================================================ helpers
function s = pack(X, Z)
  s.x = round(X, 2);  s.z = round(Z, 3);
  s.ttt = round(sum(X(:)), 1);  s.cum = round(cumsum(sum(X, 1)), 1);
end

function [X, Z] = simulate(x0, lam, V, U, cellOf, succ, v, C, w, cbar, Q, T)
% multi-commodity CTM with FIFO (proportional) allocation; V = speed
% fraction per state, U = ramp meter (applied to the ramp state 13)
  K = numel(x0);  X = zeros(K, T + 1);  Z = zeros(K, T);  X(:, 1) = x0;
  for t = 1:T
    x = X(:, t);
    D = v * V(:, t) .* x;  D(13) = U(t) * v * x(13);
    for j = 1:6                                     % sending capacity (FIFO within the cell)
      ks = cellOf == j;  cap = C - (j == 6) * (C - Q);
      if sum(D(ks)) > cap, D(ks) = D(ks) * cap / sum(D(ks)); end
    end
    rj = ones(1, 7);                                % receiving ratio of each mainline cell
    for j = 1:6
      ks = find(cellOf == j);  kin = ismember(succ, ks);
      S = min(C, max(cbar - w * sum(x(ks)), 0));
      if sum(D(kin)) > S, rj(j) = S / sum(D(kin)); end
    end
    alpha = ones(1, 8);                             % FIFO factor of each sending cell (0..7)
    for k = 1:K
      if succ(k) > 0 && D(k) > 0
        c = cellOf(k);  jdst = cellOf(succ(k));
        alpha(c + 1) = min(alpha(c + 1), rj(jdst));
      end
    end
    Z(:, t) = alpha(cellOf + 1)' .* D;
    inflow = zeros(K, 1);
    for k = 1:K, if succ(k) > 0, inflow(succ(k)) = inflow(succ(k)) + Z(k, t); end, end
    X(:, t + 1) = x + lam(:, t) + inflow - Z(:, t);
  end
end
