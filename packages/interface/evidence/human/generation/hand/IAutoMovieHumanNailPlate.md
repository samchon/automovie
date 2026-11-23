# src/human/generation/hand/IAutoMovieHumanNailPlate.ts#IAutoMovieHumanNailPlate

## @evidence contracts/development/common.md#meaningful-documentation

Nail dimensions and a dorsal-skin placement frame in millimetres. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups only ISize, IInput declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

ISize, IInput separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanNailPlate exchanges the named ISize, IInput contracts with its Human callers. Interface owns these type declarations without importing that implementation.

# src/human/generation/hand/IAutoMovieHumanNailPlate.ts#IAutoMovieHumanNailPlate.ISize

## @evidence contracts/development/common.md#meaningful-documentation

A plate's derived dimensions, mm.

## @evidence contracts/development/design.md#principled-representation `length`: Length root to free edge. `width`: Width edge to edge. `sag`: Transverse rise.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanDigitProfile.plateOf, AutoMovieHumanNailPlate.size. Read by AutoMovieHumanNailFold.height. Also types AutoMovieHumanFootToeSpan.plate, AutoMovieHumanDigitProfile.plate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `length`, `width`, `sag`, `lift`; callers supply the complete record.

# src/human/generation/hand/IAutoMovieHumanNailPlate.ts#IAutoMovieHumanNailPlate.IInput

## @evidence contracts/development/common.md#meaningful-documentation

A plate's fixed inputs.

## @evidence contracts/development/design.md#principled-representation `origin`: The centre of the plate's root on the dorsal skin, mm. `along`: Unit direction of the nail bed. `normal`: Unit dorsal normal of the skin at the root.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanDigitProfile.plateInput. Read by AutoMovieHumanNailPlate.size, AutoMovieHumanNailPlate.across, AutoMovieHumanNailPlate.point.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `origin`, `along`, `normal`, `phalanx`, `width`; callers supply the complete record.
