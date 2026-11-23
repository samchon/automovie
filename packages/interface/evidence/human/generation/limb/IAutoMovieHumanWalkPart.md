# src/human/generation/limb/IAutoMovieHumanWalkPart.ts#IAutoMovieHumanWalkPart.ISource

## @evidence contracts/development/common.md#meaningful-documentation

The identical pre-loft declaration and its authoritative course mapping.

## @evidence contracts/development/design.md#principled-representation `input`: Actual input later consumed by SiteViewPart.create, calibration mm. `runs`: Straight-run bounds computed from the canonical metre axis. `station`: Actual source station of a bone/share; no second axis is constructed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanLegWalk.source, AutoMovieHumanWalkPart.source. Also types AutoMovieHumanArmFrame.source, AutoMovieHumanArmWalk.source.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `input`, `runs`, `station`; callers supply the complete record.

# src/human/generation/limb/IAutoMovieHumanWalkPart.ts#IAutoMovieHumanWalkPart.ISite

## @evidence contracts/development/common.md#meaningful-documentation

One site on a bone.

## @evidence contracts/development/design.md#principled-representation `site`: The measurement site, named in diagnostics. `bone`: The bone, 0 the first (proximal). `share`: Share of that bone from its proximal centre, in `[0, 1]`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanWalkPart.engineJets. Also types AutoMovieHumanLegWalk.sites, AutoMovieHumanDigitWalk.site.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `jets`: Optional normalized-parameter edge jets, in the same chart as edges.

# src/human/generation/limb/IAutoMovieHumanWalkPart.ts#IAutoMovieHumanWalkPart.IInput

## @evidence contracts/development/common.md#meaningful-documentation

What a walk part is built from.

## @evidence contracts/development/design.md#principled-representation `name`: Chain name. `centres`: The joint centres, proximal first, at least two (one bone). `joints`: Each interior joint's turn half arclength, mm; distinct from its bend radius.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanWalkPart.create, AutoMovieHumanWalkPart.source, AutoMovieHumanWalkPart.engineRanges.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `ranges`: Optional scalar closed-span bounds in the caller's chart; these impose no moving world-plane constraint. `roll`: Optional material-frame transition between actual bone/share positions; signed up is projected into the endpoint's normal plane by the engine. `base`: Whether the walk closes at its first centre in a G2 dome: the base of a part whose inner end lies inside its host (a limb in the trunk, a digit in the palm), so its station lines start inside the host at every phase and leave it once, as the merge's trace needs. `tip`: The tip's distance past the last centre, mm (zero closes at the last centre itself), where the walk closes in a dome; absent, the distal end is open.
