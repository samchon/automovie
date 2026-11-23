# src/recovery/IAutoMovieRecoveryCameraMapInput.ts#IAutoMovieRecoveryCameraMapInput

## @evidence contracts/development/design.md#principled-representation

A common rigid scene and corrected pinhole charts define calibrated seed/resection geometry. Automatic feature identities provide tentative tracks, while independent point and reprojection gates qualify fitting evidence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Shared view and pair policies keep existing semantics; map policy and budgets own new reprojection, track and joint-optimization work. Exactly three views delimit the first supported registration loop.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No manual correspondence, source mesh, truth pose, metric scale, inferred calibration or invisible-region completion enters the contract.

## @evidence contracts/development/common.md#meaningful-documentation

States borrowed RGB lifetime, explicit seed ordering, three-view support, known calibration, unknown physical scale and separate seed versus map budgets.
