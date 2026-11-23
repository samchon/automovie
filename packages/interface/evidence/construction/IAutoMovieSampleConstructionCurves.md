# src/construction/IAutoMovieSampleConstructionCurves.ts#IAutoMovieSampleConstructionCurves

## @evidence contracts/development/design.md#principled-representation

Dimensionless phase and station subdivision counts control sampling without altering source geometry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

sampleAutoMovieConstructionCurves uses these counts for section rings, four guides and the sampled-ring centroid axis.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Density does not certify geometric accuracy; nonfinite source samples are omitted and flagged by the sampler.

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the sampled outputs and numerical count semantics.

# src/construction/IAutoMovieSampleConstructionCurves.ts#IAutoMovieSampleConstructionCurves.IOptions

## @evidence contracts/development/design.md#principled-representation

Independent ring sample and station interval counts preserve the four quarter-phase guide addresses.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The sampler defaults missing counts and uses the same ring samples for sections, guides and centroid-axis points.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Integer and divisibility admission belongs to sampleAutoMovieConstructionCurves; no upper bound or error tolerance is implied.

## @evidence contracts/development/common.md#meaningful-documentation

States defaults, count validation, no retention and output unit conversion.
