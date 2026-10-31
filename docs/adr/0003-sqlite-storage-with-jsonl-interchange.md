# One SQLite file, with canonical JSONL as interchange

Data lives in a single SQLite file (`bun:sqlite`), with canonical sorted JSONL as the backup, interchange and future sync format. A plain YAML or JSON file was rejected because the data is transaction-based and must later be pushed to a server. Rows are sync-ready from day one (client-generated UUIDv7 ids, `version`, timestamps, tombstones), and the JSONL format is owned by this repo, not by `ledger-core`.
