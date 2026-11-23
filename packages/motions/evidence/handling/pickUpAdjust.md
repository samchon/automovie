# src/handling/pickUpAdjust.ts#pickUpAdjust.turned

## @evidence contracts/development/common.md#meaningful-documentation

States what turns, how far and why.

## @evidence contracts/development/implementation.md#principled-implementation

The trunk's twist split between the chest and the spine as the trunk's turn splits it, bounded by both joints' axial ranges with the twist they already hold; the turn is searched a degree at a time for the least that reaches.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The bounds, one search, one closure.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A table without the trunk's twist is refused, never read as no limit.

## @evidence contracts/development/implementation.md#efficient-algorithms

Retains every original shoulder read per degree; one genuine fixed-name reader and exact FK workspace share unchanged prerequisites across the actual angle probes. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Body/side fix only raw shoulder demand. Each twist/posture and distance still evaluates in original order; runtime at/lower preserve actual stance callbacks and their current metadata arguments.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned stance owns its original source/turn and static name metadata only. The planning FK getter is explicitly cleared before return, so no dynamic workspace, probe pose or distance history enters runtime state.

# src/handling/pickUpAdjust.ts#pickUpAdjust.stepped

## @evidence contracts/development/common.md#meaningful-documentation

States which foot steps, where, how far, when and the limit.

## @evidence contracts/development/implementation.md#principled-implementation

One foot's planted goal moved along the floor toward the wrist, the root half as far, the shoulder read on the moved body; the step is solved for the least length that reaches, and the foot chosen from the target's side where the data settle it and from the shorter step where they do not.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The direction, the feet to try, one solve per foot, one closure.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A step beyond `STEP` is never taken; the caller refuses instead. No angle decides a midline target's foot.

## @evidence contracts/development/implementation.md#efficient-algorithms

The flat shoulder path intersects the reach spheres directly. A planted-leg lowering that changes the feasible interval uses a bounded scalar search without any FK in the trials.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The endpoint shoulder and planted hip are read once since each step trial translates them rigidly by the root's displacement. Runtime reads the current planted hip where the carrier can change.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned stance retains the fixed body/builders and step geometry. Candidate positions and numerical observations are confined to planning.

# src/handling/pickUpAdjust.ts#pickUpAdjust.plants

## @evidence contracts/development/common.md#meaningful-documentation

States each window and how the shares map to seconds.

## @evidence contracts/development/implementation.md#principled-implementation

The stance's share of the way is minimum-jerk in time, so the second of a share is its inverse, found by bisection.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One window per foot that stands, three for one that steps.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A foot that never steps keeps its entry's contact throughout: planted on the frame it bears on, or unplanted when it hangs; no foot is declared on a surface it does not touch.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A few bisections per plan.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns new windows and retains nothing.
