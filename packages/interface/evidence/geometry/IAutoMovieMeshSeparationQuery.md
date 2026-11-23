# src/geometry/IAutoMovieMeshSeparationQuery.ts#IAutoMovieMeshSeparationQuery

## @evidence contracts/development/design.md#principled-representation

Both operations run one private walk over a median-split box hierarchy, pruning a box whose axis projections already prove the target and bounding each remaining triangle with `boundAutoMovieConvexSeparation`; because the running bound starts at the target and only falls, stopping at the first refutation cannot change certification.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A callable object with one method keeps the full measurement and the cheaper decision on the same compiled snapshot, so a caller cannot pair a verdict with a measurement taken over a different surface.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No box or triangle is skipped by distance sampling, a nearest corner or a spatial tolerance; a box is pruned only by an outward-rounded projection proof, and a refusal or exhaustion throws instead of returning a guess.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, what a feature is and its frame, what each operation returns, the shared budget and refusals, and the two representations the hair builder compiles.
