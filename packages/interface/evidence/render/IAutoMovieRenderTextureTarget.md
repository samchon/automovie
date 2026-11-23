# src/render/IAutoMovieRenderTextureTarget.ts#IAutoMovieRenderTextureTarget

## @evidence contracts/development/design.md#principled-representation

Describe host-owned framebuffer attachment storage separately from decoded Source sharing, including faces, resolved mips, requested multisamples and depth texture/renderbuffer distinctions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One attachment profile lets closure count independent targets and connect actual transmission/shadow ownership without importing graphics objects.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Requested sample count bounds hardware-clamped allocation; absent format or null depth storage stays unknown rather than using an assumed byte width.

## @evidence contracts/development/common.md#meaningful-documentation

Members document pixel extents, face population, resolved color formats, sample/depth ownership and live scope associations.
