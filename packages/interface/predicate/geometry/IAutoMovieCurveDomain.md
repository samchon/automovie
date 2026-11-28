# src/geometry/IAutoMovieCurveDomain.ts#IAutoMovieCurveDomain

## @evidence contracts/development/common.md#meaningful-documentation

The interval documents inclusive finite endpoints and one shared curve parameter unit.

## @evidence contracts/development/design.md#principled-representation

The arbitrary-piece length reader checks increasing representable widths, reads original derivatives in that same chart and places quadrature nodes inside the domain.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The value owns parameter bounds only. World derivative values and their physical units belong to the associated curve reader.

# src/geometry/IAutoMovieCurveDomain.ts#IAutoMovieCurveDomain.start

## @evidence contracts/development/common.md#meaningful-documentation

The inclusive finite value addresses the start in the current source chart.

# src/geometry/IAutoMovieCurveDomain.ts#IAutoMovieCurveDomain.end

## @evidence contracts/development/common.md#meaningful-documentation

The inclusive finite value uses the same parameter unit and lies strictly above start.
