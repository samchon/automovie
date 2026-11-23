# src/sport/athletics.ts#athletics.set

## @evidence contracts/development/common.md#meaningful-documentation

States the geometry and the result.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates the four-contact, measured-angle and centre-of-mass problem to sprintStartSet.of and the shared whole-body fit.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One delegate with the unchanged public inputs and result.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A fit that misses its declared constraints is reported by the solver's refusal, never hidden by moving a foot or altering a joint range.

## @evidence contracts/development/implementation.md#efficient-algorithms

The numerical cost and iteration guard are the shared whole-body fit's; no nested bisection remains.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the placed arm's wrist, pitch and root, and the foot's pivot.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/sport/athletics.ts#athletics.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the plan and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The set position solved once; the root, the feet and the hands carried into it on one phrase.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Set, clock, root row, two leg rows, two arm rows.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every place is the body's; provisional times are named.

## @evidence contracts/development/implementation.md#efficient-algorithms

One posture solve per arm per second.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The rear foot's fixed block/recovery pair prepares its quaternion arc once, and each step into a block reads the shared foot swing; fixed standing/set hip points share Vector3.prepareLerp's original component deltas. Trunk pitch/flexion differences and the joint reader also prepare once, while current joints/shares/points evaluate each second. Placed-arm and posture-heading formulas remain shared owners.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan closes over the set position and the clock.
