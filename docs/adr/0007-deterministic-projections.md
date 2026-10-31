# Deterministic projections first; Monte Carlo later and seeded

Version 1 projects with a single deterministic path. Monte Carlo comes later, always seeded (`--seed`), and the design reserves seams for it. Every result echoes `as_of`, engine version, scenario hash and applied overrides, so a result can be reproduced and an agent can tell what it was computed from.
