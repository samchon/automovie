# src/schema/IAutoMovieHumanUnderwearSchema.ts#IAutoMovieHumanUnderwearSchema

## @evidence contracts/development/common.md#meaningful-documentation

The source specifies two garment selections and a six-digit sRGB color written with a leading `#`.

## @evidence contracts/development/design.md#principled-representation

Both inherited garment choices remain required. The typia pattern checks a leading `#` and exactly six hexadecimal digits, allowing either letter case.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The Interface owns both garment vocabularies and their single shared color. The Human schema contributes the color pattern used by the appearance block.
