# src/recovery/computation/IAutoMovieRecoverySceneTrackTriangulationOperation.ts#IAutoMovieRecoverySceneTrackTriangulationOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

Triangulate one new track using only already registered camera observations. The original 2k-by-4 homogeneous design uses calibrated world-to-camera rows;

## @evidence contracts/development/design.md#principled-representation

Triangulate one new track using only already registered camera observations. The original 2k-by-4 homogeneous design uses calibrated world-to-camera rows;

## @evidence contracts/development/design.md#minimal-and-owned-surface

growRecoverySceneLandmarks, triangulateRecoverySceneTrack share IAutoMovieRecoverySceneTrackTriangulationOperation's canonical records; the referenced quantities retain one declaration owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
