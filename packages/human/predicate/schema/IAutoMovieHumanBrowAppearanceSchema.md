# src/schema/IAutoMovieHumanBrowAppearanceSchema.ts#IAutoMovieHumanBrowAppearanceSchema

## @evidence contracts/development/common.md#meaningful-documentation

The declaration names the width multiplier and pigment coverage separately. The parent appearance block owns which anatomical side receives this eyebrow.

## @evidence contracts/development/design.md#principled-representation

Typia tags constrain thickness to [0.3, 2] times the reference width and coverage to [0, 1]. Each field can be omitted. The bound on optional fields applies when a caller supplies them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The appearance schema pairs this existing eyebrow shape once for left and right. Scalar tags live on the single-brow record and the parent owns the pair.
