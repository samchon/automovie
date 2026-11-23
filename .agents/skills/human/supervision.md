# Supervision

Subagents carry out the main implementation and assigned verification. The main agent researches, plans, delegates and performs the ten-minute inspections, personally checking code, measurements and renders. Worker reports alone do not establish acceptance.

## Before dispatch

- [ ] Personally complete the [required research](SKILL.md#the-skills-are-binding): skills, existing engine/interface capabilities, previous attempts and primary literature.
- [ ] Group the complete inspection's findings by cause. Decide coupled curves, measurements, frames, connections, rails, cutters and bindings together. A changed dependency reopens the plan.
- [ ] Assign one writer per file/tool in the [same checkout](workspace.md#ignored-paths). Resume existing workers unless the user orders replacement or termination.
- [ ] Brief each worker with governing sections/issue, measured cause/scope, chosen method/basis, expected result/checks, execution owner, evidence paths and report deadline. Name superseded instructions.

## Every ten minutes

While supervised Human work is active, inspect at the start and at fixed ten-minute deadlines, including during tests and renders. Record the next deadline before each inspection ends. Keep the supervisor active: an alarm is not an inspection.

For every active worker, mark each item pass, fail or unobserved, with evidence and an action.

- [ ] **Time:** record scheduled, actual and next times, including missed deadlines. Never backfill an inspection.
- [ ] **Work:** read worker state, changed-file diff, latest save and new outputs. Verify scope, source version and ownership; preserve existing dirty work.
- [ ] **Processes:** confirm the [single watch](testing.md#running) covers saved code. Check job progress/resources; prevent duplicate compilers, competing viewers and abandoned task-owned processes.
- [ ] **Pictures:** personally open relevant frames against the reference, both sides and neighbours, using the [three passes](screenshot.md#the-three-passes). Without new frames, open an unread pair or arrange capture; unseen stages remain unobserved.
- [ ] **Claims:** read numbers/failures from files. Match each cause to the fired diagnostic path and failing/passing controls. Distinguish curves, lofts, bands and skin.
- [ ] **Rules:** check changed code and actions against governing skills. Stop violations immediately; identify the rule, evidence and correction.
- [ ] **Stalls:** research the unresolved cause yourself before another variant. Update the coupled plan. Parameter changes and more instrumentation alone are not research; implement once evidence supports the plan.
- [ ] **Checks:** read test/CI results at exact revisions. Separate current failures, demonstrated baseline failures and unavailable coverage. Check proposed commits against the delivery gate.
- [ ] **Direction:** give each worker acceptance/rejection, next work, checks and deadline. Tell the user what changed, what you inspected and what remains blocked, measured against the issue's goal.

Keep one compact inspection record containing those times, evidence paths, findings and orders. Reuse unchanged evidence by recorded version.

## The cycle

If late, inspect immediately, record the gap and retain the next fixed deadline. If unable to supervise, stop workers rather than leave them unattended. On a user stop, stop workers and alarms; preserve work and evidence.

## Stop conditions

Stop these before further work:

- An inferred cause, an unresearched variant or separate fixes for one shared cause: return to the complete cause table and [repair order](construction.md#repair).
- A band/rail/net/relief hiding a curve defect or an unplanned neighbour rebuild: repair the owning definition and its dependents together.
- A capability without an independent failing test, or a correct method reverted for a dependent's failure: establish the missing evidence.
- Conflicting writers, stale/text-merged generated files, another checkout or ignored executable logic: restore [workspace](workspace.md) and [development](../development/SKILL.md#scripts-and-shared-checkouts) ownership.
- Execution before watch/pre-checks pass, or a commit with failed checks, missing whole-figure evidence or regression: hold that execution or commit.

## Before delivery

- [ ] Retain an accepted whole-figure capture/deviation round at an identified source revision.
- [ ] Before committing a changed construction, compare the complete changed tree's same round across every region. Fix all regressions together; only a gated round becomes the baseline.
- [ ] Verify delivery-revision checks. Separate verified results, unavailable checks and unresolved defects; compilation, connectedness and capture completion do not accept anatomy.
