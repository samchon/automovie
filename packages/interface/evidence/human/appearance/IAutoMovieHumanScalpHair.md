# src/human/appearance/IAutoMovieHumanScalpHair.ts#IAutoMovieHumanScalpHair

## @evidence contracts/development/common.md#meaningful-documentation

Scalp hair as length, curl, colour and hairline.

## @evidence contracts/development/design.md#principled-representation `style`: Cut, one of a closed set of short styles: `crop` lies close all over and points away from the crown's whorl; `short` has tapered back and sides and a longer top combed back from a side parting; `bob` is parted at the midline and hangs to a level cut, at most to the shoulders. `color`: Hair colour. `length`: Length of the longest scalp hair from the scalp to the tip, straightened, millimetres; zero is a shaved scalp.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanScalpHair is the canonical exchange used by IAutoMovieHumanScalpHairSchema, IAutoMovieHumanAppearance.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `style`, `color`, `length`, `curl`, `hairline`; callers supply the complete record.
