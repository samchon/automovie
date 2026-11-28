# src/recovery/IAutoMovieRecoveryEpipolarConsensusFittingOperation.ts#IAutoMovieRecoveryEpipolarConsensusFittingOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

The result keeps the current calibrated pixel model, original match indices, support-dependent sampling progress and final optimizer diagnostics.

## @evidence contracts/development/design.md#principled-representation

Original-design initialization, essential projection and explicit support scoring determine each candidate. The search tracks proposal count independently of local and final refit work.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The consensus owner selects and reports epipolar support. Pair qualification subsequently checks branch uniqueness, pixel reprojection and planar competition.
