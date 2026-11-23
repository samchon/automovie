# src/posture/HumanArmTrajectoryClear.ts#HumanArmTrajectoryClear.IDetour

## @evidence contracts/development/common.md#meaningful-documentation

States both members and their units.

## @evidence contracts/development/design.md#principled-representation

The path's share the bump is whole at, and each arm's coordinate change there.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Made by `detour`, read by the laid course through `bump`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Coordinates in the model's own units, one entry per arm of the problem.

# src/posture/HumanArmTrajectoryClear.ts#HumanArmTrajectoryClear.detour

## @evidence contracts/development/common.md#meaningful-documentation

States what is read, what is returned and when nothing is.

## @evidence contracts/development/implementation.md#principled-implementation

The waypoint with the deepest pair past the admission's slack (`T.SKIN`), or the inner end of the interval whose swept sphere lies deepest past its bound (its row the shape's normal at that end, as the convex subproblem's sweep row reads it); at it every pair within the tolerance of its bound linearised along its normal on the arm's point Jacobian (a probe's own, a body corner carried by the arm's segment the other way), and the least-norm change meeting each at its bound by an active set on the normal equations.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The deepest waypoint, its rows, the least-norm change.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only the model's pairs and normals are read; a change that cannot be found (no row moves) is no detour.

## @evidence contracts/development/implementation.md#efficient-algorithms

One scan of the reading's pairs over the transport, one Jacobian reading, and a normal-equation solve of at most the waypoint's pairs in the arm's free coordinates.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The reading is the caller's, read here once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh record and retains nothing.

# src/posture/HumanArmTrajectoryClear.ts#HumanArmTrajectoryClear.bump

## @evidence contracts/development/common.md#meaningful-documentation

States the weight's values at the ends and the peak and its shape.

## @evidence contracts/development/implementation.md#principled-implementation

The cubic ease of each side's share has zero slope at both of its ends.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One side's share, one cubic.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A share outside [0, 1] weighs nothing.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
