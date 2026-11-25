# src/geometry/sweep/IAutoMovieSampleSweepSection.ts#IAutoMovieSampleSweepSection.IProps

## @evidence contracts/development/design.md#principled-representation

A section-plane metre curve is sampled at evenly spaced polar directions; the sampler checks count and authored data, with finite-walk admission for general curves.

## @evidence contracts/development/design.md#minimal-and-owned-surface

compileAutoMovieSweep uses this radius array for direction correspondence, while parameter correspondence keeps its own Cartesian section evaluator.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The finite walk is not a proof of unsampled star-shapedness; sampled radial spline values are checked for positive finiteness rather than clipped.

## @evidence contracts/development/common.md#meaningful-documentation

Gives angular convention, metre units, output cardinality, validation owner and the finite-walk limitation.
