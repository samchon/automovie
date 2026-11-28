# src/recovery/IAutoMovieRecoverySceneQueue.ts#IAutoMovieRecoverySceneQueue

## @evidence contracts/development/common.md#meaningful-documentation

The record identifies the source and the 3D-to-2D candidates used to decide queue order.

## @evidence contracts/development/design.md#principled-representation

The builder obtains candidate support from retained landmarks, filters insufficient counts and sorts by descending support, then by stable source ID.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The queue owns candidate order for one revision. The resection stage measures its own geometric inliers and can refuse the pending camera.

# src/recovery/IAutoMovieRecoverySceneQueue.ts#IAutoMovieRecoverySceneQueue.view

## @evidence contracts/development/common.md#meaningful-documentation

The builder selects this index from the unregistered source set and uses its chart for the transaction.

# src/recovery/IAutoMovieRecoverySceneQueue.ts#IAutoMovieRecoverySceneQueue.candidates

## @evidence contracts/development/common.md#meaningful-documentation

Support comes from global linked measurements of already accepted points. Resection decides which offered pairs fit the proposed pose.
