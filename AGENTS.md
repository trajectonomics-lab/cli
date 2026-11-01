# AGENTS.md

Instructions for AI coding agents in `trajectonomics-lab/cli`.

## Rules

1. Never commit to `main`. Branch (`feat/*`, `fix/*`, `docs/*`) and open a PR.
2. Never commit secrets or `.env` files.
3. Bun only: `bun install`, `bun test`, `bun run <script>`, Bun APIs over Node polyfills where Bun has one. No npm/pnpm/yarn lockfiles.
4. Keep the CLI deterministic: same input, same output. No hidden state outside what a command documents.
5. Tax math lives in `@excited-live/tax` (repo `trajectonomics-lab/tax-core`). Import it; never copy or reimplement tax rules here.
6. Commands return exit codes through `run()`; only `src/index.ts` calls `process.exit`.
7. Done means `bun run check` passes (Biome lint with zero warnings, strict typecheck, tests, compiled build). `bun run format` fixes formatting and import order. Do not loosen `tsconfig.json` or `biome.json` to make an error go away. The one exception: vendored skill files (`.claude/`, `skills-lock.json`) are excluded from Biome, because `bun run update:skills` owns them.

## Agent skills

### Issue tracker

GitHub Issues in `trajectonomics-lab/cli`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical role names: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Installing and updating skills

Skills come from [`mattpocock/skills`](https://github.com/mattpocock/skills) and [`trajectonomics-lab/internal-skills`](https://github.com/trajectonomics-lab/internal-skills) via the Vercel [`skills`](https://github.com/vercel-labs/skills) CLI and are pinned in `skills-lock.json`. The canonical copy is `.agents/skills/` (read natively by Codex, OpenCode, Pi, and Antigravity CLI); `.claude/skills/` holds symlinks into it for Claude Code. Never edit them by hand.

- Update: `npx skills update -p -y`
- Reinstall: `npx skills add mattpocock/skills --skill '*' -a claude-code codex opencode antigravity-cli pi -y`
- Restore from the lock: `npx skills experimental_install`, then recreate the Claude Code symlinks with the reinstall command above. The lock does not record target agents, so restore writes `.agents/skills/` only and leaves `.claude/skills/` empty.
