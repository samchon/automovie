# src/geometry/IAutoMovieSampleContourRing64.ts#IAutoMovieSampleContourRing64.IResult

## @evidence contracts/development/common.md#meaningful-documentation

The result documents ordinary sampled knots, period and the construction-only fallback after failure.

## @evidence contracts/development/design.md#principled-representation

The accepted path evaluates source restrictions then checks noncollapsed sampled rank. Its refusal path copies a dense first endpoint and sets period zero. Direct probes show the fallback can copy a NaN coordinate and an infinite tolerance can reach the accepted path, so downstream consumers still need finite input guarantees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result keeps source name and construction observations without inventing replacement surface geometry.

# src/geometry/IAutoMovieSampleContourRing64.ts#IAutoMovieSampleContourRing64.IResult.name

## @evidence contracts/development/common.md#meaningful-documentation

The string comes from source metadata. A missing string becomes empty.

# src/geometry/IAutoMovieSampleContourRing64.ts#IAutoMovieSampleContourRing64.IResult.knots

## @evidence contracts/development/common.md#meaningful-documentation

Ordinary knots represent sampled source restrictions. A failed representation yields one copied dense first endpoint at phase zero or an empty construction list.

# src/geometry/IAutoMovieSampleContourRing64.ts#IAutoMovieSampleContourRing64.IResult.period

## @evidence contracts/development/common.md#meaningful-documentation

The accepted path sums the source phase widths and the refusal path writes zero without recomputing invalid widths.

# src/geometry/IAutoMovieSampleContourRing64.ts#IAutoMovieSampleContourRing64.IResult.unsupported

## @evidence contracts/development/common.md#meaningful-documentation

The optional reason identifies a failed representation or sampled-rank check while preserving available construction.
