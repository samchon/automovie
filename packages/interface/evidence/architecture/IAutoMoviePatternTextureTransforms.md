# src/architecture/IAutoMoviePatternTextureTransforms.ts#IAutoMoviePatternTextureTransforms.IProps

## @evidence contracts/development/design.md#principled-representation

tile U/V are finite positive metres per texture turn; normalized module UVs are transformed using placement degrees and metres, and face origins are checked for finiteness.

## @evidence contracts/development/design.md#minimal-and-owned-surface

autoMoviePatternTextureTransforms reuses generated placements and the module/face sheet discriminant, emitting the material system's existing offset, scale and rotation quantities.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The caller supplies admitted placements and normalized prototype UVs; rows exceeding relative skew 1e-9 are reported separately, and tiny or overflowing intermediate products are not certified.

## @evidence contracts/development/common.md#meaningful-documentation

One material sheet and tile size applied to generated pattern occurrences. tile U/V are finite positive metres per texture turn; normalized module UVs are transformed using placement degrees and metres, and face origins are checked for finiteness.
