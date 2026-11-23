# src/drawing/resolveAutoMovieDrawingFeature.ts#resolveAutoMovieDrawingFeature

## @evidence contracts/development/implementation.md#principled-implementation

Reads features from the placed tessellation with corners welded on the six-decimal grid and ordered numerically, so an index means the same corner after parts are reordered; the axis is the transformed basis vector, and the stated limitations are that welding can split two corners straddling a rounding boundary and that the centroid is a vertex mean.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns target resolution for every feature kind, sharing placement with the drafter through the design index; the welding, ordering and guard helpers are private because nothing else reads them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No element or feature is special-cased; a changed count, an out-of-range or fractional index, a missing element, part or model and a collapsed axis are each reported stale instead of being snapped to a nearby feature.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the stale-versus-relocate rule, the staging used, how each feature kind is indexed and what it resolves to, the centroid's meaning, and what a stale result carries.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the element's triangle count to place and weld its corners, plus `O(V log V)` or `O(E log E)` to order the welded vertices or edges, with grid coordinates computed once per corner instead of inside the comparator.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Accepts the caller's design index so every dimension end and note in one derivation shares the element lookups, world matrices and part tessellations; without one, it indexes the environment for this call only, since a standalone call has nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The placed triangles and welding maps live for the call and are released on return; only a small resolution record survives.
