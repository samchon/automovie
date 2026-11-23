# src/motion/MotionTrajectoryRotation.ts#MotionTrajectoryRotation.curve

## @evidence contracts/development/common.md#meaningful-documentation

Coefficients and result are body-frame radians; u is the dimensionless step share.

## @evidence contracts/development/implementation.md#principled-implementation

Applies the shared scalar continuous-extension polynomial to all three components.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scalar evaluation per component.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Four coefficients retain the original quartic arithmetic; five select the paired quintic, with no replacement grid.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work and one output vector.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Construction, defect admission and playback share this same numeric curve.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh vector and retains no input.

# src/motion/MotionTrajectoryRotation.ts#MotionTrajectoryRotation.curveDerivative

## @evidence contracts/development/common.md#meaningful-documentation

h is seconds and the output is a rotation-vector derivative in radians per second, not yet body angular velocity.

## @evidence contracts/development/implementation.md#principled-implementation

Analytically differentiates the scalar polynomial and divides by h. Applying Jr(curve) converts this coordinate derivative to actual body angular velocity.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scalar derivative per component.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No finite-difference time or sampled frame enters the derivative.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work and one vector.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses curve's exact same coefficients and the shared polynomial derivative.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh vector without retaining coefficients.

# src/motion/MotionTrajectoryRotation.ts#MotionTrajectoryRotation.turn

## @evidence contracts/development/common.md#meaningful-documentation

The quaternion is unit and the vector is in body-frame radians.

## @evidence contracts/development/implementation.md#principled-implementation

Right multiplication by the axis-angle exponential preserves the body-frame convention used by both steppers.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Handle absent or zero rotation, then apply the quaternion product.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The angle remains in radians for the half-angle trigonometry, with no small-angle clamp or overflowing conversion to degrees.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the engine's quaternion operations.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no state.

# src/motion/MotionTrajectoryRotation.ts#MotionTrajectoryRotation.scaled

## @evidence contracts/development/common.md#meaningful-documentation

Returns s times v, or undefined for an absent block.

## @evidence contracts/development/implementation.md#principled-implementation

Componentwise scalar multiplication.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One conditional expression.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No component is clamped or replaced.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure arithmetic operation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no state.

# src/motion/MotionTrajectoryRotation.ts#MotionTrajectoryRotation.dexpinv

## @evidence contracts/development/common.md#meaningful-documentation

r is a body-frame rotation in radians, w a body-frame angular rate in radians per second; an absent block stays absent.

## @evidence contracts/development/implementation.md#principled-implementation

The stated truncated inverse differential is the RKMK construction shared by fixed RK4 and adaptive DP5(4).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Compute the first and second cross products as scalar components, then their weighted sum.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the existing Bernoulli coefficients and body-frame signs.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work with one output record and no intermediate vector records; the two cross products' scalar arithmetic retains Vector3.cross's association.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The three components of r cross w are reused by the second cross and final sum, without constructing two temporary vector records.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no state.
