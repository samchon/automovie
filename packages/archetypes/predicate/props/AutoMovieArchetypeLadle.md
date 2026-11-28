# src/props/AutoMovieArchetypeLadle.ts#AutoMovieArchetypeLadle.create

## @evidence contracts/development/common.md#meaningful-documentation

The simple rounded bowl supplies a working `face` toward `+Z`. The precision `grip` faces `-Z` near the bowl end of the shaft.

## @evidence contracts/development/implementation.md#principled-implementation

The rounded bowl begins where the handle ends and reaches the total length. Its working frame lies on the positive-Z surface.

## @evidence contracts/development/implementation.md#efficient-algorithms

Draws one record and builds a shaft, rounded bowl and two frames.

# src/props/AutoMovieArchetypeLadle.ts#AutoMovieArchetypeLadle.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Precision handle `grip` and positive-Z bowl `face`.

## @evidence contracts/development/design.md#principled-representation

The pinch uses the shaft dimensions and the bowl site lies at the visible work region.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the hold and work contact needed to stage the ladle are exposed.

# src/props/AutoMovieArchetypeLadle.ts#AutoMovieArchetypeLadle.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Overall length along Y, bowl diameter and grip diameter in metres. Mass is in kilograms.

## @evidence contracts/development/design.md#principled-representation

Bowl diameter occupies the end of the overall length. Handle diameter sets the pinch, and mass covers the assembled prop.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Records just the four measurable size and mass quantities used in this model.
