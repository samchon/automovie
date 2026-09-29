# The `.wiki/` knowledge base

`.wiki/` is gitignored, written in Korean and local to a checkout. It starts empty. Read what it holds at session start, create what it lacks, and revise it as the work proceeds instead of at the end.

Layout, created on demand: `00-governance` (operating manual, reading ledger), `01-progress` (current state, next priorities), `02-overview` (product), `03-philosophy` (the two harness articles and principles), `04-domain-research` (external study), `05-references` (agentica, autobe, interia), `06-architecture` (monorepo and per-package design), `07-decisions` (append-only decision log), `08-campaigns` (issue-campaign knowledge bases), `99-worklog` (dated logs).

- Record a design choice in `07-decisions/` the moment it is made. The log is append-only, and a later entry supersedes an earlier one.
- Record each user instruction in `99-worklog/` as a dated entry with its status (implemented, in progress, open). Keep a superseded instruction beside the one that replaces it.
- Update `01-progress/README.md` whenever a package or capability lands.
- Keep `06-architecture/` matching the code. A design doc precedes or accompanies a change to the rig or engine model.
- Separate confirmed fact (with file paths) from inference, and cite external sources by URL. References and domain study are evidence, not authority, so do not transplant them verbatim.
