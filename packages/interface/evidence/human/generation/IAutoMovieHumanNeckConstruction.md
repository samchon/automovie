# src/human/generation/IAutoMovieHumanNeckConstruction.ts#IAutoMovieHumanNeckConstruction

## @evidence contracts/development/common.md#meaningful-documentation

The restricted original neck source together with the complete engine loft outcome. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups only IOutput declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

IOutput separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanNeckConstruction exchanges the named IOutput contracts with its Human callers. Interface owns these type declarations without importing that implementation.

# src/human/generation/IAutoMovieHumanNeckConstruction.ts#IAutoMovieHumanNeckConstruction.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

The actual adapter input and every engine outcome.

## @evidence contracts/development/design.md#principled-representation `part`: Restricted source records and the original axis on the internal interval, calibration mm. `loft`: Complete engine loft outcome, including every omitted section and nullable chain.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanNeckConstruction.generate. Also types AutoMovieHumanBodySources.neck, AutoMovieHumanHeadCanonical.lower.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `part`, `loft`; callers supply the complete record.
