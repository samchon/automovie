# src/cinematics/IAutoMoviePerspectiveFrustumLens.ts#IAutoMoviePerspectiveFrustumLens

## @evidence contracts/development/common.md#meaningful-documentation

Defines depth and gate units, finite ordered premises, omitted crop and conditional crop admission.

## @evidence contracts/development/design.md#principled-representation

near and far use camera-space metres; halfY and aspect define the uncropped perspective gate without conflating FOV degrees with its tangent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Box, segment and sphere frustum queries share this lens while keeping their geometry and rejection policies separate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

This input is not a validated camera certificate and does not promise exact floating-point boundary predicates.
