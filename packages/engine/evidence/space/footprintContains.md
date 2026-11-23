# src/space/footprintContains.ts#footprintContains

## @evidence contracts/development/implementation.md#principled-implementation

A point must be on/in the outer ring and outside every open hole interior; rim inclusion follows footprintRingPlacement's 1e-9 distance check and its fallback planar boundary/parity predicates, subject to their scale and binary64 limitations.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Region composition stays separate from single-ring classification, so prepared ground and prop support queries share the same authored holes and concavity.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No hull fills a notch or void; zero outer area reads false and malformed topology is not silently repaired. Valid finite prepared rings and compatible finite query coordinates remain caller premises.

## @evidence contracts/development/common.md#meaningful-documentation

States outer/hole rim inclusion, open-hole exclusion, zero-area policy and propagated numeric admission failures; this query decides plan membership, not height or walkability.

## @evidence contracts/development/implementation.md#efficient-algorithms

E total vertices need O(E) worst-case edge work with constant extra live storage; outside outer or first containing hole short-circuits remaining ring queries.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Ring projections and signed areas are prepared once and reused for repeated queries while authored points remain unchanged; no point-result cache is retained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The scalar result retains no geometry; probe/witness records belong only to the nested ring/segment calls and prepared input lifetime remains with its caller.
