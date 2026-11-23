# src/architecture/autoMoviePatternTextureTransforms.ts#autoMoviePatternTextureTransforms

## @evidence contracts/development/implementation.md#principled-implementation

Builds `diag(1/tile) · R(rotation − grain) · diag(±width, height)` and factors rows whose relative dot product is within `1e-9`. Exact orthogonality permits the ideal factorization; tolerated residual skew is approximate. Valid generated placement fields and finite, non-underflowing intermediate row lengths/determinants are premises beyond the tile/origin input checks.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Emits the offset, scale and rotation the material texture reference already carries, so no second texturing path is opened, and one call states one material's sheet as the prototype table is stated per call.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no material, module or production. Rows exceeding the stated relative skew tolerance are reported by id; smaller residual skew is admitted explicitly. Cut pieces retain module-rectangle mapping instead of renormalizing their surviving outlines.

## @evidence contracts/development/common.md#meaningful-documentation

States the normalized UV source a prototype must use, how whole and cut pieces span it, how grain and mirror enter, the per-material call rule, when a piece is sheared, the list order and partition, and both throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per placement, so linear in the placement count, with no intermediate matrix allocation beyond two small row records.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure map over one run's placements for one sheet; nothing coordinates work across calls, and a caller texturing several materials reuses the same run result.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the returned transforms and sheared ids, together bounded by the placement count.
