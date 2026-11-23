# src/production/IAutoMovieGeometryMeasurementInput.ts#IAutoMovieGeometryMeasurementInput

## @evidence contracts/development/design.md#principled-representation

Uses the same discriminated query and compiled shot records as the production oracle, with nullable production/world/timeline states explicitly represented instead of invented records.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One structural input holds just the world, formation, shot and frame-format fields the eight query branches read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Null world permits off-world ground answers; formation and camera queries separately require production format and film-time requires a timeline, without synthesized defaults for those dependencies.

## @evidence contracts/development/common.md#meaningful-documentation

Documents borrowed current records, id-keyed maps and the meanings of absent design and timeline snapshots.
