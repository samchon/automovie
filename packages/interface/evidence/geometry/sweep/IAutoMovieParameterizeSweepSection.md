# src/geometry/sweep/IAutoMovieParameterizeSweepSection.ts#IAutoMovieParameterizeSweepSection

## @evidence contracts/development/common.md#meaningful-documentation

A wrapped unit curve parameter yields section-plane metre points and an integer equal-span count. Curve phase is distinct from polar angle and arclength; radial sections are unsupported and retained source coefficients must remain stable.

## @evidence contracts/development/design.md#principled-representation

A wrapped unit curve parameter yields section-plane metre points and an integer equal-span count.

## @evidence contracts/development/design.md#minimal-and-owned-surface

parameterizeAutoMovieSweepSection compiles the section evaluator consumed by radial inversion and direct parameter sampling.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Curve phase is distinct from polar angle and arclength; radial sections are unsupported and retained source coefficients must remain stable.

# src/geometry/sweep/IAutoMovieParameterizeSweepSection.ts#IAutoMovieParameterizeSweepSection.IResult

## @evidence contracts/development/design.md#principled-representation

Dimensionless t wraps modulo one and yields metre section-plane points; parameterizeAutoMovieSweepSection checks authored curve data, while finite t remains a query premise.

## @evidence contracts/development/design.md#minimal-and-owned-surface

compileAutoMovieSweep samples this evaluator for parameter correspondence and sampleAutoMovieSweepSection uses segments to set its angular-inversion walk density.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Curve parameter is not mislabeled as arc length or polar angle; radial sections are excluded from the producer's input type.

## @evidence contracts/development/common.md#meaningful-documentation

Explains each supported basis, wrapping, returned-point ownership, source retention and segment cardinality.
