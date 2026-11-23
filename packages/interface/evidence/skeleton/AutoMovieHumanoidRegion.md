# src/skeleton/AutoMovieHumanoidRegion.ts#AutoMovieHumanoidRegion

## @evidence contracts/development/common.md#meaningful-documentation

States the anatomical source of the names, the side convention, the anchoring to bones and the additive growth rule.

## @evidence contracts/development/design.md#principled-representation

Surface-anatomy regions, each anchored to one humanoid bone, so a name means the same place on any rig.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Names only; the point and normal are resolved by the engine from each body's collision shapes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A closed union that grows additively and never repurposes a name, instead of free strings.
