# src/schema/IAutoMovieHumanTraitsSchema.ts#IAutoMovieHumanTraitsSchema

## @evidence contracts/development/common.md#meaningful-documentation

The documentation distinguishes numerical age, nullable stature, independent skin tone and normalized build offsets. The reference vocabulary remains explicit.

## @evidence contracts/development/design.md#principled-representation

Typia admits nonnegative age, stature in [400, 2500] millimetres or null, and optional skin tone in [0, 1]. The sex and population vocabularies come from Interface. This admission checks the description without expanding a statistical identity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The root traits type is a compact authored record that reuses build offsets and reference vocabularies. Detailed measurement inputs stay with the identity and parameter schemas.
