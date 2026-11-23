# src/architecture/IAutoMoviePatternTextureTransform.ts#IAutoMoviePatternTextureTransform

## @evidence contracts/development/design.md#principled-representation

Factors approximately orthogonal map rows into `diag(scale) · R(-rotationDeg)`: second-row angle/length determine the turn and vertical scale, while determinant over vertical length supplies signed horizontal scale. This matches the viewer's zero-centre Three texture matrix, rather than scale-then-rotate column-vector composition.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Uses the offset, scale and rotation fields the PBR texture reference already has, so no second texturing path is introduced.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The producer reports row skew above its `1e-9` relative tolerance instead of emitting it; below-threshold residual skew is admitted, so this record is not an exact zero-shear certificate.

## @evidence contracts/development/common.md#meaningful-documentation

States producer, normalized UV source, the zero-centre matrix/order, offset units, mirrored scale sign, rotation range and tolerated residual skew.
