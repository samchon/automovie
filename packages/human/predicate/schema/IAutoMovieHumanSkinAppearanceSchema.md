# src/schema/IAutoMovieHumanSkinAppearanceSchema.ts#IAutoMovieHumanSkinAppearanceSchema

## @evidence contracts/development/common.md#meaningful-documentation

The declaration states the normalized finish ranges, the unsigned seed and the three individually optional mark groups.

## @evidence contracts/development/design.md#principled-representation

The two finish fields use inclusive [0, 1] bounds. The seed is an optional uint32. Each mark group reuses its own range constraints, including physical diameters in rest-surface millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The skin finish owns seed and mark inputs. Constitutive pigmentation uses its own schema. Mark placement, shading and support for a supplied group belong to the consumer.
