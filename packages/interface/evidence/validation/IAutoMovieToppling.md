# src/validation/IAutoMovieToppling.ts#IAutoMovieToppling

## @evidence contracts/development/design.md#principled-representation

detectSupportToppling chooses the nearest support edge, normalizes its horizontal center-to-edge offset and reports excess distance beyond the authored support margin.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The advice carries explicit geometric quantities rather than hiding pivot choice in a generated animation or physics state.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The pivot comes from supplied point support, not a proven solid contact surface; dynamic stability and application of the suggestion remain outside this record.

## @evidence contracts/development/common.md#meaningful-documentation

Defines metre overshoot, borrowed edge endpoints and unit XZ direction with Y zero; the producer's finite geometry premises apply.
