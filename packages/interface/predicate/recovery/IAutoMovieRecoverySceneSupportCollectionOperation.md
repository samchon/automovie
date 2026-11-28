# src/recovery/IAutoMovieRecoverySceneSupportCollectionOperation.ts#IAutoMovieRecoverySceneSupportCollectionOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

The signature states which accepted landmark and linked track populations are required and how the source-order lists are indexed.

## @evidence contracts/development/design.md#principled-representation

Each accepted point provides one original measurement per view in its track. The result pairs a retained landmark index with that measurement.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The collector owns source-indexed support lists. Resection owns pose fitting and qualification, and the scene recomputes support after an accepted revision.
