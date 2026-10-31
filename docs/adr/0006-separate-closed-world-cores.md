# Core logic lives in separate repos that know nothing about this application

`ledger-core`, `sim-core` and `tax-core` are separate repos and packages. Keeping them apart forces them to contain only real-world logic, lets one agent session work on pure math while another works on the CLI, and keeps them reusable by a future web app, desktop app or MCP server. Putting them in this repo first would have been faster, but would have let application concerns leak in.

The cores are closed-world: no callbacks or plugin hooks. Consumers translate custom logic into the canonical models. They are pure (no I/O, no clock, no ID generation, no unseeded randomness). `sim-core` may depend only on `@excited-live/tax`; `ledger-core` and `sim-core` never import each other. Tax math is imported from `tax-core`, never reimplemented here.
