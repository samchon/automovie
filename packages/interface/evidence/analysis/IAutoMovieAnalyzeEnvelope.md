# src/analysis/IAutoMovieAnalyzeEnvelope.ts#IAutoMovieAnalyzeEnvelope

## @evidence contracts/development/common.md#meaningful-documentation

Inputs and paired heat/moisture artifacts for the steady-state envelope analysis. Nested contracts define the relevant units, ownership and failure states.

## @evidence contracts/development/design.md#principled-representation

One envelope request and two canonical analysis runs keep thermal and moisture outcomes separate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

analyzeAutoMovieEnvelope and report consumers share the request/result names without copying run fields.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The request is not an admitted-result brand; missing exterior conditions remain not-run and unsupported physics stays explicit.

# src/analysis/IAutoMovieAnalyzeEnvelope.ts#IAutoMovieAnalyzeEnvelope.IProps

## @evidence contracts/development/common.md#meaningful-documentation

States request borrowing, admission owner, equations, numerical failure and fitted-range limits.

## @evidence contracts/development/design.md#principled-representation

The existing envelope request owns SI thickness, conductivity, area, bridge length and Celsius temperature fields; this wrapper introduces no alternate units or defaults.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One request supplies the thermal and moisture analyzer together so their settings digest refers to the same envelope study.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing exterior conditions produce not-run artifacts rather than a guessed climate; transient storage, vapor diffusion and solar gain are outside this model.

# src/analysis/IAutoMovieAnalyzeEnvelope.ts#IAutoMovieAnalyzeEnvelope.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Defines paired domains, missing-boundary status, shared nested records and digest mutation consequences.

## @evidence contracts/development/design.md#principled-representation

Canonical analysis runs preserve domain-specific outcomes and units rather than collapsing heat and condensation into one verdict.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The envelope analyzer returns the two report domains separately while reusing analysis-run sealing and metric contracts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Interstitial condensation and glazing solar gain remain explicit unsupported metrics; surface condensation is not a whole-envelope moisture certificate.
