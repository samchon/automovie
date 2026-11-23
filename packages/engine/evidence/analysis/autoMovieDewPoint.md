# src/analysis/autoMovieDewPoint.ts#autoMovieDewPoint

## @evidence contracts/development/implementation.md#principled-implementation

Inverts the Magnus saturation-vapour-pressure approximation in closed form with coefficients 17.62 and 243.12. The approximate fitted range is -45 to 60 degC and is not enforced; finite inputs outside it can produce a nonfinite result at a denominator singularity or through overflow, and this function does not admit its output.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One exported function owns the constants and the formula, and `analyzeAutoMovieEnvelope` calls it instead of keeping a private copy, so there is one dew-point rule.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No input is special-cased; zero humidity is refused because `ln(0)` has no value, not mapped to a placeholder, and the envelope analyzer turns that case into a gap before calling.

## @evidence contracts/development/common.md#meaningful-documentation

States formula, units, input refusals, unenforced fitted range, the mathematical saturated identity and numerical singularities, and the envelope caller.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant time, one logarithm and a few arithmetic operations, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure scalar function; the envelope analyzer computes the one indoor dew point once per study and shares it across every assembly.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Works on two scalar arguments and one local, so no object, handle or task is created or kept.
