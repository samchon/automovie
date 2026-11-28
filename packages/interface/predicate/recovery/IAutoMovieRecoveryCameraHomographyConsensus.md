# src/recovery/IAutoMovieRecoveryCameraHomographyConsensus.ts#IAutoMovieRecoveryCameraHomographyConsensus

## @evidence contracts/development/common.md#meaningful-documentation

The report names the tested population, observed support, forbidden threshold and conditional sampling work.

## @evidence contracts/development/design.md#principled-representation

Four-point proposals and symmetric transfer residuals give support inside a fixed population. Meeting the conditional search target and directly observing forbidden overlap are separate results.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This report describes planar competition only. The enclosing camera estimate combines it with calibrated epipolar and pose qualifications.

# src/recovery/IAutoMovieRecoveryCameraHomographyConsensus.ts#IAutoMovieRecoveryCameraHomographyConsensus.population

## @evidence contracts/development/common.md#meaningful-documentation

The camera estimator passes only the chosen epipolar inlier points to the planar search.

# src/recovery/IAutoMovieRecoveryCameraHomographyConsensus.ts#IAutoMovieRecoveryCameraHomographyConsensus.support

## @evidence contracts/development/common.md#meaningful-documentation

The best model is chosen by support count and then median transfer distance within the fixed population.

# src/recovery/IAutoMovieRecoveryCameraHomographyConsensus.ts#IAutoMovieRecoveryCameraHomographyConsensus.forbiddenSupport

## @evidence contracts/development/common.md#meaningful-documentation

The solver rounds the policy overlap fraction times the population upward to an integral support threshold.

# src/recovery/IAutoMovieRecoveryCameraHomographyConsensus.ts#IAutoMovieRecoveryCameraHomographyConsensus.trials

## @evidence contracts/development/common.md#meaningful-documentation

The draw counter advances before a numerical result is available.

# src/recovery/IAutoMovieRecoveryCameraHomographyConsensus.ts#IAutoMovieRecoveryCameraHomographyConsensus.requiredTrialsAtForbiddenSupport

## @evidence contracts/development/common.md#meaningful-documentation

The unique-four-point sampling probability is evaluated using the forbidden overlap count.

# src/recovery/IAutoMovieRecoveryCameraHomographyConsensus.ts#IAutoMovieRecoveryCameraHomographyConsensus.conditionalTrialTargetMet

## @evidence contracts/development/common.md#meaningful-documentation

The absence search's conditional target is covered only when both proposal requirements were reached.

# src/recovery/IAutoMovieRecoveryCameraHomographyConsensus.ts#IAutoMovieRecoveryCameraHomographyConsensus.forbiddenOverlapFound

## @evidence contracts/development/common.md#meaningful-documentation

Direct support at the threshold ends the search early and supplies ambiguity evidence even if the conditional target was not reached.

# src/recovery/IAutoMovieRecoveryCameraHomographyConsensus.ts#IAutoMovieRecoveryCameraHomographyConsensus.numericalRefusals

## @evidence contracts/development/common.md#meaningful-documentation

The proposal loop retains these refusals while allowing additional draws within budget.

# src/recovery/IAutoMovieRecoveryCameraHomographyConsensus.ts#IAutoMovieRecoveryCameraHomographyConsensus.refitRefusals

## @evidence contracts/development/common.md#meaningful-documentation

An improving eligible support can be refitted. Recognized numerical refusal stops its refit loop without replacing the prior candidate.
