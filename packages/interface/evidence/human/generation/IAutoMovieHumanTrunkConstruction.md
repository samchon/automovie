# src/human/generation/IAutoMovieHumanTrunkConstruction.ts#IAutoMovieHumanTrunkConstruction.IPlacement

## @evidence contracts/development/common.md#meaningful-documentation

One actual solve and its placement metadata, before legacy chains are requested.

## @evidence contracts/development/design.md#principled-representation `solution`: Same solved trunk used by placement and the current body original builders. `calibration`: Existing neck, landmarks and diagnostics; no legacy trunk chains are added.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanTrunkConstruction.prepare. Read by AutoMovieHumanTrunkConstruction.loft.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `solution`, `calibration`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanTrunkConstruction.ts#IAutoMovieHumanTrunkConstruction.IPrepareOriginal

## @evidence contracts/development/common.md#meaningful-documentation

Prepare the same solve and metadata without constructing legacy chains.

## @evidence contracts/development/design.md#principled-representation `seat`: Previously prepared neck seat shared with the trunk's upper support. `raw`: Explicitly request the original neck chain; no geometry is requested until this callback is called.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanTrunkConstruction.IPrepareOriginal is the canonical exchange used by AutoMovieHumanTrunkConstruction.prepare.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `seat`, `raw`; callers supply the complete record.
