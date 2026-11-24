# src/production/IAutoMovieProductionViseme.ts#IAutoMovieProductionViseme

## @evidence contracts/development/common.md#meaningful-documentation

States who produces it, the equal-share rule, and each member's clock and unit.

## @evidence contracts/development/design.md#principled-representation

One phoneme with its MPEG-4 viseme and its share of the line's model-native samples; bounds may be fractional because shares divide a chunk exactly. Increasing, nonoverlapping order is the join's runtime check.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Produced by engine's `productionPhonemesToVisemes` and read by the join; a receipt may also carry generator-reported ones.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Film placement is not stored here, so the record does not depend on a frame rate; the join places it.
