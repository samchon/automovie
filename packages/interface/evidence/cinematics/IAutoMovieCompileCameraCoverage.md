# src/cinematics/IAutoMovieCompileCameraCoverage.ts#IAutoMovieCompileCameraCoverage

## @evidence contracts/development/design.md#principled-representation

One staged camera, clip identity, ordered nonoverlapping intent entries and shot duration in seconds describe a coverage take; aspect is width divided by height and the frame rate an exact rational.

## @evidence contracts/development/design.md#minimal-and-owned-surface

compileCameraCoverage passes the same inputs to compileCameraMove and publishes the entries' intent records; existing camera, coverage-entry and production frame-rate contracts own their fields.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The caller supplies sorted nonoverlapping entries; empty entries mean a locked-off take, and move/framing refusals propagate.

## @evidence contracts/development/common.md#meaningful-documentation

Documents seconds, aspect, frame rate, camera placement, entry order, empty take and failure behavior.

# src/cinematics/IAutoMovieCompileCameraCoverage.ts#IAutoMovieCompileCameraCoverage.IProps

## @evidence contracts/development/design.md#principled-representation

One staged camera, clip identity, ordered nonoverlapping intent entries and shot duration in seconds describe a coverage take; aspect is width divided by height and the frame rate an exact rational.

## @evidence contracts/development/design.md#minimal-and-owned-surface

compileCameraCoverage passes the same inputs to compileCameraMove and publishes the entries' intent records; existing camera, coverage-entry and production frame-rate contracts own their fields.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The caller supplies sorted nonoverlapping entries; empty entries mean a locked-off take, and move/framing refusals propagate.

## @evidence contracts/development/common.md#meaningful-documentation

Documents seconds, aspect, frame rate, camera placement, entry order, empty take and failure behavior.
