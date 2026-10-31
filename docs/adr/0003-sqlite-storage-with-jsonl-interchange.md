# One SQLite file, with canonical JSONL as interchange

Data lives in a single SQLite file (`bun:sqlite`). Canonical, sorted JSONL export/import is the backup, interchange and future sync format. A plain-file store (YAML or JSON) was rejected because the data is transaction-based, queried by date and account, and must later be pushed to a server.

Rows are sync-ready from day one: client-generated UUIDv7 ids, `version`, `created_at`/`updated_at`, and tombstones. The JSONL format is owned by this application and lives in this repo, not in `ledger-core`.
