# src/cinematics/IAutoMoviePracticalSurfaceTrack.ts#IAutoMoviePracticalSurfaceTrack

## @evidence contracts/development/common.md#meaningful-documentation

States the target frame, time units and bounds, the required opening key and when a key takes effect.

## @evidence contracts/development/design.md#principled-representation

Scene node and model-scoped part identify one instance surface; strictly increasing shot-local times select fixed material ids by last applicable key.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The track owns timing and identity only. Geometry, appearance and bytes remain on the existing model and asset records.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The performance gate requires a registered generated rigid prop and registered material ids, with no implicit first key, interpolation or executable content.
