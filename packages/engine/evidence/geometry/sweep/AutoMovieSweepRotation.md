# src/geometry/sweep/AutoMovieSweepRotation.ts#AutoMovieSweepRotation.multiply

## @evidence contracts/development/implementation.md#principled-implementation

The Hamilton product.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reads all eight components before writing four.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The result is not renormalized; callers that need a unit result say so.

## @evidence contracts/development/common.md#meaningful-documentation

States the order of application.

## @evidence contracts/development/implementation.md#efficient-algorithms

Sixteen products, no allocation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure operation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/geometry/sweep/AutoMovieSweepRotation.ts#AutoMovieSweepRotation.normalize

## @evidence contracts/development/implementation.md#principled-implementation

Division by the Euclidean norm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

In place, the only use posing has.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A zero input takes the identity, as `Quaternion.normalize` does, rather than producing NaN.

## @evidence contracts/development/common.md#meaningful-documentation

States the zero case.

## @evidence contracts/development/implementation.md#efficient-algorithms

One square root, no allocation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure operation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/geometry/sweep/AutoMovieSweepRotation.ts#AutoMovieSweepRotation.conjugate

## @evidence contracts/development/implementation.md#principled-implementation

The conjugate inverts a unit quaternion.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Callers hold unit quaternions, so no division is needed.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only valid for unit input, which every caller normalizes first.

## @evidence contracts/development/common.md#meaningful-documentation

States the unit premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four assignments.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure operation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/geometry/sweep/AutoMovieSweepRotation.ts#AutoMovieSweepRotation.fromBasis

## @evidence contracts/development/implementation.md#principled-implementation

The trace-branch conversion of a rotation matrix, choosing the largest diagonal term for stability, as `quaternionFromAutoMovieBasis` does.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The columns are read from one array at three offsets, the layout of a written frame.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The result is normalized, absorbing rounding in the basis.

## @evidence contracts/development/common.md#meaningful-documentation

States the mapping.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time, no allocation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure operation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/geometry/sweep/AutoMovieSweepRotation.ts#AutoMovieSweepRotation.rotate

## @evidence contracts/development/implementation.md#principled-implementation `v + 2w (q x v) + 2 q x (q x v)`, the formula `Quaternion.rotateVector` uses.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reads the vector before writing, so it may rotate in place.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Assumes a unit quaternion, as every caller supplies.

## @evidence contracts/development/common.md#meaningful-documentation

States the formula.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fifteen products, no allocation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure operation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/geometry/sweep/AutoMovieSweepRotation.ts#AutoMovieSweepRotation.slerp

## @evidence contracts/development/implementation.md#principled-implementation

Shoemake's slerp, with `b` negated when `a . b < 0` and normalized linear interpolation above the shared near-parallel threshold, as `Quaternion.slerp`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reads both inputs before writing.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The threshold is the shared constant.

## @evidence contracts/development/common.md#meaningful-documentation

States the arc and the threshold.

## @evidence contracts/development/implementation.md#efficient-algorithms

One arccosine and three sines at most, no allocation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure operation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
