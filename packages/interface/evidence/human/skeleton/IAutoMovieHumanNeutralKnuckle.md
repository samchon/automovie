# src/human/skeleton/IAutoMovieHumanNeutralKnuckle.ts#IAutoMovieHumanNeutralKnuckle.IFinger

## @evidence contracts/development/common.md#meaningful-documentation

One finger's skin as the spread reads it.

## @evidence contracts/development/design.md#principled-representation `knuckle`: The knuckle, the proximal phalanx's joint, at the bind, mm. `depths`: Depth of each shaft ring's centre from the knuckle, mm, increasing: the rings past the root ring, where the finger's skin leaves the palm's, and before the pulp's two closing rings. `radii`: Each shaft ring's largest radius about its centre, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanNeutralKnuckle.read. Read by AutoMovieHumanNeutralKnuckle.radiusAt. Also types AutoMovieHumanNeutralKnuckle.fingers, AutoMovieHumanNeutralKnuckle.read4.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `knuckle`, `depths`, `radii`; callers supply the complete record.
