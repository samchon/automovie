# src/geometry/AutoMovieVector3Jet2.ts#AutoMovieVector3Jet2

## @evidence contracts/development/common.md#meaningful-documentation

Mutable XYZ tuple of scalar order-two jets, with the same independent parameter for each component.

## @evidence contracts/development/design.md#principled-representation

Component-first storage groups each axis's value and full first and second derivatives. Consumers can perform axis-local jet arithmetic without transposing the tuple.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The type reuses scalar jets inside three Cartesian slots. The owning field supplies vector frame and parameter units.
