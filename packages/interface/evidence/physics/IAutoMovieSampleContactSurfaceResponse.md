# src/physics/IAutoMovieSampleContactSurfaceResponse.ts#IAutoMovieSampleContactSurfaceResponse.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Gives the sample clock/frame, transported contact centres, explicit impulse estimates and decay policy.

## @evidence contracts/development/design.md#principled-representation

World/provider metre coordinates share one current frame; weightPerImpulse is per N s and decaySeconds is positive seconds or Infinity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

sampleContactSurfaceResponse reads canonical contact events; the provider's center callback and appearance channels own surface transport and colour.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Geometry-only contacts require declared impulse estimates; a localized appearance weight is not a medical model or an invented solver impulse.
