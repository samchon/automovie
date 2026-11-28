# src/recovery/IAutoMovieRecoveryMapObservation.ts#IAutoMovieRecoveryMapObservation

## @evidence contracts/development/common.md#meaningful-documentation

The observation ties a pixel center to a camera and an extracted feature. Its camera index follows the enclosing population.

## @evidence contracts/development/design.md#principled-representation

Track linkage copies pixel positions from the detector. Scene closure maps the same measurements to compact active indices for fitting and back to source indices for published checkpoints.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The record owns the two-coordinate measurement and feature identity. Registration and geometric qualification belong to its track, landmark or fitted result.

# src/recovery/IAutoMovieRecoveryMapObservation.ts#IAutoMovieRecoveryMapObservation.viewIndex

## @evidence contracts/development/common.md#meaningful-documentation

Published scene results use source indices. A joint fit temporarily uses the active view mapping from its trace.

# src/recovery/IAutoMovieRecoveryMapObservation.ts#IAutoMovieRecoveryMapObservation.featureIndex

## @evidence contracts/development/common.md#meaningful-documentation

Track linkage derives the local index by subtracting the view offset from the linked feature node.

# src/recovery/IAutoMovieRecoveryMapObservation.ts#IAutoMovieRecoveryMapObservation.pixel

## @evidence contracts/development/common.md#meaningful-documentation

The linker copies the detector location in the original pixel chart after mapping the detector's pyramid level back to source coordinates.
