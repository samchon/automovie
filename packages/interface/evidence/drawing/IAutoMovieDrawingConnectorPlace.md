# src/drawing/IAutoMovieDrawingConnectorPlace.ts#IAutoMovieDrawingConnectorPlace

## @evidence contracts/development/design.md#principled-representation `deriveAutoMovieDrawingSchedule` collects `from`, the landing spaces and `to` into a set, sorts it, and resolves each stop with `builtEnvironmentBuildingOfSpace`, answering a unit only when exactly one distinct unit remains.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The place is one arm of the schedule's place union, discriminated by `kind`, and holds only the stop list and the derived unit, so a connector row needs no geometry to say where it is.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A run between two units answers `null` instead of picking the first unit found, and no stop is inferred from the route's geometry.

## @evidence contracts/development/common.md#meaningful-documentation

States which declarations become stops, their order and deduplication, the exact-match rule, and when `building` is null.
