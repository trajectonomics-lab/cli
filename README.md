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

Create `src/commands/<name>.ts` with `defineCommand`: a summary, an input schema,
an output schema, examples, the error codes it raises, and a `run` that returns
`ok(data)` or `fail(code)`. Register it in `commands` in `src/cli.ts`. A new
failure is a new entry in the registry in `src/errors.ts` with its exit class.
Commands never format output or exit; `traj schema` describes them from the same
schemas that validate them. Test through `run(argv, io, env)` in
`src/cli.test.ts`, which needs no process.
