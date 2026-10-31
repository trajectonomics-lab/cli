# Explicit output format, JSON error envelope, fixed exit codes, no prompts

Output is human-readable by default. `--json` or `EXCITED_FORMAT=json` selects JSON; the format is never inferred from whether stdout is a TTY, because an agent's pipe and a human's terminal must not behave differently by accident. Commands never prompt.

Errors are a JSON envelope on stderr. Exit codes: 0 ok, 1 unexpected, 2 invalid input, 3 domain rejection, 4 not found, 5 conflict. `excited schema [command]` is generated from single-source Zod definitions, so types, validation, schema output and error codes cannot drift apart.
