# src/architecture/IAutoMovieBuiltPlacementBody.ts#IAutoMovieBuiltPlacementBody

## @evidence contracts/development/design.md#principled-representation

Pairs the union box with the boxes it was folded from, so an overlap query can prune on the union and confirm on the parts without resolving the body twice; every solid lies inside `bounds` because `bounds` is their union or is the one solid itself.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members supply the reported envelope with provenance and the finer AABB proxies consumed by pairwise/sweep overlap queries; they describe box occupancy, not a separate physical solid solver.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A part box carries no fabricated `basis`; only the reported box does, and a population is given its own box as solid rather than an invented part split.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, what `solids` holds for each locator kind and why, and the containment of every solid in `bounds` that makes the union a safe prune.
