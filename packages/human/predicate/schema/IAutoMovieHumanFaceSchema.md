# src/schema/IAutoMovieHumanFaceSchema.ts#IAutoMovieHumanFaceSchema

## @evidence contracts/development/common.md#meaningful-documentation

The description identifies the bilateral eye openings and the independent intercanthal measurement, with nose and closed-mouth inputs named separately.

## @evidence contracts/development/design.md#principled-representation

The eye pair preserves the two sides. Typia bounds the Euclidean inner-corner separation to [10, 60] millimetres and validates nose, mouth and each eye through their own refinements.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The head schema consumes the resting face shape and delegates measurement detail to the shared eye, nose and mouth aliases. Eye and jaw pose use separate input records.
