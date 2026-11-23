# src/architecture/polygonIsSimple.ts#polygonIsSimple

## @evidence contracts/development/implementation.md#principled-implementation

Tests every non-adjacent pair with the shared tolerance-based closed-segment predicate, including closing-edge adjacency. This is the non-adjacent-contact portion of simplicity validation; adjacent overlap, non-degenerate edges and sufficient point count require separate checks.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates contact to the shared `segmentsTouch`, so building validation and support-surface validation refuse self-contact under the same tolerance as the containment and overlap predicates.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No figure or caller is special-cased; the only skipped pairs are the adjacent ones whose shared corner is not a defect, and degenerate point counts are left to the callers that own them, as documented.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states why simplicity matters, which pairs are skipped, the tolerance and its consequence for a vertex on an edge, and that point count is not judged.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(n²) time and O(1) space with an early return on contact. For n at least three there are n(n-3)/2 non-adjacent pairs; no input-size cap or measured advantage over a sweep algorithm is assumed.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure simplicity test of one outline; building and support validation each ask once per outline and share nothing.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds the two edge indices of the pair scan and allocates nothing, so no state survives the scan.
