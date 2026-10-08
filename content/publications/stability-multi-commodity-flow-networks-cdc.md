+++
title = "On the Stability of Dynamical Multi-Commodity Flow Networks"
date = 2025-12-09
[params]
category = "conference"
authors = ["D. Sipione", "G. Como"]
venue = "64th IEEE Conference on Decision and Control (CDC), Rio de Janeiro, pp. 224–229"
venue_short = "IEEE CDC 2025"
note = "Extended journal version in preparation for IEEE Transactions on Automatic Control"
featured = true
excerpt = "A (typically convex) capacity region guaranteeing a unique, locally asymptotically stable free-flow equilibrium for multi-commodity traffic, with an estimate of its basin of attraction."
[params.links]
doi = "https://doi.org/10.1109/CDC57313.2025.11312216"
arxiv = "https://arxiv.org/abs/2508.17804"
iris = "https://hdl.handle.net/11583/3008707"
[params.bibtex]
text = '''@inproceedings{sipione2025stability,
  author    = {Sipione, Davide and Como, Giacomo},
  title     = {On the Stability of Dynamical Multi-Commodity Flow Networks},
  booktitle = {2025 IEEE 64th Conference on Decision and Control (CDC)},
  pages     = {224--229},
  year      = {2025},
  doi       = {10.1109/CDC57313.2025.11312216}
}'''
+++

We study a class of dynamical multi-commodity flows in transportation networks. These are modeled as dynamical systems describing the evolution of the densities of a number of different commodities across the cells of a transportation network. Each cell is characterized by commodity-specific increasing demand functions returning the maximum outflow of each commodity from the cell as a function of the current density of that commodity, as well as a decreasing supply function returning the total maximum inflow that is allowed in the cell as a function of the current aggregate density in the cell. Every commodity is characterized by a different routing matrix, whose entries describe the turning ratios between adjacent cells. We identify a (typically convex) capacity region: for exogenous inflow vectors belonging to that region, we prove the existence of a locally asymptotically stable free-flow equilibrium point. Building on a contraction argument, we also provide an estimate of the basin of attraction of such free-flow equilibrium point. Finally, we analyze a simple special case showing that, when the exogenous inflow vector does not belong to the region of stability, non-free flow equilibrium points might arise.
