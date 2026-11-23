# src/architecture/IAutoMovieBuiltPlacementOverlapResult.ts#IAutoMovieBuiltPlacementOverlapResult

## @evidence contracts/development/design.md#principled-representation

Any part-box pair passing `propBoundsOverlap` yields overlapping. Static AABB/prototype proxies can include empty mesh/member gaps and exclude deformation or external geometry; binary64 transforms and degenerate endpoint semantics prevent treating separate as a universal exact rendered-geometry certificate. This query computes no intersection volume.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A three-way status, the unresolved sides, and both bases cover what a caller needs to read a verdict, and no shared volume is computed because the named-pair query answers only whether the bodies meet.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An unresolved operand yields `unresolved` and names its side instead of throwing or reading as `separate`, and both bases are narrowed to body bases because neither operand can be a surface.

## @evidence contracts/development/common.md#meaningful-documentation

States operand boxing, exterior contact versus internal degenerate-box behavior, the pair/sweep distinction, static numerical limits, missing-side reporting and nullable bases.
