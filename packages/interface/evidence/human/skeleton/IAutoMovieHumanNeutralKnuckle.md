# src/human/skeleton/IAutoMovieHumanNeutralKnuckle.ts#IAutoMovieHumanNeutralKnuckle

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanNeutralKnuckle exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups IFinger. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanNeutralKnuckle; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the IFinger contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/skeleton/IAutoMovieHumanNeutralKnuckle.ts#IAutoMovieHumanNeutralKnuckle.IFinger

## @evidence contracts/development/common.md#meaningful-documentation

One finger's skin as the spread reads it.

## @evidence contracts/development/design.md#principled-representation `knuckle`: The knuckle, the proximal phalanx's joint, at the bind, mm. `depths`: Depth of each shaft ring's centre from the knuckle, mm, increasing: the rings past the root ring, where the finger's skin leaves the palm's, and before the pulp's two closing rings. `radii`: Each shaft ring's largest radius about its centre, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanNeutralKnuckle.read. Read by AutoMovieHumanNeutralKnuckle.radiusAt. Also types AutoMovieHumanNeutralKnuckle.fingers, AutoMovieHumanNeutralKnuckle.read4.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `knuckle`, `depths`, `radii`; callers supply the complete record.
