# src/cinematics/IAutoMovieSurfaceGraphicLayer.ts#IAutoMovieSurfaceGraphicLayer

## @evidence contracts/development/common.md#meaningful-documentation

States the face-fraction box, its origin at the top-left corner, its axes taken from the reading frame and the bounds admission enforces.

## @evidence contracts/development/design.md#principled-representation

A closed union keyed by `kind` separates a colour fill from a fitted image; every member shares one box in face fractions, so a layout is independent of the face's size in metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The render package dispatches on `kind` to build one mesh per layer; the engine gate checks the box and each member's fields. Text and camera-feed members join this union in their own issues.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member carries a depth offset or z order: draw order alone stacks layers.

# src/cinematics/IAutoMovieSurfaceGraphicLayer.ts#IAutoMovieSurfaceGraphicLayer.IBox

## @evidence contracts/development/common.md#meaningful-documentation

States each edge's origin and direction and that sizes are fractions of the face.

## @evidence contracts/development/design.md#principled-representation

Fractions of the face's width and height from its top-left corner, `x` toward the reader's right and `y` toward the face's bottom, as signage and screens are laid out.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Shared by every layer member; read by the engine box check and the render quad builder.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Bounds stay a runtime check because TypeScript cannot express `x + width <= 1`.

# src/cinematics/IAutoMovieSurfaceGraphicLayer.ts#IAutoMovieSurfaceGraphicLayer.IRect

## @evidence contracts/development/common.md#meaningful-documentation

States that the box is filled with one linear colour whose alpha blends over what lies beneath.

## @evidence contracts/development/design.md#principled-representation

A box and one `IAutoMovieColor`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the render layer builder and the engine colour check.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No gradient or border fields that no consumer draws.

# src/cinematics/IAutoMovieSurfaceGraphicLayer.ts#IAutoMovieSurfaceGraphicLayer.IImage

## @evidence contracts/development/common.md#meaningful-documentation

States the asset resolution order, the ledger consumer a project image records, the sRGB decoding and each fit's meaning.

## @evidence contracts/development/design.md#principled-representation

An image id resolved as material bindings resolve theirs, and a closed `fit` that names how image aspect meets box aspect.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the render preparer, which decodes the image once, and by texture closure, which authorizes a project image.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Images are fixed bytes, carried by a model or registered with provenance; no URL or generated content is fetched at draw time.

# src/cinematics/IAutoMovieSurfaceGraphicLayer.ts#IAutoMovieSurfaceGraphicLayer.IText

## @evidence contracts/development/common.md#meaningful-documentation

States the font reference, the layout rules and refusals, the em size unit, the colour, the defaults of the optional alignment and line height, and when fonts decode.

## @evidence contracts/development/design.md#principled-representation

The em size is a fraction of the face height so a layout scales with its face, which render converts to metres with the surface's depth; the font is an id into the shot's font sources, decoded once per shot rather than per layer.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the engine layer check, which resolves the font id, and by the render text builder, which lays it out with the engine's text geometry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No fallback font, glyph substitution or clipping field: an unmapped code point or overflow is refused by the layout.

# src/cinematics/IAutoMovieSurfaceGraphicLayer.ts#IAutoMovieSurfaceGraphicLayer.IFeed

## @evidence contracts/development/common.md#meaningful-documentation

States the camera reference, the target height and width rule, when the feed is drawn, the one-level-deep rule and the refusals.

## @evidence contracts/development/design.md#principled-representation

A camera id and a pixel height; the width follows the box's metric aspect on the face, so the feed never stretches.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the engine feed check, which resolves the camera, and by the render preparer, which owns the render target.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No recursion depth or refresh rate field: a feed is drawn every frame, one level deep.