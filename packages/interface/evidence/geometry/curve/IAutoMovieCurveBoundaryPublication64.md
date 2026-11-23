# src/geometry/curve/IAutoMovieCurveBoundaryPublication64.ts#IAutoMovieCurveBoundaryPublication64

## @evidence contracts/development/design.md#principled-representation

Instance identity ties the boundary to the context that actually published it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One token carries routing, revision and the immutable published field.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Copying equal data or a revision string does not forge a valid binding.

## @evidence contracts/development/common.md#meaningful-documentation

Explains why both serialized identity and exact object identity matter.
