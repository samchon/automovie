# src/geometry/IAutoMovieSweepRotation.ts#IAutoMovieSweepRotation.IMultiplyOut

## @evidence contracts/development/common.md#meaningful-documentation

Caller-owned four-component quaternion product destination beginning at a scalar offset.

## @evidence contracts/development/design.md#principled-representation

Hamilton multiplication reads the two x, y, z, w tuples before writing the product. The right factor applies first.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only writable slots are required, so the kernel can reuse typed buffers and caller-managed offsets.

# src/geometry/IAutoMovieSweepRotation.ts#IAutoMovieSweepRotation.INormalizeQ

## @evidence contracts/development/common.md#meaningful-documentation

Writable four-component quaternion storage normalized in place at the supplied offset.

## @evidence contracts/development/design.md#principled-representation

The kernel divides by quaternion norm and uses identity for zero norm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

In-place storage keeps the quaternion's owner and offset with the caller.

# src/geometry/IAutoMovieSweepRotation.ts#IAutoMovieSweepRotation.IConjugateOut

## @evidence contracts/development/common.md#meaningful-documentation

Caller-owned x, y, z, w destination for a unit quaternion conjugate.

## @evidence contracts/development/design.md#principled-representation

Conjugation negates the vector components and retains the scalar component. Input and output may share storage.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The operation writes one quaternion in the caller's chosen buffer layout.

# src/geometry/IAutoMovieSweepRotation.ts#IAutoMovieSweepRotation.IFromBasisOut

## @evidence contracts/development/common.md#meaningful-documentation

Caller-owned four-component rotation destination for an orthonormal right-handed basis.

## @evidence contracts/development/design.md#principled-representation

The basis conversion reads the axes as rotated coordinate basis vectors and normalizes the resulting quaternion.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The destination owns four adjacent scalar slots. The caller owns axis admission and the buffer offset.

# src/geometry/IAutoMovieSweepRotation.ts#IAutoMovieSweepRotation.IRotateOut

## @evidence contracts/development/common.md#meaningful-documentation

Caller-owned three-component XYZ destination for one quaternion-rotated vector.

## @evidence contracts/development/design.md#principled-representation

The kernel applies a unit quaternion to the vector and retains its coordinate unit. Input and output may share storage.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only a writable numeric slice is required, so the vector shares the surrounding packed representation.

# src/geometry/IAutoMovieSweepRotation.ts#IAutoMovieSweepRotation.ISlerpOut

## @evidence contracts/development/common.md#meaningful-documentation

Caller-owned four-component destination for shortest-arc quaternion interpolation.

## @evidence contracts/development/design.md#principled-representation

The interpolation chooses the equivalent quaternion sign for the shorter branch and evaluates the supplied dimensionless t.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the four output slots are required. The caller controls the scalar offset and interpolation domain.
