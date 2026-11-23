# src/render/delivery/IAutoMovieProductionVideoProfile.ts#IAutoMovieProductionVideoProfile

## @evidence contracts/development/design.md#principled-representation

The profile states facts in the MP4 file's own terms, such as ISO brands, the 16.16 and 2.30 fixed-point track matrix and ITU-T H.273 color code points, so the checker compares them directly with the probe without unit conversion.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the facts the checker needs from the author are variable, and container and codec identity stay inside the checker because no profile may differ there.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The literal color code points and brand are the sRGB and ISO base media identities the normalizer writes, shared through `AUTOMOVIE_MP4_SRGB_COLOUR` and the unity matrix constant, not values picked for a test file.

## @evidence contracts/development/common.md#meaningful-documentation

The prose names producer and checker and which fields vary; each member gives its unit, fixed-point form or code-point meaning.
