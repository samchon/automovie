# src/architecture/IAutoMovieConnectorLandingAt.ts#IAutoMovieConnectorLandingAt

## @evidence contracts/development/design.md#principled-representation

Places the landing by arc length: the authored fraction is scaled by the route's total 3D length and linearly interpolated on the segment that length falls in, so an unevenly spaced route keeps the stop where its author put it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three fields, the served space, the authored fraction and the resolved world point, which is the join a shot needs between a stop and its place on the run.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Validation keeps the fraction strictly inside `(0, 1)`, the space resolvable, distinct from both ends and unique per run, so the producer needs no clamp or fallback for a landing at an end.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer and order, how the fraction becomes a point, the validation guarantees on the fraction and the space, and that `position` is in world space.
