# src/schema/IAutoMovieHumanPigmentationSchema.ts#IAutoMovieHumanPigmentationSchema

## @evidence contracts/development/common.md#meaningful-documentation

The declaration distinguishes epidermal melanin, the share that is eumelanin, dermal haemoglobin and the shared iris color. The three numeric quantities are dimensionless.

## @evidence contracts/development/design.md#principled-representation

Typia tags check inclusive bounds [0, 0.5] for melanin, [0, 1] for eumelanin share and [0.001, 0.32] for haemoglobin. Iris remains the inherited category shared by both eyes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The Human parameter and identity schemas reuse this constitutive input. Skin finish and surface marks have their own appearance schema.
