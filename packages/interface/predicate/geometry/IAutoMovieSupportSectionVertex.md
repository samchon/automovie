# src/geometry/IAutoMovieSupportSectionVertex.ts#IAutoMovieSupportSectionVertex

## @evidence contracts/development/common.md#meaningful-documentation

One feasible convex section corner with metre coordinates and original half-plane identities.

## @evidence contracts/development/design.md#principled-representation

The evaluator publishes the canonical nonparallel tight pair and the full exact tight set, so topology can track repeated incidence independently of floating coordinate proximity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Each corner owns its pair, full incidence and XZ tuple. Polygon ordering and the constraint data live outside the corner.

# src/geometry/IAutoMovieSupportSectionVertex.ts#IAutoMovieSupportSectionVertex.pair

## @evidence contracts/development/common.md#meaningful-documentation

Ascending ordinals of the first nonparallel pair among tight planes in original normal order.

# src/geometry/IAutoMovieSupportSectionVertex.ts#IAutoMovieSupportSectionVertex.tight

## @evidence contracts/development/common.md#meaningful-documentation

Sorted unique original plane ordinals whose exact incidence is tight at the corner, including both pair entries.

# src/geometry/IAutoMovieSupportSectionVertex.ts#IAutoMovieSupportSectionVertex.point

## @evidence contracts/development/common.md#meaningful-documentation

Fresh mutable X and Z coordinates in the offsets' local metre chart.
