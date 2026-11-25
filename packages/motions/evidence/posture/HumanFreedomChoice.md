# src/posture/HumanFreedomChoice.ts#HumanFreedomChoice.turns

## @evidence contracts/development/common.md#meaningful-documentation

States the order, why it depends on the hand, the unit, the range and the refused step.

## @evidence contracts/development/implementation.md#principled-implementation

The mirror image of a rotation is the opposite rotation about the mirrored axis, so a mirrored list is the negated one. The k-th turn is k times the step for k up to floor(180 / step), a count fixed before the loop: a sum of steps stops growing once a step falls under half an ulp of it, and a zero, negative or not-a-number step never reaches the half turn, so each is refused at once instead of listing without end.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One admission and one counted loop.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The half turn is its own mirror and is listed once; no step is clamped into a usable one.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work per turn.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One owner of the order for the grasp, wear and dress choosers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh list and retains nothing.

# src/posture/HumanFreedomChoice.ts#HumanFreedomChoice.chosen

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the result and the failure.

## @evidence contracts/development/implementation.md#principled-implementation

The tried values in order, the first under `EXACT` ending the search and a later one winning only by more than it; then the pattern search (Hooke and Jeeves 1961): each freedom is stepped either way by `REFINE` of its step, a step that lessens the miss is kept, and the steps halve when none does. A fitted miss has many local least points, so while none holds exactly the search restarts from each other tried value, least missed first, refined from half its step since its neighbours a step away were tried, unless a finished search ended within half a step of it (multistart local search, Marti 2003, Handbook of Metaheuristics), the least of all ends taken. A bounded value is clamped, a wrapped one taken into its period's half-open range about zero, so the search crosses a round handle's seam.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The tried values, then one pattern search per start, all judged by one lazy worst-of.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is moved outside the freedoms; a candidate's misses are read only until their worst reaches its search's best less `EXACT`, past which it cannot be taken there. The first start is the least missed tried value, so a choice its search makes is the single search's; a start whose tried value was read short of its worst orders by that lower bound.

## @evidence contracts/development/implementation.md#efficient-algorithms

The tried values are judged lazily and stop at the first exact hold; all starts together judge at most `FITS` candidates, the single search's budget, each read only as far as it can still win, and a start within half a step of a finished search's end is skipped.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per plan and pose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
