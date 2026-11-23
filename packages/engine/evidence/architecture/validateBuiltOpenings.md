# src/architecture/validateBuiltOpenings.ts#validateBuiltOpenings

## @evidence contracts/development/implementation.md#principled-implementation

Tests the shared straight arc-envelope ring for region validity, approximate containment and contact overlap. Under `outlineHull`'s arc/winding and finite-intermediate premises its geometric overestimate is conservative, but binary64 predicates are not a universal one-sided error certificate and circular-arc simplicity is not independently proved. Contact is refused to preserve a separating jamb.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The opening section of `validateBuiltEnvironment`, separated so that file stays one orchestration; it reuses the shared outline, region, containment, overlap and operation rules and returns exactly what the staged panel fit consumes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No opening type is special-cased; unusable host faces suppress a redundant containment complaint. Position-keyed hulls preserve distinct records even when ids repeat, so those distinct records can still report overlap rather than overwriting one another.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states every opening, void, bulge, hull and overlap rule, where operations are judged and what they share, the path root, and what the result is for.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds the boundary index, then pays each profile's hull generation, O(H²) simplicity and `polygonInside` cost against its host, plus full operation validation. Scans O(K²) usable-void pairs, with shared-boundary pairs paying vertex-product overlap work. Vertex counts, operation state counts and openings per boundary are variable inputs.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per building validation; each hull is computed once and reused by the face, overlap and panel-fit checks.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The boundary index is released on return; the caller owns the returned hull map, bounded by the opening count, and `driven` grows by at most one entry per panel.
