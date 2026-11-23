# src/kinematics/swingTwistExcludedSwivels.ts#swingTwistExcludedSwivels

## @evidence contracts/development/common.md#meaningful-documentation

States the premise on the rotation, why the twist's and the swing's bounds are sinusoids of the swivel, the margin and why every refusal is certain, and every case that refuses nothing.

## @evidence contracts/development/implementation.md#principled-implementation

A quaternion turned about a fixed axis is a first harmonic of the half angle, so a product of two of its linear readings is a sinusoid of the swivel; the twist interval maps to rig degrees as `swingTwistRange.read` lifts them, and the swing is bounded by the region's greatest radius, which every great circle's radius is at most.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The refused arcs are built once (`swingTwistRefusedArcs`) and the test reads their union.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Sound by construction, never by sampling: an arc is refused only from its sinusoid's roots with the joints' tolerance to spare, and a case the analysis does not cover refuses nothing.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three rotations fit both sinusoids, at most two arcs are merged once, and each test is a scan of the few merged intervals (`swivelArcs.covers`).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The fit, the arcs, their union and its test are `swivelArcs`'s, the rig interval `toRigAngle`'s, the rest direction the range frame's own basis (`SwingTwistFramePreparation.basis`) and the greatest radius `swingTwistRegion.greatest`, kept with the region's table, shared with `swingTwistRange`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains the merged arc list in the returned test only.
