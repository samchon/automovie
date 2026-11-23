# src/perform/HumanWater.ts#HumanWater.stroke

## @evidence contracts/development/common.md#meaningful-documentation

States the coordinate system, initial conditions, sample inputs, duration scaling and returned state.

## @evidence contracts/development/implementation.md#principled-implementation

Samples collider-equivalent centres and unit-flow drag through the existing segment model, then integrates the heading projection of the sum of quadratic drag under common translation plus each segment's local velocity.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepares uniformly timed centres and local derivatives before running one scalar trajectory.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The stroke's keyed poses supply the local movement and the medium supplies the force. Only heading translation is free; no preset thrust or cruise speed is applied.

## @evidence contracts/development/implementation.md#efficient-algorithms

Uses one skeleton per phase sample and one volume per segment. Integration stages interpolate the cached samples without recalculating poses or volumes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The integration uses the same centre transform, drag primitive and trajectory integrator as the passive operations.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Sampled centres and coefficients are local to planning. The returned trajectory retains only its own knots.
