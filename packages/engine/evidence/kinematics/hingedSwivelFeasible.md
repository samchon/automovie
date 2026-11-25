# src/kinematics/hingedSwivelFeasible.ts#hingedSwivelFeasible

## @evidence contracts/development/common.md#meaningful-documentation

States what the feasible swivels are, why every legal swivel lies in them, where they still hold refused ones and the result's form.

## @evidence contracts/development/implementation.md#principled-implementation

Each root limit maps to intervals of the swivel and the feasible swivels are their intersection (Tolani, Goswami and Badler 2000, section 3.2.3), taken as the complement of the certain refusals: a box's where either chart admits, a swing-twist gate's directly.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The refused arcs, their complement, and for a box the union of the two charts' complements.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Closed form but for the swing cone's one-degree pieces; the caller's own score still decides legality inside an interval.

## @evidence contracts/development/implementation.md#efficient-algorithms

The refused arcs' cost and two linear passes over a few arcs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads `boxRefusedArcs` and `swingTwistRefusedArcs`, the arcs the sweep's refusal reads.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh list and retains nothing.