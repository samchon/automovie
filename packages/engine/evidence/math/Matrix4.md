# src/math/Matrix4.ts#Matrix4.identity

## @evidence contracts/development/implementation.md#principled-implementation

The sixteen entries of the 4×4 identity, ones on the diagonal, which is the same array in either storage order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A function rather than a shared constant, because `multiply` and callers that fill a matrix in place must never alias one global array.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Returns the exact identity for every call with no cached or caller-specific value.

## @evidence contracts/development/common.md#meaningful-documentation

States that each call returns a new array, which is the fact a caller that mutates the result needs.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One sixteen-element array literal with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A fresh array is the contract, so sharing one would be wrong rather than cheaper.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The sixteen identity entries are freshly allocated for the caller; no shared mutable matrix is retained.

# src/math/Matrix4.ts#Matrix4.compose

## @evidence contracts/development/implementation.md#principled-implementation

Each basis column is the rotation matrix column of the unit quaternion, from the standard expansion `1 - 2(y² + z²)`, `2(xy + wz)` and so on, multiplied by that axis's scale, with the translation in the fourth column; the doubled components `x2`, `y2`, `z2` are the `three.js` factoring, kept so results match the viewer exactly.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Builds the composed matrix directly instead of multiplying three separate matrices, which is both the `three.js` arithmetic the viewer must match and the only composition order the engine uses.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The quaternion is not normalized here; validators admit only near-unit rotations, and a silent normalization would make the engine differ from the viewer for the same transform.

## @evidence contracts/development/common.md#meaningful-documentation

States the order the parts apply in, the bit-for-bit agreement with `three.js`, the unit-rotation premise and what breaks without it, how a zero scale behaves, and each parameter's role.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A fixed set of twelve products and the scaled basis, in constant time with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one transform that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Doubled quaternion components remain scalar locals, and the sixteen composed coefficients transfer to the caller without retaining the translation or scale records.

# src/math/Matrix4.ts#Matrix4.multiply

## @evidence contracts/development/implementation.md#principled-implementation

The matrix product sums `a(row, k) · b(k, col)` through column-major indices for every row and column, including the fourth row; finite sixteen-entry operands are the caller premise, and large products may overflow binary64.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One general product shared by hierarchy composition, world drivers, springs and placement code, returning a new array so no caller's matrix is overwritten.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every entry is summed in the same `k` order for every matrix; no identity or affine input takes a shortcut that would change rounding between callers.

## @evidence contracts/development/common.md#meaningful-documentation

States which operand applies first, the storage order of both inputs, and that the result is new with inputs unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time: 64 multiply-adds into one preallocated sixteen-element array, the direct product for a fixed 4×4 size where no faster method applies.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of two matrices that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

One sixteen-entry product array accumulates the sums and becomes caller-owned; neither operand is retained or overwritten.

# src/math/Matrix4.ts#Matrix4.position

## @evidence contracts/development/implementation.md#principled-implementation

The image of the local origin `(0, 0, 0, 1)` under an affine column-major matrix is its fourth column, elements 12 to 14, so reading them is exact with no arithmetic.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One named read for the translation column, which resolve, placement and drawing code use instead of indexing elements 12 to 14 themselves.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads the same three elements for every matrix; a projective fourth row is outside the affine matrices this namespace builds and is not compensated.

## @evidence contracts/development/common.md#meaningful-documentation

States what the column means for a world matrix and which elements are read.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Three array reads with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The extracted origin owns its three copied translation values and keeps no reference to the matrix array.

# src/math/Matrix4.ts#Matrix4.transformPoint

## @evidence contracts/development/implementation.md#principled-implementation

The column-major product of the upper three rows with the homogeneous point `(x, y, z, 1)`, which is the full transform for the affine matrices `compose` and `multiply` produce; it assumes that affinity and states it rather than dividing by a fourth coordinate that is always one.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Sits beside `compose` and `multiply` in the matrix namespace, so callers that compose a matrix also map points through it here instead of each keeping a private copy of the same twelve products.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No matrix or caller is special-cased; the dropped fourth row is the stated affine premise, not a compensation.

## @evidence contracts/development/common.md#meaningful-documentation

States the formula, the affine premise and why no divide happens, that a direction must not use it, the storage order, and each parameter's space.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Nine multiplications and nine additions in constant time, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure map of one point that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates the returned point only and retains nothing.

# src/math/Matrix4.ts#Matrix4.decompose

## @evidence contracts/development/implementation.md#principled-implementation

Scale is each basis column's `Math.hypot` length and the rotation is read from the scale-normalized basis by Shepperd's largest-diagonal extraction, in the exact arithmetic of `three.js` `Matrix4.decompose`; the premise is an orthonormal right-handed basis after normalization, which positive-scale validation guarantees for unsheared transforms, and a zero-length column is replaced by its orthonormal completion so the extraction still receives a rotation matrix.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The completion runs only when a column has zero length, so every other matrix takes exactly the `three.js` arithmetic; the extraction stays inline rather than calling `quaternionFromAutoMovieBasis`, whose normalization and different factoring would change results the viewer must match.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A collapsed axis is completed from the surviving columns rather than divided by a floored length, because a floored divisor leaves a non-unit rotation that distorts the surviving axes when composed again; a tiny nonzero scale is divided by its own length, and mirrored or sheared input is stated as unsupported rather than adjusted.

## @evidence contracts/development/common.md#meaningful-documentation

States the inverse relation to `compose`, which pass relies on it, the nonnegative-scale premise and why it holds, the mirrored and sheared limitation, how a collapsed axis is completed, and the round-trip and finiteness guarantees.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time: three column lengths, nine divisions, one branch of the quaternion extraction, and for a collapsed matrix at most one cross product or one shortest-arc rotation of two axes.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one matrix that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates the three basis vectors and the returned record and retains nothing.
