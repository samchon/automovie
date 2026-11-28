# src/schema/IAutoMovieHumanFingerPoseSchema.ts#IAutoMovieHumanFingerPoseSchema

## @evidence contracts/development/common.md#meaningful-documentation

The description identifies each of the three joints and records the signed base-joint spread convention, including the middle finger's direction.

## @evidence contracts/development/design.md#principled-representation

Typia uses [0, 80] degrees for base flexion, [-20, 20] for base abduction, [0, 90] for middle flexion and [0, 65] for distal flexion. The Human table expands these four channels for each named finger.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The hand record reuses the four-field shape for index, middle, ring and little finger. The thumb keeps its own channels.
