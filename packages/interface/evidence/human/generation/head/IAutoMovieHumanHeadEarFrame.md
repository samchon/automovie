# src/human/generation/head/IAutoMovieHumanHeadEarFrame.ts#IAutoMovieHumanHeadEarFrame.IFrame

## @evidence contracts/development/common.md#meaningful-documentation

Own-side dimensions and orientation in calibration mm.

## @evidence contracts/development/design.md#principled-representation `n`: Outward side-outline normal at the selected tragion height. `a`: Unit sa-sba chord direction, upward. `b`: Forward unit direction perpendicular to a and n.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanHeadEarFrame.of. Read by AutoMovieHumanHeadEarPlate.of. Also types AutoMovieHumanHeadCanonical.frame, AutoMovieHumanHeadEarParts.f.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `n`, `a`, `b`, `top`, `bottom`, `length`, `breadth`, `protrusion`, `scale`, `sign`; callers supply the complete record.
