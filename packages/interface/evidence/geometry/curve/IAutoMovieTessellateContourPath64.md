# src/geometry/curve/IAutoMovieTessellateContourPath64.ts#IAutoMovieTessellateContourPath64.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Saved world-millimetre rings and explicit P/Q steps produce a metre mesh with physical identities and per-pair reports. String steps require runtime P/Q cardinality admission; finite retained faces do not certify the path's optimality or embeddedness.

## @evidence contracts/development/design.md#principled-representation

Saved world-millimetre rings and explicit P/Q steps produce a metre mesh with physical identities and per-pair reports.

## @evidence contracts/development/design.md#minimal-and-owned-surface

tessellateAutoMovieContourPath64 admits IInput and returns newly owned IResult geometry and observations.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

String steps require runtime P/Q cardinality admission; finite retained faces do not certify the path's optimality or embeddedness.

# src/geometry/curve/IAutoMovieTessellateContourPath64.ts#IAutoMovieTessellateContourPath64.IResult

## @evidence contracts/development/common.md#meaningful-documentation

An owned metre mesh, saved construction rings and ordered per-pair triangle/area reports preserve the emitted path. Retained positive-area faces can coexist with incidence warnings; reports do not certify optimal paths or embedding.

## @evidence contracts/development/design.md#principled-representation

An owned metre mesh, saved construction rings and ordered per-pair triangle/area reports preserve the emitted path.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The contour-path tessellator returns output and diagnostics together for downstream geometry inspection.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Retained positive-area faces can coexist with incidence warnings; reports do not certify optimal paths or embedding.
