# The CLI is a deterministic tool for agents and never calls an LLM

The primary users are AI agents, which supply the judgment; the CLI supplies exact, repeatable computation. It never calls a model, so every result is reproducible and testable. Agent-facing skills live in a separate repo (`excited-live/skills`), and this repo's `AGENTS.md` is for development only.
