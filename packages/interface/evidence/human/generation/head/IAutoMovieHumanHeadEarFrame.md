# src/human/generation/head/IAutoMovieHumanHeadEarFrame.ts#IAutoMovieHumanHeadEarFrame

## @evidence contracts/development/common.md#meaningful-documentation

Own-side auricle directions and public dimensions in calibration millimetres. Member comments specify the units and frames.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups only IFrame declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

IFrame separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanHeadEarFrame exchanges the named IFrame contracts with its Human callers. Interface owns these type declarations without importing that implementation.

# src/human/generation/head/IAutoMovieHumanHeadEarFrame.ts#IAutoMovieHumanHeadEarFrame.IFrame

## @evidence contracts/development/common.md#meaningful-documentation

Own-side dimensions and orientation in calibration mm.

## @evidence contracts/development/design.md#principled-representation `n`: Outward side-outline normal at the selected tragion height. `a`: Unit sa-sba chord direction, upward. `b`: Forward unit direction perpendicular to a and n.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanHeadEarFrame.of. Read by AutoMovieHumanHeadEarPlate.of. Also types AutoMovieHumanHeadCanonical.frame, AutoMovieHumanHeadEarParts.f.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `n`, `a`, `b`, `top`, `bottom`, `length`, `breadth`, `protrusion`, and `sign`. Relief sizing uses the person's breadth.
