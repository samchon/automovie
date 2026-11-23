# src/material/IAutoMovieImage.ts#IAutoMovieImage

## @evidence contracts/development/design.md#principled-representation

The glTF image record joins an id to typed encoded bytes; engine model admission reads the PNG header to require the subset the viewer decodes, and the viewer resolves bindings against these ids before calling the host loader.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record owns identity and bytes, the model owns the list, and sampling stays on the binding that cites the id, so an image is not tied to one material slot.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Only PNG is declared because only PNG is decoded; an image is not resized, recompressed or colour-managed, and an id collision is refused rather than resolved by order.

## @evidence contracts/development/common.md#meaningful-documentation

States the glTF origin, resolution precedence, row orientation, shot-wide identity, the admitted PNG subset, the base64 form and the edge bound.
