# src/production/IAutoMovieEvaluateStorySync.ts#IAutoMovieEvaluateStorySync.IProps

## @evidence contracts/development/design.md#principled-representation

Callbacks return shot-local event seconds and a shot-to-story affine pin; tolerance is finite nonnegative story seconds admitted by the caller. Spread compares the earliest and latest mapped values inclusively.

## @evidence contracts/development/design.md#minimal-and-owned-surface

evaluateAutoMovieStorySync uses these callbacks once per listed address to build ordered measurement points; the edit timeline never determines story simultaneity.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing/nonfinite values produce an unresolved failed verdict, not invented times. Callback exceptions propagate and neither callback nor returned pin is retained after evaluation.

## @evidence contracts/development/common.md#meaningful-documentation

Event addresses and read callbacks for a story-clock simultaneity verdict. Callbacks return shot-local event seconds and a shot-to-story affine pin; tolerance is finite nonnegative story seconds admitted by the caller. Spread compares the earliest and latest mapped values inclusively.
