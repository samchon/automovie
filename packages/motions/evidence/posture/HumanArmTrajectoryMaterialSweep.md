# src/posture/HumanArmTrajectoryMaterialSweep.ts#HumanArmTrajectoryMaterialSweep

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the candidate chord between two neighbouring read waypoints, the actual native event and the row admitted by both.

## @evidence contracts/development/implementation.md#principled-implementation

Uses signed relative-chord geometry to select the second, then reconstructs the actual articulated hand and obstacle at that second.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The endpoint readings nominate material parts, each part supplies its deepest chord, and its native pose decides whether it contributes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fixed interior timestamp, body kind or action name participates in selection.

## @evidence contracts/development/implementation.md#efficient-algorithms

Only free intervals and the named own support participate; endpoint margin, relative displacement and enclosing bounds screen corners before exact shape queries.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the existing waypoint pairs and placed arms, the native Hermite interpolator, the authored base reader and the existing convex row formulation; the chord's nearest-point reading that places the encounter rides on the returned sweep, so the convex row reads no shape again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Per-call part candidates and temporary geometry are released after returning the selected rows.
