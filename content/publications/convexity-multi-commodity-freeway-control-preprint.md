+++
title = "On Convexity of Optimal Multi-Commodity Freeway Network Control"
date = 2025-12-22
[params]
category = "preprint"
authors = ["D. Sipione", "G. Como", "G. Nilsson"]
venue = "arXiv preprint arXiv:2512.19827"
venue_short = "arXiv"
excerpt = "Ramp metering and class-specific variable speed limits on freeways: a tight convex relaxation of the multi-commodity problem, validated on a California freeway with PeMS data."
[params.links]
arxiv = "https://arxiv.org/abs/2512.19827"
[params.bibtex]
text = '''@misc{sipione2025convexity,
  author        = {Sipione, Davide and Como, Giacomo and Nilsson, Gustav},
  title         = {On Convexity of Optimal Multi-Commodity Freeway Network Control},
  year          = {2025},
  eprint        = {2512.19827},
  archivePrefix = {arXiv},
  primaryClass  = {math.OC}
}'''
+++

Freeway Network Control uses ramp metering and variable speed limits to reduce congestion. Straightforward formulations based on the Cell Transmission Model are non-convex, mainly because of congestion at diverge junctions. This paper extends the tight convex relaxation known for the single-commodity case to multiple vehicle classes, using concave commodity-specific demand functions and a concave aggregate supply function, so that different speed limits can be applied to different commodities and the optimal control can be computed efficiently. The approach is validated on a freeway segment in California calibrated with PeMS data, and compared with a model that treats all traffic as a single commodity, showing why acting separately on different vehicle classes matters.
