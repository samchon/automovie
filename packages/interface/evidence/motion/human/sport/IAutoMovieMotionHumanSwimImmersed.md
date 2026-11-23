# src/motion/human/sport/IAutoMovieMotionHumanSwimImmersed.ts#IAutoMovieMotionHumanSwimImmersed

## @evidence contracts/development/common.md#meaningful-documentation

States the medium, span, optional stroke and passive entry speed with their units and defaults.

## @evidence contracts/development/design.md#principled-representation

The same medium and span describe a passive float or glide, or one keyed stroke starting at rest.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The registered swimImmersed law owns the opt-in stroke; the staged swim parameters retain their existing contract.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Runtime admission checks the numbers. The water's density and the profile determine whether buoyancy can carry the body.
