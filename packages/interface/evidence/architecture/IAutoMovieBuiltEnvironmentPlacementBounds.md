# src/architecture/IAutoMovieBuiltEnvironmentPlacementBounds.ts#IAutoMovieBuiltEnvironmentPlacementBounds.IProps

## @evidence contracts/development/design.md#principled-representation

The shared locator discriminates element and population identities; boxes are in world metres and missing or transform-only bodies resolve to null.

## @evidence contracts/development/design.md#minimal-and-owned-surface

builtEnvironmentPlacementBounds and the support-status query use the same environment and locator contracts as the placement resolver.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The environment is borrowed and must supply admitted geometry; CPU bounds exclude skinning and external loaded geometry, and along-route population bounds throw.

## @evidence contracts/development/common.md#meaningful-documentation

Building and body identity used to query one static world-space placement bound. The shared locator discriminates element and population identities; boxes are in world metres and missing or transform-only bodies resolve to null.
