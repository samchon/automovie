# Supervision

When workers build Human under a supervisor, the supervisor's work is briefing, verifying and steering. A worker's message is a pointer to evidence, never the evidence: approvals given to unmeasured causes and unopened frames have cost whole days.

## Briefs

A worker knows only its brief, so the brief carries everything:

1. **What to read.** AGENTS.md, this skill's files, the 3d-modeling lofting page, the governing issue, and the code files to start from. The worker rereads the governing section before each decision.
2. **The rules.** The skills bind the worker as they bind the supervisor ([The skills are binding](SKILL.md#the-skills-are-binding)). Quote the sections the task turns on, such as the [connection operators](construction.md#connections) and the [repair order](construction.md#repair).
3. **The mission.** Ordered steps, each with its verification: a test proved red then green, numbers saved to files, frames written for the supervisor to open.
4. **Reporting.** A report time, file paths for every number and frame, and a measured cause for every refusal.

Self-review every brief against the skills and against every earlier brief it supersedes, and name the superseded parts. A worker that wanders was given an incomplete brief.

Dispatch by cause, not by region. Group every inventory row by its measured cause before any order. A cause shared by rows in several modules is one item: one capability fixes it, and every row it causes takes that fix in the same round, each module through its own writer. A row with a shared cause waits for that item; a region fix for it is the whack-a-mole the owner forbids.

Resume a worker with a message; never replace it, including when it cites its context, because a replacement loses everything the worker measured. Give each generated module, and each shared tool, one writer.

## The Cycle

Run this cycle every ten minutes while any worker runs, and schedule the next one before the cycle ends.

1. **State.** For each worker, read its last commits, its uncommitted files and its newest outputs. Confirm that the main checkout is clean, since a dirty one means a worker wrote a relative path.
2. **Renders.** Open the newest frames yourself, beside the reference, on both sides, as [Verification](verification.md#seeing-before-believing) requires. With no new frame, open the latest one not yet read, or render the region yourself, and send what you opened to the owner. Accept no shape from numbers alone.
3. **Claims.** Read every number in its output file. Check every cause against the code that produced the diagnostic: list that function's failure paths and confirm which one fired. A cause without its failing and passing measurements is not accepted.
4. **Skills.** Check the worker's latest diff and actions against the skills. Stop each of these at once, naming it:
   - a fix on an inferred cause;
   - a second variant of the same idea without a newly measured cause;
   - a band, net or relief tuned to hide a line, wall or connection defect, against the [repair order](construction.md#repair);
   - a capability without a test proved red first;
   - a revert of a right direction because a dependent broke;
   - a generated module re-emitted from an old state, two writers on one module, or a text merge of a generated module;
   - a new capability written into a shared tool instead of a new file;
   - a commit of an unverified or red state;
   - an emit or round started before its pre-checks were read;
   - a region's fix widened into rebuilding a working part, such as a family's layout, which is a planned item of its own;
   - one row worked alone, or deferred alone, when its measured cause is shared with rows elsewhere;
   - work in another clone or worktree.
5. **Research.** When a worker has failed one item three times, or spent two cycles without a measured cause, research it yourself in that cycle. Reread the governing skill sections, read the engine and interface code at the operator (the capabilities it already has first), read the record, and search the practice: character modeling and topology, rigging and skinning, surface anatomy, and the method's literature. Then give the decision and its basis. A sequence of single-cause rulings on one item is the trial loop this step replaces.
6. **Order.** Send one message per worker: what is accepted and that you saw it, what is rejected and why, the next steps, the checks before any round, and the report time. Reject a method only for a measured cause under [Repair](construction.md#repair), never for a failed run. Relay between workers yourself.
7. **Checks.** Read the pull request's checks, and compare every failing job with the same job on the main branch before calling it the main branch's.
8. **Report.** Tell the owner in a few lines what each worker did, what you saw, what you stopped, and what blocks the merge. Send the frames behind every claim.
