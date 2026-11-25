# src/human/generation/IAutoMovieHumanBreastFootprint.ts#IAutoMovieHumanBreastFootprint.IFootprint

## @evidence contracts/development/common.md#meaningful-documentation

The footprint.

## @evidence contracts/development/design.md#principled-representation `half`: Lateral half width, mm. `lower`: Reach below the bust point, mm: its height over the fold. `upper`: Reach above it, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanBreastFootprint.create. Also types AutoMovieHumanBreastDome.f.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `half`, `lower`, `upper`, `rho`; callers supply the complete record.
