# src/expression/IAutoMovieExpression.ts#IAutoMovieExpression

## @evidence contracts/development/design.md#principled-representation

sampleMotion uses outgoing eased progress t for same-preset linear intensity/channel interpolation, switches differing presets at t = 0.5 and substitutes zero intensity/no channels for an absent side. That threshold need not be the chronological segment midpoint.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three required fields separate the coarse preset and intensity from nullable fine overrides; null expresses no overrides without omitting a required member, and validation shares closed names and unit-interval authored magnitudes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Validation refuses duplicate channels rather than assigning authoring-time merge semantics. Differing presets switch at eased progress 0.5 instead of receiving an invented per-avatar cross-fade; key admission does not prove intermediate magnitudes remain in range or that the avatar implements the requested targets.

## @evidence contracts/development/common.md#meaningful-documentation

States the two control levels and when to use each, the validator's refusals, and the interpolation rules between keyframes; members give the intensity range and the meaning of `null` overrides and their uniqueness rule.
