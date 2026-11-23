# src/human/appearance/IAutoMovieHumanAcne.ts#IAutoMovieHumanAcne

## @evidence contracts/development/common.md#meaningful-documentation

Authorable inflamed spot field, sampled on the rest surface like freckles but concentrated on the face and, less, the upper chest and back.

## @evidence contracts/development/design.md#principled-representation `density`: Expected spots per square centimetre of rest surface on the face, 0 to 10. `diameterMm`: Maximum inflamed spot diameter in rest-surface millimetres, 3 to 10. `severity`: Redness coverage, 0 to 1; spots are drawn as colour only, without papule relief or a silhouette-shape control.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanAcne is the canonical exchange used by IAutoMovieHumanAcneSchema, IAutoMovieHumanSkinAppearance.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `density`, `diameterMm`, `severity`; callers supply the complete record.
