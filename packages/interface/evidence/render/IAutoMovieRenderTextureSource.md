# src/render/IAutoMovieRenderTextureSource.ts#IAutoMovieRenderTextureSource

## @evidence contracts/development/design.md#principled-representation

Keep decoded extents, component format, sampling/upload flags and opaque Source/Texture equality tokens as host facts; those facts determine storage/sharing and distinguish environment conversion from the original cache texture.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Source facts separate native allocation authority from prospective mutable properties, preserving unknown state after SDK mutation or unobserved retirement.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

AllocationStateKnown false or unsupported sampler/format remains unknown; dimensions and author parameters cannot manufacture cached native keys or enclosure of driver overhead.

## @evidence contracts/development/common.md#meaningful-documentation

Members explain pixels, actual format, mip generation, clone identity, environment factory sampling and the limited legacy fresh-context defaults.
