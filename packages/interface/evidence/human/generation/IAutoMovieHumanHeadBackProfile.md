# src/human/generation/IAutoMovieHumanHeadBackProfile.ts#IAutoMovieHumanHeadBackProfile

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanHeadBackProfile exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups IProfile. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanHeadBackProfile; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the IProfile contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/IAutoMovieHumanHeadBackProfile.ts#IAutoMovieHumanHeadBackProfile.IProfile

## @evidence contracts/development/common.md#meaningful-documentation

The profile's owners, calibration millimetres; x forward, y up.

## @evidence contracts/development/design.md#principled-representation `centre`: Retained cranial axis's forward place; not necessarily the g/op midpoint. `reach`: Posterior reach behind the axis at the template's reference height. `occiput`: Retained horizontal-tangent reference height, distinct from the maximizing g-to-posterior caliper point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanHeadVault.backProfile. Read by AutoMovieHumanHeadBackProfile.at. Also types AutoMovieHumanHeadVault.ring, AutoMovieHumanHeadMassSource.profile.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `centre`, `reach`, `occiput`, `vertex`, `ring`; callers supply the complete record.
