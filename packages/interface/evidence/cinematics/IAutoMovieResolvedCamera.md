# src/cinematics/IAutoMovieResolvedCamera.ts#IAutoMovieResolvedCamera

## @evidence contracts/development/design.md#principled-representation

A rigid placement is a translation plus a unit quaternion, and the readers invert the rotation to bring a world point into the camera frame; the camera clip's quaternion keys are taken as sampled, so the record carries the clip's own interpolation result.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two fields, the extrinsics only, because field of view, aspect and clip planes belong to the staged camera and the readers take them as separate arguments; `IAutoMovieGrammarCameraObservation` extends it with the intrinsics a cut needs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A clip missing a track falls back to that component of the staged base rather than to an identity or the previous frame, and no reader special-cases a camera id.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer and its per-track fallback, the consumers, the viewing axis and up convention, and for each field its space and units.
