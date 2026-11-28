# src/schema/IAutoMovieHumanScalpHairSchema.ts#IAutoMovieHumanScalpHairSchema

## @evidence contracts/development/common.md#meaningful-documentation

The author can choose independently named style, curl, hairline and color values and assign a longest straightened length in millimetres.

## @evidence contracts/development/design.md#principled-representation

The single numeric refinement constrains the longest hair to [0, 1500] millimetres. The intersection keeps the Interface vocabularies and uses zero as an authored shaved state. A renderer determines which controls it supports.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The appearance schema reuses these scalp-specific constraints through its hair field. Eyebrow and eyelash fields use their own records and measures.
