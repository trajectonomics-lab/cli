# excited

A command line for managing personal resources, money first. It records what actually happened, derives a starting point from it, and projects the future under stated assumptions.

## Language

### Layers

**Ledger**:
The append-only record of what actually happened to money: accounts, transactions, and their postings.
_Avoid_: Books, history, journal

**Baseline**:
The starting state of a projection, derived from the ledger or written by hand: current balances, income and spending run-rates.
_Avoid_: Snapshot, current state, inputs

**Scenario**:
A named set of assumptions about the future, such as economy, accounts, streams, events, cash flow rules, and the FI goal.
_Avoid_: Plan, forecast, model

**Projection**:
The result of running a baseline through a scenario. It is a pure function of the two; the same inputs always give the same projection.
_Avoid_: Simulation, forecast, run

### Ledger

**Account**:
A named place where value sits or comes from, such as a bank account, an expense category, or an equity account.
_Avoid_: Wallet, category

**Transaction**:
One balanced, immutable event in the ledger, made of two or more postings.
_Avoid_: Entry, record, payment

**Posting**:
A single signed amount against one account, carrying its currency and optional dimensions. Postings in a transaction balance to zero per entity and currency.
_Avoid_: Line, leg, split

**Void**:
Correcting a transaction by appending a reversing transaction. Nothing is ever deleted.
_Avoid_: Delete, cancel, remove

**Amend**:
Correcting a transaction by voiding it and adding a replacement, linked to the original.
_Avoid_: Edit, update

**Dimension**:
A tag on a posting that slices reports without changing its balance. `project` is the dimension in use.
_Avoid_: Tag, label

**Project**:
A dimension that groups postings belonging to a side venture, so it can be reported as a business-like unit.
_Avoid_: Business, company

**Entity**:
A legally separate party whose books balance on their own. Reserved for the future; there is one personal entity today.
_Avoid_: Company, tenant

### Scenario

**Stream**:
A recurring flow of money in a scenario. An earned stream stops when earning stops; a passive stream continues.
_Avoid_: Income source, cash flow item

**Event**:
A dated one-off change in a scenario, such as a purchase or a windfall.
_Avoid_: Milestone, life event

**Contribution**:
Money moved from cash flow into an investment or retirement account. It is not an expense, so net worth does not change at that instant.
_Avoid_: Investment expense, savings

**As-of**:
The date a baseline or projection is evaluated at. Every result states it.
_Avoid_: Today, now, snapshot date

### Financial independence

**FI**:
Financial independence: the state where the portfolio and passive income can fund the planned life without earned income.
_Avoid_: FIRE, retirement

**Survival**:
The FI method that finds the earliest month at which, if earned income stopped, the projection never runs out of money before the horizon.
_Avoid_: Safe withdrawal, 25× rule

**Horizon**:
The age at which a projection ends.
_Avoid_: End date, lifespan

### Packages

**Core**:
A separate, pure package (`ledger-core`, `sim-core`, `tax-core`) that holds real-world logic and knows nothing about this application.
_Avoid_: Engine, library, plugin

**Minor unit**:
The smallest indivisible part of a currency, such as the satang for the baht. All money is held in minor units.
_Avoid_: Cents, decimal amount
