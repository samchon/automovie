# src/geometry/refineSubdivisionUvs.ts#refineSubdivisionUvs

## @evidence contracts/development/implementation.md#principled-implementation

Face-varying refinement as OpenSubdiv defines it: UV topology follows corner indices, continuous regions take the vertex rules, and the linear-boundaries option fixes boundary values and halves boundary edges, which keeps an authored chart outline exact.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The vertex masks come from the position step, so UVs never reclassify sharpness; only UV continuity, which positions do not have, is decided here.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Seams are found from corner indices, never from comparing UV values, and a pinned value is kept exactly rather than smoothed and snapped back.

## @evidence contracts/development/common.md#meaningful-documentation

States the continuity test, the pinning and boundary rules, the interior rule, the effect on charts, and the numbering of child values and corners.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in corners, edges and UV values: one continuity test per edge, one pin pass per fan, and one rule application per child value.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the position step's vertex masks, which depend only on the sharpness the UV interior shares.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns the child values and four corner indices per parent corner; the continuity, pin and owner tables are released on return.
