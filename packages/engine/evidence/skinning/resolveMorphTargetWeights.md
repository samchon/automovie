# src/skinning/resolveMorphTargetWeights.ts#resolveMorphTargetWeights

## @evidence contracts/development/implementation.md#principled-implementation

One clinical angle through a driven-key curve, the single-input form of pose-space deformation; the angle is read from the authored pose because a driver names a clinical axis, the same quantity the pose stores, and evaluateDrivenCurve throws on a malformed curve that admission would have refused.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The engine owns the arithmetic and the viewer only writes the returned weights, so a measurement and the render resolve correctives identically; curve evaluation is the clip driver's existing owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No bone, axis or name is special-cased, the weight is not clamped to hide an authored overdrive, and an undriven target gets no invented weight.

## @evidence contracts/development/common.md#meaningful-documentation

States the angle source and unit, the neutral and duplicate readings, the curve evaluation, that weights are unclamped and that undriven targets are omitted.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(J + T P) for J pose joints, T targets and P curve points: one map of the joints, then one lookup and one curve evaluation per driven target.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The joint map is built once per call and shared by every target; poses change every frame, so nothing is cached across calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the joint map is local and the returned map, one entry per driven target, belongs to the caller.
