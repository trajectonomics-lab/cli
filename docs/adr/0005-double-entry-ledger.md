# Double-entry ledger, implemented in `ledger-core`, with a simple surface

Single-entry was rejected: treating a side project as a business-like unit (paying a freelancer, paying an owner salary as an expense) needs both sides of every movement. Commands still expose a simple `--from/--to` surface. Transactions are immutable and corrected by `void` and `amend`, never deleted; `project` is a dimension on postings; `entity` is reserved but not exposed; and only THB is accepted in v1.
