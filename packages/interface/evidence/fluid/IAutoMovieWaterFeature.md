# src/fluid/IAutoMovieWaterFeature.ts#IAutoMovieWaterFeature

## @evidence contracts/development/design.md#principled-representation `validateWaterFeatures` resolves the space and rim through id maps of the cited building, re-paths the domain's own `validateFluidDomain` violations, and tests lattice cell centres with `builtEnvironmentContainsPoint`, where corner cells suffice for a convex basin because a rectangle lies inside a convex region exactly when its corners do.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The binding holds only ids, a label, a mode and a material, so neither the architecture record nor the fluid domain knows about the other and this record is the single place their agreement is checked.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A basin that states no volume and a domain that already failed its own validation are skipped by the containment test on stated grounds rather than given an invented extent; feature ids are compared only within one building, and when two features bind one domain the render subject takes the owner and material of the one whose id sorts first.

## @evidence contracts/development/common.md#meaningful-documentation

States which half the building owns, that geometry is never restated, how the builder groups features for the validator, every refusal with the corner-or-every-cell rule, and per member the id scope, the rim conditions, the mode effects and what a `null` material means.
