+++
title = "Joint Control of Fixed-Time Variable Speed Limits, Ramp Meters, and CAVs in Freeway Networks Through a Relaxed Convex Optimization Approach"
date = 2026-09-15
[params]
category = "conference"
authors = ["D. Sipione", "G. Nilsson", "G. Como"]
venue = "29th IEEE International Conference on Intelligent Transportation Systems (ITSC), Naples"
venue_short = "IEEE ITSC 2026"
featured = false
excerpt = "A heuristic built on an exact convex relaxation to set speed limits that must stay fixed over time, and a study of how connected autonomous vehicles improve freeway performance."
[params.bibtex]
text = '''@inproceedings{sipione2026joint,
  author    = {Sipione, Davide and Nilsson, Gustav and Como, Giacomo},
  title     = {Joint Control of Fixed-Time Variable Speed Limits, Ramp Meters, and {CAVs}
               in Freeway Networks Through a Relaxed Convex Optimization Approach},
  booktitle = {2026 IEEE 29th International Conference on Intelligent Transportation Systems (ITSC)},
  year      = {2026}
}'''
+++

With the increasing demands in transportation networks, Freeway Network Control (FNC), where the traffic flow is controlled through Variable Speed Limits (VSLs) and ramp meters, has emerged as a viable solution to ease congestion and improve efficiency. While recent research has shown that it is possible to determine those control actions through an exact convex relaxation approach in a Model Predictive Control (MPC) framework, it is done under the assumption that the VSLs can be updated continuously in time, something that lacks practical feasibility when the speed limits are given by digital signs. In this work, we present a heuristic algorithm based on this convex relaxation approach to determine the VSLs when they must be fixed for a given duration. Furthermore, we investigate, in a multi-commodity setting, how various penetration rates of Connected Autonomous Vehicles (CAVs), which instead continuously adjust their speed, can improve system performance. The algorithm's feasibility is validated in a realistic simulation scenario of a highway network in Los Angeles, CA. The numerical results suggest that the heuristic algorithm causes a relatively small performance loss compared to the theoretically optimal solution when VSLs are continuously updated. Moreover, CAVs can slightly improve the overall performance.
