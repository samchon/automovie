# src/human/generation/arm/IAutoMovieHumanArmBreadth.ts#IAutoMovieHumanArmBreadth

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanArmBreadth exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups IResult, Domain, IMaximumResult. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanArmBreadth; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the IResult, Domain, IMaximumResult contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/arm/IAutoMovieHumanArmBreadth.ts#IAutoMovieHumanArmBreadth.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Actual source and positive family multiplier after residual admission.

## @evidence contracts/development/design.md#principled-representation `input`: Identical source declaration to be lofted by the production caller. `scale`: Dimensionless across multiplier, with no person-specific coefficient.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanArmBreadth.fit. Also types AutoMovieHumanArmWalk.normalized.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `input`, `scale`; callers supply the complete record.

# src/human/generation/arm/IAutoMovieHumanArmBreadth.ts#IAutoMovieHumanArmBreadth.Domain

## @evidence contracts/development/common.md#meaningful-documentation

Physical deltoid support-search interval [lower, upper], millimetres along the source axis.

## @evidence contracts/development/design.md#principled-representation

Physical deltoid support-search interval [lower, upper], millimetres along the source axis. maximum refuses a non-increasing interval or an endpoint outside the admitted outline. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanArmBreadth.Domain is the canonical exchange used by AutoMovieHumanArmBreadth.maximum.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanArmBreadth.maximum, AutoMovieHumanArmBreadth.fit for physical deltoid support-search interval [lower, upper], millimetres along the source axis.

# src/human/generation/arm/IAutoMovieHumanArmBreadth.ts#IAutoMovieHumanArmBreadth.IMaximumResult

## @evidence contracts/development/common.md#meaningful-documentation

Maximum outward deltoid support with its attaining station, both millimetres; a string is the source admission or nonfinite-support refusal.

## @evidence contracts/development/design.md#principled-representation

Maximum outward deltoid support with its attaining station, both millimetres; a string is the source admission or nonfinite-support refusal. Alternatives are a record with radius, station; string.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanArmBreadth.IMaximumResult is the canonical exchange used by AutoMovieHumanArmBreadth.maximum.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanArmBreadth.maximum for maximum outward deltoid support with its attaining station, both millimetres; a string is the source admission or nonfinite-support refusal.
