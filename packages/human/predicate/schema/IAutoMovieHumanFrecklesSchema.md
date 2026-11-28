# src/schema/IAutoMovieHumanFrecklesSchema.ts#IAutoMovieHumanFrecklesSchema

## @evidence contracts/development/common.md#meaningful-documentation

Density, maximum rest-surface diameter and local pigment coverage have distinct meanings and units. Zero density or contrast expresses absence.

## @evidence contracts/development/design.md#principled-representation

Typia tags bound the expected density to [0, 40] marks per square centimetre, maximum diameter to [2, 6] millimetres and coverage to [0, 1]. The consumer determines the placement and individual diameters.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The refinement contributes one optional mark record to the skin schema. It retains the Interface fields and attaches admission at the three authored scalars.
