# src/render/IAutoMovieRenderTextureResidency.ts#IAutoMovieRenderTextureResidency

## @evidence contracts/development/design.md#principled-representation

Describe actual live scopes and renderer-retained lookup, PMREM, display and framebuffer allocations so closure includes storage that survives source disposal; omitted residency means a fresh context only.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One host fact record distinguishes live source owners from context-owned scratch and target storage rather than folding all resources into asset counts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Opaque actual object facts and host-observed dimensions are required; author-entered byte estimates or lifetime allocation counters cannot certify current residency.

## @evidence contracts/development/common.md#meaningful-documentation

Members document owner uniqueness, disposed-scope removal, environment clones, retained lookups, compositor copies and context-release boundaries.
