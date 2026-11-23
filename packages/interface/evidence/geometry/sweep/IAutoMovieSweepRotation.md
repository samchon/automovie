# src/geometry/sweep/IAutoMovieSweepRotation.ts#IAutoMovieSweepRotation.IMultiplyOut

## @evidence contracts/development/common.md#meaningful-documentation

Four writable slots at the supplied scalar offset receive the dimensionless quaternion in x/y/z/w order for Hamilton product a*b, applying b first. The output is not normalized automatically; capacity and any unit-quaternion requirement belong to the caller.

## @evidence contracts/development/design.md#principled-representation

Four writable slots at the supplied scalar offset receive the dimensionless quaternion in x/y/z/w order for Hamilton product a*b, applying b first.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieSweepRotation.multiply writes caller storage after reading both operands, permitting output/input aliasing.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The output is not normalized automatically; capacity and any unit-quaternion requirement belong to the caller.

# src/geometry/sweep/IAutoMovieSweepRotation.ts#IAutoMovieSweepRotation.INormalizeQ

## @evidence contracts/development/common.md#meaningful-documentation

Four writable x/y/z/w slots at the supplied offset are both quaternion input and normalized dimensionless output. Zero norm becomes identity by the quaternion convention; this storage shape does not prevent nonfinite components or insufficient capacity.

## @evidence contracts/development/design.md#principled-representation

Four writable x/y/z/w slots at the supplied offset are both quaternion input and normalized dimensionless output.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieSweepRotation.normalize updates this caller-owned storage in place and retains no buffer.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Zero norm becomes identity by the quaternion convention; this storage shape does not prevent nonfinite components or insufficient capacity.

# src/geometry/sweep/IAutoMovieSweepRotation.ts#IAutoMovieSweepRotation.IConjugateOut

## @evidence contracts/development/common.md#meaningful-documentation

Four writable x/y/z/w slots at the output offset receive a dimensionless unit quaternion's conjugate. Conjugation is an inverse only for unit input; the storage type neither normalizes nor admits that premise.

## @evidence contracts/development/design.md#principled-representation

Four writable x/y/z/w slots at the output offset receive a dimensionless unit quaternion's conjugate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieSweepRotation.conjugate reads its quaternion before writing, permitting shared input/output storage.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Conjugation is an inverse only for unit input; the storage type neither normalizes nor admits that premise.

# src/geometry/sweep/IAutoMovieSweepRotation.ts#IAutoMovieSweepRotation.IFromBasisOut

## @evidence contracts/development/common.md#meaningful-documentation

Four writable x/y/z/w slots receive the normalized quaternion mapping +X,+Y,+Z to the supplied basis columns. The input basis must be orthonormal; output normalization does not establish that premise or validate buffer capacity.

## @evidence contracts/development/design.md#principled-representation

Four writable x/y/z/w slots receive the normalized quaternion mapping +X,+Y,+Z to the supplied basis columns.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieSweepRotation.fromBasis converts existing frame storage into this caller-owned output without retaining it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The input basis must be orthonormal; output normalization does not establish that premise or validate buffer capacity.

# src/geometry/sweep/IAutoMovieSweepRotation.ts#IAutoMovieSweepRotation.IRotateOut

## @evidence contracts/development/common.md#meaningful-documentation

Three writable XYZ slots at the output offset receive a rotated vector in its original length unit. The quaternion must be unit length; the storage interface does not encode finite inputs, frame compatibility or available capacity.

## @evidence contracts/development/design.md#principled-representation

Three writable XYZ slots at the output offset receive a rotated vector in its original length unit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieSweepRotation.rotate reads the vector before writing, so caller storage can be rotated in place.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The quaternion must be unit length; the storage interface does not encode finite inputs, frame compatibility or available capacity.

# src/geometry/sweep/IAutoMovieSweepRotation.ts#IAutoMovieSweepRotation.ISlerpOut

## @evidence contracts/development/common.md#meaningful-documentation

Four writable dimensionless x/y/z/w slots receive shortest-arc interpolation at the caller's dimensionless t. The kernel assumes unit operands and does not clamp t; capacity and interpolation-domain admission remain with callers.

## @evidence contracts/development/design.md#principled-representation

Four writable dimensionless x/y/z/w slots receive shortest-arc interpolation at the caller's dimensionless t.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieSweepRotation.slerp reads both operands before writing and uses the shared near-parallel normalization convention.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The kernel assumes unit operands and does not clamp t; capacity and interpolation-domain admission remain with callers.
