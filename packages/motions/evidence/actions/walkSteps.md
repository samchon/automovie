# src/actions/walkSteps.ts#walkSteps.plan

## @evidence contracts/development/common.md#meaningful-documentation

The namespace defines measured footprint geometry, timing and turning; input members name their body/path/time units and the returned plan exposes root/foot/phase readers.

## @evidence contracts/development/implementation.md#principled-implementation `WalkPace` timing and the flight stance (`runStance`), the footprint, turn and ankle-lean rules the namespace states, the closing pair, and the shared gait root (`walkRoot`) and stance (`walkStepFoot`) owners; an opening or closing stance's rockers take their shares of the cruising stance, two periods less a swing.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Fixed path/body geometry precedes timing, requested/bounded footprint headings, step records, per-side schedules and the unconstrained root.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every step, corner, timing draw, bound, opening turn and endpoint is kept; the context's period law is called for the period, and the arrival is the closing foot's loading response (`walkRoot.LOADING`, Perry and Burnfield) or a raised heel's settling, whichever is later.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation scales with authored footfalls and the path/timing searches. Path segments and rest-foot widths prepare once; each side's hip width is read on its first nonclosing footprint, then reused across later footprints.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One take fixes its measured rest body, private floor path and step timing; fixed scalar geometry is shared without sharing a later queried posture or resampling a numerical result.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Construction-local width/heading work releases on return or throw; the plan owns its step/path/schedule/root geometry, linear in footfalls and corners, without an arbitrary-time pose history or external handle.
