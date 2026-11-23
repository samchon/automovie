# src/architecture/IAutoMovieDesignPromotion.ts#IAutoMovieDesignPromotion

## @evidence contracts/development/design.md#principled-representation `promoteDesignObservations` validates the reference, walks analyses once to fill `skipped` and record which candidate an observed analysis produced, then walks candidates once and pushes each to `promoted` or `withheld` at the first failing gate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three lists partition the answer by outcome, each with its own element type, so a caller reads promoted geometry without filtering out refusals.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every admitted candidate is classified and every non-observed analysis is listed. The default confidence floor of one compares authored confidence values, not calibrated certainty or actual observation quality; caller-supplied finite floors in [0, 1] change only that gate. Promoted source points can still produce nonfinite world arithmetic, which no final finite-outline gate currently rejects.

## @evidence contracts/development/common.md#meaningful-documentation

States the exhaustive partition of candidates, that empty analyses are listed, the order each list keeps, and that only the first blocking reason is recorded.
