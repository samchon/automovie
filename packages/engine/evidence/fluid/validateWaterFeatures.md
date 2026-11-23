# src/fluid/validateWaterFeatures.ts#validateWaterFeatures

## @evidence contracts/development/implementation.md#principled-implementation

Resolves supplied ids through maps, checks boundary membership, and applies shared space containment to every authored bed centre in the basin subtree. Per-cell heights can vary independently, so root convexity cannot justify skipping interior points; shared containment retains its binary64 and tolerance limits.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The binding validator owns only cross-record agreement; domain soundness is delegated to `validateFluidDomain` and re-pathed rather than re-worded, and geometry to the shared space predicates, so each rule has one owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Volume-less roots and rejected domains skip geometry by explicit policy, with no fixture-specific exceptions. Every admitted lattice uses the same exhaustive bed-centre traversal regardless of basin convexity.

## @evidence contracts/development/common.md#meaningful-documentation

Gives binding checks, environment/material admission limits, duplicate resolution and domain re-pathing, geometry skips and exhaustive initial bed-centre coverage without claiming water-surface enclosure.

## @evidence contracts/development/implementation.md#efficient-algorithms

Maps require O(spaces + boundaries + domains) entries before domain validation and feature/rim walks; each rim membership check scans the cited boundary's spaces list, and id/text handling adds string costs. Per measured feature, subtree indexing/filtering scans all spaces; at most rows times columns bed centres scan descendant volumes with their plane/triangle costs, stopping at the first stray. Numeric loops allocate no axis-index arrays. Domain scans use actual array and flow lengths even for over-budget records.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Within one call each domain is validated once and its verdict reused by every feature that cites it; each measured feature builds its basin subtree once for all bed points. Nothing is cached across calls because environments and domains are mutable caller inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the maps, sets and collector die with the call, and the returned violations belong to the caller.
