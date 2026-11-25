# src/human/generation/IAutoMovieHumanHeadBackProfile.ts#IAutoMovieHumanHeadBackProfile.IProfile

## @evidence contracts/development/common.md#meaningful-documentation

The profile's owners, calibration millimetres; x forward, y up.

## @evidence contracts/development/design.md#principled-representation `centre`: Retained cranial axis's forward place; not necessarily the g/op midpoint. `reach`: Posterior reach behind the axis at the template's reference height. `occiput`: Retained horizontal-tangent reference height, distinct from the maximizing g-to-posterior caliper point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanHeadVault.backProfile. Read by AutoMovieHumanHeadBackProfile.at. Also types AutoMovieHumanHeadVault.ring, AutoMovieHumanHeadMassSource.profile.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `centre`, `reach`, `occiput`, `vertex`, `ring`; callers supply the complete record.
