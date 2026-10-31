# Explicit output format, JSON error envelope, fixed exit codes, no prompts

Output is human-readable by default; `--json` or `TRAJ_FORMAT=json` selects JSON, and the format is never inferred from a TTY, so an agent's pipe and a human's terminal cannot differ by accident. Commands never prompt. Errors are a JSON envelope on stderr, with exit codes 0 ok, 1 unexpected, 2 invalid input, 3 domain rejection, 4 not found, 5 conflict. `traj schema` is generated from the same definitions that validate input, so the two cannot drift.
