# src/production/IAutoMovieProductionFrameBoundaryToGridTick.ts#IAutoMovieProductionFrameBoundaryToGridTick.IProps

## @evidence contracts/development/design.md#principled-representation

frame is a nonnegative safe integer and ticksPerSecond a positive safe integer. Boundary mapping validates both, canonicalizes the rational frame rate and refuses a result above MAX_SAFE_INTEGER.

## @evidence contracts/development/design.md#minimal-and-owned-surface

productionFrameBoundaryToGridTick is the shared clock conversion used for PCM samples and caption ticks; the caller owns the rounding choice.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A boundary is an instant rather than a frame duration; integer arithmetic performs one final rounding, with nearest ties upward and no implicit default in the type.

## @evidence contracts/development/common.md#meaningful-documentation

Explicit rounding request from a rational film boundary to an integer clock. frame is a nonnegative safe integer and ticksPerSecond a positive safe integer. Boundary mapping validates both, canonicalizes the rational frame rate and refuses a result above MAX_SAFE_INTEGER.
