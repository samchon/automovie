# src/human/generation/IAutoMovieHumanTrunkFeature.ts#IAutoMovieHumanTrunkFeature

## @evidence contracts/development/common.md#meaningful-documentation

A trunk feature built in its own frame: the breast, the gluteal mass, the umbilicus or the spinal furrow as a height over its footprint, ready to be merged with the trunk by a relief window (`AutoMovieHumanTrunkReliefNet`).

## @evidence contracts/development/design.md#principled-representation `frame`: The feature's own frame. `height`: The height at a point of the frame's plane. `reach`: The footprint's extents in the frame's plane: `u` from the first to the second, `v` likewise, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanBreastDome.create, AutoMovieHumanGlutealDome.create, AutoMovieHumanScapularMass.feature. Read by AutoMovieHumanBreastDome.surface, AutoMovieHumanTrunkReliefNet.fromFeature. Also types AutoMovieHumanBreastRelief.dome, AutoMovieHumanGlutealRelief.dome.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `frame`, `height`, `reach`, `apex`; callers supply the complete record.
