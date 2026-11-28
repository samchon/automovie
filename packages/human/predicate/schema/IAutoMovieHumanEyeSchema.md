# src/schema/IAutoMovieHumanEyeSchema.ts#IAutoMovieHumanEyeSchema

## @evidence contracts/development/common.md#meaningful-documentation

The two values identify different landmarks. The length joins the two corners and the height spans the lid margins at the pupil with the eye open at rest.

## @evidence contracts/development/design.md#principled-representation

Typia bounds the required corner-to-corner length to [10, 50] millimetres and the lid separation to [3, 20]. The parent assigns this measured record to an anatomical side.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The face schema reuses this fixed-scope shape for each eye. Iris color and eye movement have separate owners.
