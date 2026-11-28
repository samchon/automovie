# src/geometry/IAutoMovieSurfaceFrame.ts#IAutoMovieSurfaceFrame

## @evidence contracts/development/common.md#meaningful-documentation

Metre centroid and orienting directions for one rigid surface sample.

## @evidence contracts/development/design.md#principled-representation

Normalization prioritizes the supplied normal, builds a side axis from its cross product with forward and uses the resulting plane to recover the unit heading.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The record supplies placement directions without a scale. The prepared sample owns its dimensions and point order.

# src/geometry/IAutoMovieSurfaceFrame.ts#IAutoMovieSurfaceFrame.origin

## @evidence contracts/development/common.md#meaningful-documentation

Finite centroid in the caller's metre frame. Placement puts the prepared sample's centre here.

# src/geometry/IAutoMovieSurfaceFrame.ts#IAutoMovieSurfaceFrame.forward

## @evidence contracts/development/common.md#meaningful-documentation

Finite nonzero heading direction. Its projection into the normal's plane defines the first axis and must remain nonzero.

# src/geometry/IAutoMovieSurfaceFrame.ts#IAutoMovieSurfaceFrame.normal

## @evidence contracts/development/common.md#meaningful-documentation

Finite nonzero oriented plane normal. Its magnitude has no effect on placement scale.
