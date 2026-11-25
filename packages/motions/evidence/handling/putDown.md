# src/handling/putDown.ts#putDown.demands

## @evidence contracts/development/common.md#meaningful-documentation

States which placements constrain a prior grasp (a socket placement, and a free one at an authored resting attitude through `putDownRestingDemand`) and whose pose and tolerance are used.

## @evidence contracts/development/implementation.md#principled-implementation

The destination prop frame P and prop-in-grip offset O require the grip frame P O^-1; the same source-socket contact and held-tool bound as the placing plan judge it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Filter the grip and tracked destinations, read the fixed destination, undo its rigid offset and declare one demand.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No object kind is named; a free world placement with no authored attitude keeps its existing freedom.

## @evidence contracts/development/implementation.md#efficient-algorithms

One destination lookup and constant rigid-frame work per candidate grasp; the body pose is supplied lazily and this prop-socket branch never acquires its formerly unused full posture solve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The plan and demand share putDownTarget and the held-tool goal and measure owners.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one immutable demand and retains nothing.
