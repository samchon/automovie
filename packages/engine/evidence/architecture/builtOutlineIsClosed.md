# src/architecture/builtOutlineIsClosed.ts#builtOutlineIsClosed

## @evidence contracts/development/implementation.md#principled-implementation

The corner floor follows from what closes an area with straight edges versus half-turn arcs, and a repeated consecutive corner is detected as a zero shortest edge, which would otherwise make edge directions and arc chords undefined.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One outline rule shared by boundary faces and opening voids in building validation, with the corner floor as the one parameter that differs between them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No outline is padded, deduplicated or repaired, and the two floors are the contract's own difference between straight and bulged outlines.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states both floors and why, the finiteness rule and its paths, the repeated-corner tolerance and units, where checking stops, and each parameter's role.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the corner count: one finiteness pass and one shortest-edge pass.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A check of one outline per call; each face and opening outline is checked once per validation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates nothing beyond the violations, at most one per coordinate or one for the count or the repeat, appended to the caller's collector.
