+++
title = "Research"
[params]
eyebrow = "What I work on"
+++

Transportation networks are shared by heterogeneous users: cars and trucks, human drivers and connected autonomous vehicles, travellers with different origins and destinations. My research develops mathematical tools, from **dynamical systems**, **convex optimization** and **game theory**, to understand how such heterogeneous traffic evolves and to design controls and incentives that make it efficient.

## Stability of multi-commodity flow networks

I model traffic as a **dynamical multi-commodity flow network**, a multi-class extension of the Cell Transmission Model in which every commodity has its own demand function and routing, while all commodities compete for a shared supply. I characterize a (typically convex) **stability region** of exogenous inflows: inside it, there is a unique free-flow equilibrium, and it is locally asymptotically stable. Exploiting **monotonicity** and **ℓ₁-nonexpansiveness** of the dynamics, I estimate its basin of attraction; outside the region, congested equilibria appear and the choice of the allocation rule (FIFO or non-FIFO) starts to matter.

<p class="refs">→ <a href="/publications/stability-multi-commodity-flow-networks-cdc/">CDC 2025</a> · extended version in preparation for IEEE TAC</p>

## Convex optimal control of traffic

Optimal traffic control on the Cell Transmission Model is notoriously **non-convex**. I showed that the **multi-commodity Dynamic Traffic Assignment** problem, with variable speed limits, ramp metering and dynamic routing, admits an **exact convex relaxation** when the controls can depend on the commodity: optimal policies can then be computed with off-the-shelf convex solvers, and Pontryagin's maximum principle gives insight into their structure. Building on this, I study freeway control with **speed limits that must stay fixed over time** (as on digital signs) and the benefit of **connected autonomous vehicles** that can adjust their speed continuously, on a calibrated Los Angeles freeway network.

<p class="refs">→ <a href="/publications/convex-multi-commodity-dta-lcss/">IEEE L-CSS 2026</a> · <a href="/publications/convexity-multi-commodity-freeway-control-preprint/">arXiv 2025</a> · <a href="/publications/fixed-time-vsl-ramp-meters-cavs-itsc/">ITSC 2026</a> · a discrete-time version with a realistic case study is in preparation</p>

## Tolls for noisy congestion games

When drivers choose routes with some randomness, as modelled by **logit dynamics**, classical marginal-cost tolls are no longer optimal. With Shinkyu Park (KAUST), I proposed an **iterative and distributed tolling scheme** that, for every noise level and for large populations, brings the expected total travel time arbitrarily close to the system optimum. The analysis combines large-deviation estimates of the invariant distribution with an **entropic proximal-point** view of the toll updates.

<p class="refs">→ <a href="/publications/noise-robust-tolls-cphs/">IFAC CPHS 2026</a> · full paper in preparation</p>

## Collaborators

- Giacomo Como, Politecnico di Torino and Lund University
- Fabio Fagnani, Politecnico di Torino
- Gustav Nilsson, Inria Grenoble / GIPSA-lab
- Leonardo Cianfanelli, Politecnico di Torino
- Shinkyu Park, KAUST
