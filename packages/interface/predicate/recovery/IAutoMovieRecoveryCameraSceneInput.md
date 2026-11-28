# src/recovery/IAutoMovieRecoveryCameraSceneInput.ts#IAutoMovieRecoveryCameraSceneInput

## @evidence contracts/development/common.md#meaningful-documentation

The input identifies a variable camera schedule, independent seed controls, and hard scene limits. It requires distinct supplied view identities and conserves source order.

## @evidence contracts/development/design.md#principled-representation

The inherited map controls define the common point and resection operating point. The scene owns a variable ordered view list and its additional work limits. Views after the initial pair enter a candidate queue from existing-map support.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The caller supplies calibrated metadata and stable rasters. Recovery extracts features, checks global conflicts, and chooses registration attempts using current support and stable source IDs.

# src/recovery/IAutoMovieRecoveryCameraSceneInput.ts#IAutoMovieRecoveryCameraSceneInput.schema

## @evidence contracts/development/common.md#meaningful-documentation

Scene admission requires the exact resident tag before checking calibration or image work.

# src/recovery/IAutoMovieRecoveryCameraSceneInput.ts#IAutoMovieRecoveryCameraSceneInput.views

## @evidence contracts/development/common.md#meaningful-documentation

Source order assigns the seed and indexes every returned pose and source record. Admission checks metadata, exact RGB8 population and uniqueness across the full set.

# src/recovery/IAutoMovieRecoveryCameraSceneInput.ts#IAutoMovieRecoveryCameraSceneInput.budget

## @evidence contracts/development/common.md#meaningful-documentation

Admission checks positive safe ceilings. The coordinator charges repeated attempts and fits and limits retained numerical storage during population growth.
