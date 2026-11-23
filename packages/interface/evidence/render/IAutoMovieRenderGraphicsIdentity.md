# src/render/IAutoMovieRenderGraphicsIdentity.ts#IAutoMovieRenderGraphicsIdentity

## @evidence contracts/development/design.md#principled-representation

The host probe reports API, vendor and renderer spellings; the renderer field is intentionally distinct from the target's device spelling until projection.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This boundary type represents the graphics observation without claiming it has already become a sealed render target.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Masked vendor and renderer values remain host observations rather than invented device capabilities.

## @evidence contracts/development/common.md#meaningful-documentation

Members identify WebGL unmasked constants, their masked fallbacks and the API family string.
