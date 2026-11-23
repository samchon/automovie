# src/core/math/IAutoMovieMatrix4.ts#IAutoMovieMatrix4

## @evidence contracts/development/common.md#meaningful-documentation

Affine decomposition values returned by the engine's Matrix4 operations. Nested contracts define the relevant units, ownership and failure states.

## @evidence contracts/development/design.md#principled-representation

The decomposition joins destination-frame translation, quaternion orientation and dimensionless scale.

## @evidence contracts/development/design.md#minimal-and-owned-surface

World-driver consumers read the existing vector/quaternion types through IDecomposeResult.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The type does not represent shear or certify an arbitrary matrix's right-handedness and finite arithmetic.

# src/core/math/IAutoMovieMatrix4.ts#IAutoMovieMatrix4.IDecomposeResult

## @evidence contracts/development/common.md#meaningful-documentation

States coordinate units, fresh ownership, collapse conventions and the unsupported shear/reflection cases.

## @evidence contracts/development/design.md#principled-representation

Three canonical records express affine TRS; positive-scale authored validation elsewhere supplies the unsheared right-handed premise, which this structural result cannot enforce.

## @evidence contracts/development/design.md#minimal-and-owned-surface

World-space aim, parent and IK drivers read these components and recompose their matrices; no new vector or quaternion representation is introduced.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scale magnitudes do not encode mirror signs, and the output is not an exact shear decomposition or an input-validation verdict.
