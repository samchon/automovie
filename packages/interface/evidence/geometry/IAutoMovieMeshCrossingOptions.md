# src/geometry/IAutoMovieMeshCrossingOptions.ts#IAutoMovieMeshCrossingOptions

## @evidence contracts/development/design.md#principled-representation

The callback receives each strict intersection point in the shared frame, and because a triangle intersection segment is straight, a classifier over its endpoint witnesses can decide whole-segment membership in a convex insertion region without the census knowing that region.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three optional knobs, pair population, interior margin and point classification, each read directly by the census loop; `IHumanFaceClearanceRequest` forwards the callback type rather than redeclaring it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The callback can only reject points the strict predicate already reported, so it cannot certify a crossing, and a rejection removes that one witness rather than the triangle pair.

## @evidence contracts/development/common.md#meaningful-documentation

States each option's omitted default, the tolerance's dimensionless range, the callback's frame, ordinal space and no-mutation rule, and that coplanar overlap bypasses the callback.
