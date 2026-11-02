# trajectonomics

The trajectonomics command line. Bun only.

```bash
bun install
bun run dev -- --help     # run from source
bun test
bun run build             # single-file binary at dist/traj
bun run lint              # Biome, zero warnings
bun run format            # Biome format + import order, writes files
bun run check             # lint + typecheck + test + build, what CI runs
```

## Docs

- [`GLOSSARY.md`](GLOSSARY.md): the project's vocabulary.
- [`docs/adr/`](docs/adr/): design decisions and why.
- [`ROADMAP.md`](ROADMAP.md): phases and recorded next steps.

## Adding a command

Create `src/commands/<name>.ts` (or `src/commands/<group>/<name>.ts` for a
nested one) with `defineCommand`: a summary, an input schema, an output schema,
examples, the error codes it raises, and a `run` that returns `ok(data)` or
`fail(code)`. Register it in `src/commands/index.ts`, inside a `defineGroup` if
it is nested. Fields of the input schema that are not positionals become flags
automatically (`fromDate` is `--from-date`). A new failure is a new entry in the
registry in `src/errors.ts` with its exit class. Commands never format output or
exit; `traj help <path>` and `traj schema <path>` are generated from the same
schemas that validate them. Test through `run(argv, io, env)`, which needs no
process. See ADR 0015.
