# src/scene/materialOverlayShading/materialOverlayVertex.ts#materialOverlayVertex

## @evidence contracts/development/implementation.md#principled-implementation

Adds one transformed colour UV per layer and optional transformed normal UV at the installed Three common/uv markers.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Vertex varying generation is separate from fragment composition and actual texture matrix uniforms, retaining the original source around supported markers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The original uv coordinate and layer ordering remain unchanged; missing SDK markers are not detected as a successful native shader build by this string helper.

## @evidence contracts/development/common.md#meaningful-documentation

Documentation names transformed per-image UVs, marker premises and lack of an independent compile/render verdict.

## @evidence contracts/development/implementation.md#efficient-algorithms

Layer statement construction is O(L) plus a fixed number of S-byte replacements, with generated string storage proportional to input source and enabled layer fields.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Ordered structural shapes govern program-source equivalence while actual texture transforms remain per-material uniforms; this function maintains no mutable source cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only temporary source arrays and the returned string are retained by their consumer; the function acquires no geometry, attribute buffer or shader program.
