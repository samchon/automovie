# src/motion/IAutoMovieFootLeg.ts#IAutoMovieFootLeg

## @evidence contracts/development/design.md#principled-representation

Identifies the two articulated segments and their foot effector by semantic bone slots, the data needed to resolve and plant a leg without storing duplicated rest lengths.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The foot-named record adapts HUMANOID_LEG_CHAINS to stance detection, while fitChainToTarget consumes the corresponding generic effector chain.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Callers may supply any resolving leg slots; the default humanoid choice is explicit in plantStanceFeet rather than inferred from mesh or asset names.

## @evidence contracts/development/common.md#meaningful-documentation

Identifies hip-knee-ankle roles, resolution requirements and the shared source of default legs.
