# The `.wiki/` knowledge base

`.wiki/` is gitignored, written in Korean and local to a checkout. At session start, read the current progress pointer and the worklog instructions that govern the requested task, then follow only the relevant topic and evidence links. If they are absent, start from the public issue and tracked source and create the needed working record. Local history is not an implementation prerequisite or a substitute for public acceptance evidence.

Create directories only when the task needs them: `00-governance` (operating manual), `01-progress` (current pointer and next priorities), `02-overview` (product), `03-philosophy` (harness principles), `04-domain-research` (external study), `05-references` (related projects), `06-architecture` (design), `07-decisions` (append-only decisions), `08-campaigns` (campaign evidence), `99-worklog` (dated instructions and work). No directory inventory or reading ledger must be filled merely because the layout names it.

- Record a design choice in `07-decisions/` the moment it is made. The log is append-only, and a later entry supersedes an earlier one.
- Record each user instruction in `99-worklog/` as a dated entry with its status (implemented, in progress, open). Keep a superseded instruction beside the one that replaces it.
- Keep the current pointer short and link to the owning public issue, current source revision and relevant local evidence. Mark historical conclusions with their revision and replacement; preserve raw observations and rejected alternatives. Record a persistent correction immediately without duplicating the same public state across several summaries.
- Update `01-progress/README.md` whenever a package or capability lands.
- Keep `06-architecture/` matching the code. A design doc precedes or accompanies a change to the rig or engine model.
- Separate confirmed fact (with file paths) from inference, and cite external sources by URL. References and domain study are evidence, not authority, so do not transplant them verbatim.
