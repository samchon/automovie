# src/scene/detailNormalShading/spliceTangentNormal.ts#spliceTangentNormal

## @evidence contracts/development/implementation.md#principled-implementation

Expands the installed native normal-map chunk when still included and inserts code immediately before its supported tangent-to-surface line, retaining that line for later ordered patches; exact pinned chunk/anchor compatibility is required and absence throws rather than silently applying a different projection.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One insertion owner serves detail/relief normal operations and composes with an already-expanded shader, avoiding competing custom tangent-frame solvers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads the real installed ShaderChunk and exact supported projection marker rather than fixture shader text or a patched global chunk; no default-normal or different branch hides a missing compatibility boundary.

## @evidence contracts/development/common.md#meaningful-documentation

Explains native expansion, preserved tangent boundary and ordered composition; the thrown error identifies the unsupported native projection point.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed includes/replacements visit shader bytes linearly and expand one constant native chunk, O(source+injected-code) result storage; no mesh, texture or renderer traversal is performed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Detects and reuses prior native chunk expansion while retaining the target marker so successive distinct patches compose once in registration order; repeated identical patch insertion is not deduplicated by this primitive.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Acquires no native shader/program/texture handle and retains no caller input; returned text owns only source bytes, with temporary expansion strings released after the call.
