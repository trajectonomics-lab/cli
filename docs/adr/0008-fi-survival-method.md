# FI is defined by `survival`, with a closed set of methods

The FI date is the earliest month at which, if earned income stopped, the deterministic projection never runs out before the horizon. Four rules: (1) only earned streams stop and passive streams continue; (2) post-FI spending equals planned expenses, with an optional retirement spending override; (3) the balance never goes below zero until the horizon, with an optional minimum buffer in months; (4) accounts with a lock-until-age count only once unlocked.

`method` is a closed enum, so other methods are added later as new values. The 25× rule is shown as a reference figure only, not as the answer.
