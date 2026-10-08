+++
title = "A Convex Formulation of the Multi-Commodity Dynamic Traffic Assignment Problem"
date = 2026-07-01
[params]
category = "journal"
authors = ["D. Sipione", "G. Como", "G. Nilsson"]
venue = "IEEE Control Systems Letters, vol. 10, pp. 1489–1494"
venue_short = "IEEE L-CSS"
note = "Also presented at the 65th IEEE Conference on Decision and Control (CDC 2026)"
featured = true
excerpt = "A tight convex relaxation of multi-commodity dynamic traffic assignment on the Cell Transmission Model, with commodity-dependent speed limits, ramp metering and dynamic routing."
[params.links]
doi = "https://doi.org/10.1109/LCSYS.2026.3708573"
arxiv = "https://arxiv.org/abs/2603.17981"
iris = "https://hdl.handle.net/11583/3013087"
[params.bibtex]
text = '''@article{sipione2026convex,
  author  = {Sipione, Davide and Como, Giacomo and Nilsson, Gustav},
  title   = {A Convex Formulation of the Multi-Commodity Dynamic Traffic Assignment Problem},
  journal = {IEEE Control Systems Letters},
  volume  = {10},
  pages   = {1489--1494},
  year    = {2026},
  doi     = {10.1109/LCSYS.2026.3708573}
}'''
+++

We consider a multi-commodity Dynamic Traffic Assignment (DTA) problem formulated as a network flow control problem on the Cell Transmission Model (CTM). The objective is to design optimal control policies using variable speed limits, ramp metering, and dynamic routing to regulate traffic evolution over time on a given limited-capacity transportation network. Even simple instances of DTA problems on the CTM are known to give rise to non-convex optimal control formulations. Nevertheless, a single-commodity DTA formulation has recently been proposed that admits a tight convex relaxation, enabling tractable optimal control synthesis. The single-commodity formulation, however, is structurally restrictive, as it effectively allows only a single destination. To address this limitation, we develop a multi-commodity CTM model in which each commodity is associated with potentially distinct sets of off-ramps. By extending the convexification approach developed for the single-commodity case, we establish a tight convex relaxation of the multi-commodity DTA problem on the CTM model. This relaxation relies on concave, commodity-specific demand functions and concave aggregate supply functions for every cell, which ensure convexity of the resulting optimal control problem. Our proposed formulation requires commodity-dependent implementation of variable speed limits and dynamic routing policies.
