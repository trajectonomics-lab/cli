# Double-entry ledger with a simple surface

Single-entry was considered first and rejected: treating a side project as a business-like unit (paying a freelancer, paying an owner salary as an expense) needs both sides of every movement. The ledger is double-entry, but commands expose a simple `--from/--to` surface.

Transactions are immutable and corrected by `void` and `amend`, which append; there is no hard delete. `project` is a dimension on postings. `entity` is reserved in the schema (a single seeded personal entity) but not exposed. Currency is on every posting and only THB is accepted in v1.
