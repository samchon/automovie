# src/motion/composition/IAutoMovieSchedule.ts#IAutoMovieSchedule

## @evidence contracts/development/common.md#meaningful-documentation

States chronological ordering, film origin and the exact shallow-freezing boundary.

## @evidence contracts/development/design.md#principled-representation

Entries sort by start then walk index; duration is the latest nonnegative cursor/end. Nested producer objects remain shared and are not deep-frozen.

## @evidence contracts/development/design.md#minimal-and-owned-surface

resolveAutoMovieSchedule produces this canonical schedule for measurement, rendering and subsequent production logic.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Readonly references describe publication without asserting immutability of unknown state or authored intents.
