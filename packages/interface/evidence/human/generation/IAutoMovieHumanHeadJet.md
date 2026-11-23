# src/human/generation/IAutoMovieHumanHeadJet.ts#IAutoMovieHumanHeadJet

## @evidence contracts/development/common.md#meaningful-documentation

A boundary's jet along the height, as its owner states it: its value and its first and second derivatives per millimetre of height.

## @evidence contracts/development/design.md#principled-representation `value`: The boundary's value at the height, in the unit of the quantity it carries (millimetres of place or half width). `slope`: First derivative with height, the quantity's unit per millimetre. `curvature`: Second derivative with height, the quantity's unit per square millimetre.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanHeadMath.flat. Read by AutoMovieHumanHeadMath.joined.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `value`, `slope`, `curvature`; callers supply the complete record.
