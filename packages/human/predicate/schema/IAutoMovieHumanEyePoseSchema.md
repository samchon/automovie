# src/schema/IAutoMovieHumanEyePoseSchema.ts#IAutoMovieHumanEyePoseSchema

## @evidence contracts/development/common.md#meaningful-documentation

The vertical and horizontal channels both retain signed directions from the person's perspective, with separate ranges.

## @evidence contracts/development/design.md#principled-representation

Typia bounds vertical gaze to [-30, 30] degrees and horizontal gaze to [-45, 45]. The Human channel table maps them to eye flexion and twist. It marks horizontal direction shared across sides, so expansion reflects the right-side sign.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The head schema reuses this same record for each eye. Iris appearance belongs to the pigmentation record.
