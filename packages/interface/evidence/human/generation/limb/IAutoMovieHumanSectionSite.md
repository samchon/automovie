# src/human/generation/limb/IAutoMovieHumanSectionSite.ts#IAutoMovieHumanSectionSite

## @evidence contracts/development/common.md#meaningful-documentation

One site's knots.

## @evidence contracts/development/design.md#principled-representation `site`: The measurement site, such as `stylion` or `waist`, named in diagnostics. `station`: Station along the part's axis, mm. `edges`: The box's edges `[+u, +v, -u, -v]` as signed chart coordinates relative to the axis, mm: the first two above zero, the last two below.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanWalkPart.engineJets. Read by AutoMovieHumanMassPart.radialJets, sameQuarters. Also types AutoMovieHumanArmHandControls.wrist, AutoMovieHumanArmWalk.wrist.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `jets`: Optional four edge jets in the whole source's normalized parameter, each with its edge value's units.
