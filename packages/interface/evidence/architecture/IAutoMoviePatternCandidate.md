# src/architecture/IAutoMoviePatternCandidate.ts#IAutoMoviePatternCandidate

## @evidence contracts/development/design.md#principled-representation

A module is a rectangle given by centre, size and in-plane rotation, so its four corners are `±size / 2` turned by `rotationDeg` about `center`, the representation the clipper, reach check and instancer all derive from.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Holds only what a generator decides per module, identity, placement, footprint, grain and flip, while clipping, cut state and variant are derived by the run.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `mirror` changes no footprint or instance slot and is visible only through the texture transform, and a mirrored pair is not a grain break; the run applies these rules to every candidate alike.

## @evidence contracts/development/common.md#meaningful-documentation

States who forms the corners and every refusal on a candidate, the metre and degree units, that `size.u` need not be the longer side, the rotation direction, the grain's modulo-180 reading, and what book-matching means for `mirror`.
