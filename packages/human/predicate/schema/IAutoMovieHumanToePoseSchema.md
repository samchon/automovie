# src/schema/IAutoMovieHumanToePoseSchema.ts#IAutoMovieHumanToePoseSchema

## @evidence contracts/development/common.md#meaningful-documentation

The declaration identifies the three joints and their angles. Base abduction is measured from the second-toe line, with the second toe's positive direction toward the fifth.

## @evidence contracts/development/design.md#principled-representation

Typia bounds base flexion to [-40, 40] degrees, base abduction to [-10, 10], middle flexion to [0, 35] and distal flexion to [0, 60]. Human expands those four rows for each lesser toe.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The foot schema reuses the same record for toes two through five. The hallux keeps its separate joint layout and ranges.
