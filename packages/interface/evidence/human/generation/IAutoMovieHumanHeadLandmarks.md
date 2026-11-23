# src/human/generation/IAutoMovieHumanHeadLandmarks.ts#IAutoMovieHumanHeadLandmarks

## @evidence contracts/development/design.md#principled-representation

Shared named datums supply original head and regional sources; LS/LI chords remain independent of section bulk priors. `glabella`: Glabella. `nasion`: Nasion. `pronasale`: Pronasale.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One fixed landmark record replaces independently recomputed border locations. Also types AutoMovieHumanHeadVault.m, AutoMovieHumanHeadInnerParts.m.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record claims neither individual clinical peaks nor final realized skin positions. Required fields are `glabella`, `nasion`, `pronasale`, `subnasale`, `stomion`, `labraleSuperius`, `labraleInferius`, `pogonion`, `menton`, `gnathion`, `tragion`, `zygion`, `frontal`, `gonion`, `occiput`; callers supply the complete record.

## @evidence contracts/development/common.md#meaningful-documentation

Every field identifies its anatomical site and the tuple's calibration units. Points of the midline and beside it, `[x, y]`, calibration millimetres.

# src/human/generation/IAutoMovieHumanHeadLandmarks.ts#IAutoMovieHumanHeadLandmarks.P2

## @evidence contracts/development/common.md#meaningful-documentation

A point of a section.

## @evidence contracts/development/design.md#principled-representation

A point of a section. Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanHeadLandmarks.P2 belongs to IAutoMovieHumanHeadLandmarks; its public declaration is reached by the Human main-entry export closure.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A point of a section. Its exported identity is retained for the existing Human public surface.
