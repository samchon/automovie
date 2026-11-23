# src/human/generation/IAutoMovieHumanEyeSeat.ts#IAutoMovieHumanEyeSeat

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the spherical seating geometry shared by eyelids and body apertures, and distinguishes it from the appearance eye's geometry.

## @evidence contracts/development/design.md#principled-representation `side`: Anatomical side: left is +Z. `centre`: Globe centre in mm. `radius`: Globe radius in mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanBodyApertures.prepare, AutoMovieHumanEyelid.create, AutoMovieHumanEyelid.seat. Also types AutoMovieHumanBodyApertures.globe, AutoMovieHumanSkeletonLaw.eyes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `side`, `centre`, `radius`; callers supply the complete record.
