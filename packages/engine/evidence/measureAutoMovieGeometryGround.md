# src/measureAutoMovieGeometryGround.ts#measureAutoMovieGeometryGround

## @evidence contracts/development/implementation.md#principled-implementation

Uses readAutoMovieGeometryGround so surface precedence and interpolated terrain height agree with formation-ground checks and engine placement.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The query adapter converts the shared ground sample to the public ground result without duplicating containment or height rules.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No surface yields zero, null and false together; no walkable terrain is invented when the world is absent.

## @evidence contracts/development/common.md#meaningful-documentation

States units, terrain fields and off-world meaning.

## @evidence contracts/development/implementation.md#efficient-algorithms

The delegated first-containing-surface scan dominates cost; packaging three fields takes constant work and space.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The helper reads the supplied current world every call, so terrain edits require no hidden cache invalidation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only scalar sample fields are returned; no world records, handles or tasks are retained.
