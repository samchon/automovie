# src/architecture/IAutoMovieSpaceShell.ts#IAutoMovieSpaceShell

## @evidence contracts/development/design.md#principled-representation

Validation checks finite vertices, safe in-range indices, finite cross-product length above 1e-12 (twice facet area), opposite directed-edge pairing exactly once and finite positive aggregate signed volume. Containment first tests triangle boundaries, then sums signed solid angles and accepts absolute winding at least 2*pi; closed consistently oriented components and usable finite intermediates remain premises beyond those validation checks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One vertex list and one flat index list hold the outer boundary and every void, so containment and volume are each one loop over faces with no case for holes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Nothing is repaired. Missing/duplicated edge pairings, unusable facets and nonpositive aggregate volume are refused; positive aggregate volume does not prove every disconnected component's orientation, manifold vertex topology or absence of self-intersection. Solid-angle and volume arithmetic can round, cancel or overflow, and surface tests reuse one slack at different geometric scales rather than certifying exact contact.

## @evidence contracts/development/common.md#meaningful-documentation

States why voids share the list, the closure and winding the mesh must already have, what validation does and does not check, the minimum counts, the index layout, and the cells-or-shell exclusivity.
