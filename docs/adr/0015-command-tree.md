# Commands form a tree, flags come from the input schema, and registration is explicit

Commands are a tree of **groups** (`tx`) and **leaves** (`tx add`). A group has only a name, a summary and children; a leaf has the input schema, output schema and `run`. The dispatcher consumes words down the tree while the current node is a group; once it reaches a leaf, every remaining token is that leaf's own arguments, so `traj tx add --amount 5 cash` never mistakes `cash` for a subcommand. A bare group prints its usage and exits 0; a missing child is `unknown_command` naming the whole path (`tx nope`).

A leaf's flags are derived from its zod input schema: every field that is not a declared positional is a flag, named in kebab-case (`fromDate` is `--from-date`). Supported field types are string, number, boolean and arrays of those; anything else, a name colliding with `--json`, `--help` or `--version`, or a positional that is not a field fails when the command is defined, so the mistake surfaces at load, not at first use. The last positional may be an array and takes all remaining words (`traj schema tx add`). Strictness is per leaf: a flag the leaf does not declare is `unknown_flag`.

Usage text (`traj <path> --help`, `traj help <path>`) and `traj schema <path>` are both built from the same definitions, so what is accepted, what is documented and what is described cannot drift. The tree is registered explicitly in `src/commands/index.ts`, with one file per leaf and one folder per group.

## Considered options

Registering `"tx add"` as a literal name in a flat table was rejected: groups could not print their own usage, and nothing would stop `tx add` and `tx` from colliding. A hand-written `flags` list next to the schema was rejected because it is a second source of truth that drifts. Auto-discovering command files with a glob was rejected: it is hostile to `bun build --compile` and makes listing order depend on the filesystem, which breaks the determinism rule.

## Consequences

Flags must follow the command path: `traj --amount 5 tx add` reads `5` as a subcommand. Global boolean flags may appear anywhere. A test fails if a file under `src/commands/` exports a leaf that the tree does not reach.

Deferred, not decided here: a lazy database handle on the command context (waits for the schema in #5), and rendering hints for table-shaped results (waits for the first such command).
