# src/geometry/IAutoMovieMeshCrossing.ts#IAutoMovieMeshCrossing

## @evidence contracts/development/design.md#principled-representation

An ordinal pair plus the coplanar flag, because the narrow phase answers two distinct predicates, strict edge-through-triangle piercing and same-plane overlap, and a caller must know which one held.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Reports which triangles meet and how, leaving depth to `measureAutoMovieMeshClearance` and repair to the caller, so the crossing census stays a containment-free predicate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Ordinals are the original buffer positions, never hierarchy or candidate positions remapped for convenience, and no pair is reported that the strict predicates did not admit.

## @evidence contracts/development/common.md#meaningful-documentation

States the ordinal space, the one-per-triangle default versus every pair with `allPairs`, the default's preference for piercing, and what `coplanar` means.
