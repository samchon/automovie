# src/schema/IAutoMovieHumanJawPoseSchema.ts#IAutoMovieHumanJawPoseSchema

## @evidence contracts/development/common.md#meaningful-documentation

The three fields document their incisor reference, millimetre unit and directions. The input separates opening from the two translation distances.

## @evidence contracts/development/design.md#principled-representation

Typia uses [0, 52.9] millimetres for opening, [0, 8.5] for protrusion and [-10.35, 10.35] for lateral excursion. The prepared evaluator converts opening to a joint turn using the jaw lever length and treats the other two as translations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The pose owns jaw travel in this one head subrecord. Measured maximum opening and named facial expression fields are separate inputs.
