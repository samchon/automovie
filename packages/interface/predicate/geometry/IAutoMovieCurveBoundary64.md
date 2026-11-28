# src/geometry/IAutoMovieCurveBoundary64.ts#IAutoMovieCurveBoundary64

## @evidence contracts/development/common.md#meaningful-documentation

Named closed transverse cubic section and complete derivative controls per longitudinal millimetre.

## @evidence contracts/development/design.md#principled-representation

Boundary admission checks one-turn closed sections, matching identity and one dense four-control variation span per section span. Publication clones and freezes the admitted data.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The boundary owns section and derivative geometry. A context separately owns the declared publication edge and genuine binding identity.

# src/geometry/IAutoMovieCurveBoundary64.ts#IAutoMovieCurveBoundary64.id

## @evidence contracts/development/common.md#meaningful-documentation

Stable nonblank identity, equal to the section's name and to its declared context edge.

# src/geometry/IAutoMovieCurveBoundary64.ts#IAutoMovieCurveBoundary64.section

## @evidence contracts/development/common.md#meaningful-documentation

Closed cubic transverse chart in its owner frame, with phase widths summing to one turn.

# src/geometry/IAutoMovieCurveBoundary64.ts#IAutoMovieCurveBoundary64.fullJ

## @evidence contracts/development/common.md#meaningful-documentation

One finite XYZ cubic first-variation coefficient field per section span, per longitudinal millimetre.

# src/geometry/IAutoMovieCurveBoundary64.ts#IAutoMovieCurveBoundary64.longitudinalUnit

## @evidence contracts/development/common.md#meaningful-documentation

Fixed millimetre denominator for the stored longitudinal first variation.

# src/geometry/IAutoMovieCurveBoundary64.ts#IAutoMovieCurveBoundary64.longitudinalAxis

## @evidence contracts/development/common.md#meaningful-documentation

Caller-supplied world unit axis along increasing longitudinal distance. Boundary admission checks all three components are finite.
