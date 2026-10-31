# Core logic lives in separate repos that know nothing about this application

`ledger-core`, `sim-core` and `tax-core` are separate repos so they contain only real-world logic, one agent session can work on pure math while another works on the CLI, and a future web app, desktop app or MCP server can reuse them. Keeping them in this repo first would have been faster, but would have let application concerns leak in. They are closed-world and pure: no plugin hooks, no I/O, no clock, no ID generation. Consumers translate custom logic into the canonical models.
