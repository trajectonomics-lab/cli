# Four layers: ledger, baseline, scenario, projection

Actuals (ledger) are kept apart from derived state (baseline), assumptions (scenario) and results (projection). A projection is a pure function of a baseline and a scenario, so it can be re-run, compared and cached. The simulation must work from a hand-written baseline with no ledger at all; a mapping layer in this repo connects the two, and the cores never import each other.
