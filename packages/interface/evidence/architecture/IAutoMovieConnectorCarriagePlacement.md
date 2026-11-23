# src/architecture/IAutoMovieConnectorCarriagePlacement.ts#IAutoMovieConnectorCarriagePlacement

## @evidence contracts/development/design.md#principled-representation

Composes the carriage element's world affine matrix with state displacements, then decomposes translation, normalized rotation and scale. Finite representable world TRS is the premise, checked numerically by staged validation; this shape cannot preserve arbitrary affine shear.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Pairs the pose with the carriage id, element, staged node id and served space, so a shot places the car and names its floor from one record; it parallels the opening panel placement and adds only `serves`, which a panel has no counterpart for.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A member without the named state, or without an entry in it, stands at rest rather than being interpolated or guessed, and `serves` is null for a counterweight or a missing entry rather than a defaulted space.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer and order, the default state, how the pose composes displacements down the hierarchy, the rest fallback, the node id format, the world units of the pose, and both meanings of a null `serves`.
