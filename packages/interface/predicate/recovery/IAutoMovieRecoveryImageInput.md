# src/recovery/IAutoMovieRecoveryImageInput.ts#IAutoMovieRecoveryImageInput

## @evidence contracts/development/common.md#meaningful-documentation

The input declares the object, metric frame and acquisition cohort shared by every view. Before raster work, Recovery checks these labels, the background rule, unique view IDs, chart values, byte counts and safe budgets.

## @evidence contracts/development/design.md#principled-representation

Every view carries its own calibrated pixel chart under the parent object's fixed-frame assertion. The observer projects columns along cos(azimuth) X + sin(azimuth) Z and rows along negative Y. Tests use an explicit geometry whose rounded occupied row centers and cell bounds can be checked independently.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The request owns the acquisition policy and common object identity, and borrows resident pixels for the call. The scaffold host loads and verifies image bytes before constructing it. The returned support observation carries its own metadata and rows.

# src/recovery/IAutoMovieRecoveryImageInput.ts#IAutoMovieRecoveryImageInput.objectId

## @evidence contracts/development/common.md#meaningful-documentation

The observer checks trimmed presence before scanning, and the completed observation copies the same identifier.

# src/recovery/IAutoMovieRecoveryImageInput.ts#IAutoMovieRecoveryImageInput.rigidity

## @evidence contracts/development/common.md#meaningful-documentation

The only admitted tag is asserted-fixed. The resident observer checks the tag before reading pixels.

# src/recovery/IAutoMovieRecoveryImageInput.ts#IAutoMovieRecoveryImageInput.cohort

## @evidence contracts/development/common.md#meaningful-documentation

Recovery validates the three declared categories and copies the chosen category to the observation. Fitting rechecks it before consuming rows.

# src/recovery/IAutoMovieRecoveryImageInput.ts#IAutoMovieRecoveryImageInput.frame

## @evidence contracts/development/common.md#meaningful-documentation

The capture requires this identity for all views. Camera azimuth and pixel-pitch values already refer to that frame.

# src/recovery/IAutoMovieRecoveryImageInput.ts#IAutoMovieRecoveryImageInput.background

## @evidence contracts/development/common.md#meaningful-documentation

One three-channel lookup works for all views. The threshold-equality fixture exercises this shared rule.

# src/recovery/IAutoMovieRecoveryImageInput.ts#IAutoMovieRecoveryImageInput.views

## @evidence contracts/development/common.md#meaningful-documentation

The observer processes the supplied order and retains that order in its output. Each source buffer is borrowed until the synchronous call returns.

# src/recovery/IAutoMovieRecoveryImageInput.ts#IAutoMovieRecoveryImageInput.budget

## @evidence contracts/development/common.md#meaningful-documentation

Configured bounds are admitted before scans. Pixel and view counts are checked before reading bytes, and newly occupied rows are charged during scanning.
