# src/pose/IAutoMovieHumanoidSurfaceReader.ts#IAutoMovieHumanoidSurfaceReader

## @evidence contracts/development/design.md#principled-representation

Each callback distinguishes a rig-world point or direction from a bone-local surface frame; bone identity uses the canonical closed humanoid vocabulary.

## @evidence contracts/development/design.md#minimal-and-owned-surface

resolveAutoMovieHumanoidSurfaces, AutoMovieHumanoidDigitSurfaces and AutoMovieHumanoidSurfaceExtents share these six readers over the same rest pose and profile.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing bones, missing profile segments and missed rays remain failures of their reader; no inferred frame, surrogate collider or zero-valued fallback is promised.

## @evidence contracts/development/common.md#meaningful-documentation

States retained ownership, metre frames, normalization, optional orientation and the exact missing-data behavior of each callback.
