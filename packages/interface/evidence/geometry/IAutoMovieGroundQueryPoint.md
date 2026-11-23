# src/geometry/IAutoMovieGroundQueryPoint.ts#IAutoMovieGroundQueryPoint

## @evidence contracts/development/design.md#principled-representation

One XZ point addresses both first-containing-surface selection and that surface's terrain-height interpolation in their shared world frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Formation relief, direct geometry ground queries and world ground/surface helpers share this representation instead of repeating operation-specific point records.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No Y component or implicit plane turns an absent surface into support; the result owner retains null/zero/nonwalkable distinctions.

## @evidence contracts/development/common.md#meaningful-documentation

Defines axis order, metre units, world frame, borrowed ownership and caller validation responsibility.
