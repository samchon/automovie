# src/human/generation/limb/IAutoMovieHumanSectionSource.ts#IAutoMovieHumanSectionSource

## @evidence contracts/development/common.md#meaningful-documentation

What a part is built from.

## @evidence contracts/development/design.md#principled-representation `name`: Chain name of the part. `axis`: The part's axis as the construction tree's record, metres; the operator's frame is the engine's own reading of it (`AutoMovieConstructionViews.frame`), so the part lofted here is the part the tree realizes. `sites`: The sites by strictly rising station, at least two besides a pole.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanFootPart.source, AutoMovieHumanMassPart.radialJets, AutoMovieHumanWalkPart.engineRanges. Read by AutoMovieHumanArmBreadth.maximum, AutoMovieHumanArmBreadth.fit, AutoMovieHumanSiteControls.prepare. Also types AutoMovieHumanArmBreadth.pole, AutoMovieHumanArmWalk.connected.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `pole`: Closing points where every edge meets the axis, below the first site (`bottom`), above the last (`top`), or both. `poleJets`: Optional closing-knot jets, in the whole source's normalized root/angle parameter and edge-value units. `fullnessPoleJets`: Optional direct-fullness jets at the same physical end knots; normalization uses the fullness outline's whole station span. `departures`: Sourced departures of each quarter's shoulder, knots by station; absent means none. `fullnessRange`: Optional sufficient native-shoulder hull, authored before any connection copies its actual C2 jets. `ranges`: Optional sufficient scalar bounds for the four closed edge spans; these do not impose a moving world-plane constraint. `parameter`: Explicit original scalar coordinate shared by a local region and its host; closure remains separately declared by pole.
