# src/material/IAutoMovieMaterialOverlay.ts#IAutoMovieMaterialOverlay

## @evidence contracts/development/design.md#principled-representation

Ordered colour/roughness and replacement normals use alpha-times-strength coverage. Multiply normals use whiteout composition with strength-scaled XY and retained sampled Z, independently of colour alpha; zero strength therefore does not universally preserve an existing normal.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Each overlay owns its image, blend, optional colour and relief factors and strength; the enclosing material owns list order and the four-layer budget, while texture references reuse the normal material sampling representation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No use selects a special shader branch; the same multiply or replace rule applies to any authored image, and an unavailable colour image applies no overlay instead of fabricating coverage.

## @evidence contracts/development/common.md#meaningful-documentation

Defines colour coverage, edge texels, ordered blend formulas, multiply-normal alpha/zero-strength limits, finite factors and defaults, and the missing glTF counterpart without a physical-response guarantee.
