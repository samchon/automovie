# src/geometry/IAutoMovieTessellateContourPath64.ts#IAutoMovieTessellateContourPath64.ISavedPolygon

## @evidence contracts/development/common.md#meaningful-documentation

The record identifies a finite world-millimetre polygon and its cut coordinate. It documents ring order, closure convention and how pairs refer to it.

## @evidence contracts/development/design.md#principled-representation

The contour path owner checks identities, finite coordinates, minimum ring size, common finite Y station and collapsed edges. An exact signed sum establishes positive XZ winding even when the projected area itself underflows.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The polygon owns only the saved vertices, cut coordinate and stable identity. Its matching, start offsets and walk steps belong to the separate pair record.

# src/geometry/IAutoMovieTessellateContourPath64.ts#IAutoMovieTessellateContourPath64.ISavedPolygon.id

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the polygon resolved by the saved pair's pId and qId.

# src/geometry/IAutoMovieTessellateContourPath64.ts#IAutoMovieTessellateContourPath64.ISavedPolygon.stationMm

## @evidence contracts/development/common.md#meaningful-documentation

Gives the ring's common world Y coordinate in millimetres and orders the sections within each pair.

# src/geometry/IAutoMovieTessellateContourPath64.ts#IAutoMovieTessellateContourPath64.ISavedPolygon.pointsMm

## @evidence contracts/development/common.md#meaningful-documentation

Gives the finite ordered world-millimetre vertices. The emitter uses a modulo ring closure after requiring positive projected orientation.

# src/geometry/IAutoMovieTessellateContourPath64.ts#IAutoMovieTessellateContourPath64.IPair

## @evidence contracts/development/common.md#meaningful-documentation

The record documents the lower and upper ring references, vertex ordinals, P/Q alphabet and complete walk, and a finite millimetre-square optimizer observation.

## @evidence contracts/development/design.md#principled-representation

The owner resolves both polygons, checks increasing stations, requires safe integer start indices within their ring lengths, and verifies a complete P/Q count and a finite nonnegative objective.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The pair carries the exact saved walk used for emission and the original objective for diagnostic comparison. The saved polygons own their ring positions independently of the completed optimization.

# src/geometry/IAutoMovieTessellateContourPath64.ts#IAutoMovieTessellateContourPath64.IPair.id

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the saved pair and its resulting report independently of the two polygon IDs.

# src/geometry/IAutoMovieTessellateContourPath64.ts#IAutoMovieTessellateContourPath64.IPair.pId

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the lower ring whose vertex ordinal advances for a P step.

# src/geometry/IAutoMovieTessellateContourPath64.ts#IAutoMovieTessellateContourPath64.IPair.qId

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the upper ring whose vertex ordinal advances for a Q step.

# src/geometry/IAutoMovieTessellateContourPath64.ts#IAutoMovieTessellateContourPath64.IPair.startP

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the valid integer start ordinal in the lower ring. The emitter takes successive P steps from it.

# src/geometry/IAutoMovieTessellateContourPath64.ts#IAutoMovieTessellateContourPath64.IPair.startQ

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the valid integer start ordinal in the upper ring. The emitter takes successive Q steps from it.

# src/geometry/IAutoMovieTessellateContourPath64.ts#IAutoMovieTessellateContourPath64.IPair.steps

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the ordered P/Q walk whose counts close each ring exactly once.

# src/geometry/IAutoMovieTessellateContourPath64.ts#IAutoMovieTessellateContourPath64.IPair.objectiveAreaMm2

## @evidence contracts/development/common.md#meaningful-documentation

Gives the authored expected area in square millimetres for an independent downstream discrepancy comparison.

# src/geometry/IAutoMovieTessellateContourPath64.ts#IAutoMovieTessellateContourPath64.IConstructionPolygon

## @evidence contracts/development/common.md#meaningful-documentation

The declaration names the saved ring and its metre-valued points, including how the construction polyline closes.

## @evidence contracts/development/design.md#principled-representation

Contour path emission maps the polygon's millimetres to metres once and appends its first position to the construction line. It keeps the original polygon identity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The construction record gives a caller a closed line for inspecting the saved ring. Mesh positions and indexed faces remain on the result separately.

# src/geometry/IAutoMovieTessellateContourPath64.ts#IAutoMovieTessellateContourPath64.IConstructionPolygon.id

## @evidence contracts/development/common.md#meaningful-documentation

Carries the original saved ring identity from the input polygon.

# src/geometry/IAutoMovieTessellateContourPath64.ts#IAutoMovieTessellateContourPath64.IConstructionPolygon.points

## @evidence contracts/development/common.md#meaningful-documentation

Carries caller-owned world-metre points in ring order, with the first point repeated at the end.

# src/geometry/IAutoMovieTessellateContourPath64.ts#IAutoMovieTessellateContourPath64.IPairResult

## @evidence contracts/development/common.md#meaningful-documentation

The declaration distinguishes output triangle ordinal, retained and omitted counts, measured area and objective discrepancy in square millimetres, and ordered reports.

## @evidence contracts/development/design.md#principled-representation

The emitter records the output triangle offset before visiting a pair, then advances the saved P/Q path. It omits faces whose square-millimetre measures collapse or overflow and refuses a pair if the total of admitted face areas becomes nonfinite. The objective comparison therefore uses a finite retained area.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A report connects the saved pair to its output triangle span and its source comparison. The result carries numeric observations, while physical identity and vertex buffers remain owned by the emitted mesh.

# src/geometry/IAutoMovieTessellateContourPath64.ts#IAutoMovieTessellateContourPath64.IPairResult.id

## @evidence contracts/development/common.md#meaningful-documentation

Carries the original walk pair's identity into its emitted report.

# src/geometry/IAutoMovieTessellateContourPath64.ts#IAutoMovieTessellateContourPath64.IPairResult.firstTriangle

## @evidence contracts/development/common.md#meaningful-documentation

Records the number of retained triangles already emitted at pair entry.

# src/geometry/IAutoMovieTessellateContourPath64.ts#IAutoMovieTessellateContourPath64.IPairResult.triangles

## @evidence contracts/development/common.md#meaningful-documentation

Counts retained emitted faces for this pair in its output span.

# src/geometry/IAutoMovieTessellateContourPath64.ts#IAutoMovieTessellateContourPath64.IPairResult.omittedTriangles

## @evidence contracts/development/common.md#meaningful-documentation

Counts attempted faces whose area is zero or nonfinite in square millimetres, including overflow during unit conversion.

# src/geometry/IAutoMovieTessellateContourPath64.ts#IAutoMovieTessellateContourPath64.IPairResult.areaMm2

## @evidence contracts/development/common.md#meaningful-documentation

Gives the retained-face area sum in square millimetres from the emitted metre positions.

# src/geometry/IAutoMovieTessellateContourPath64.ts#IAutoMovieTessellateContourPath64.IPairResult.objectiveDiscrepancyMm2

## @evidence contracts/development/common.md#meaningful-documentation

Gives the absolute difference between the declared optimizer objective and measured area.

# src/geometry/IAutoMovieTessellateContourPath64.ts#IAutoMovieTessellateContourPath64.IPairResult.diagnostics

## @evidence contracts/development/common.md#meaningful-documentation

Carries pair-local repeated-face or omission reports alongside the retained span.

# src/geometry/IAutoMovieTessellateContourPath64.ts#IAutoMovieTessellateContourPath64.IInput.polygons

## @evidence contracts/development/common.md#meaningful-documentation

Supplies named station-plane polygons used as the initial physical boundaries for the saved walk.

# src/geometry/IAutoMovieTessellateContourPath64.ts#IAutoMovieTessellateContourPath64.IInput.pairs

## @evidence contracts/development/common.md#meaningful-documentation

Supplies the explicit walks used to generate faces across the input polygons.

# src/geometry/IAutoMovieTessellateContourPath64.ts#IAutoMovieTessellateContourPath64.IResult.construction

## @evidence contracts/development/common.md#meaningful-documentation

Publishes each original polygon as an owner-identified closed metre polyline.

# src/geometry/IAutoMovieTessellateContourPath64.ts#IAutoMovieTessellateContourPath64.IResult.pairs

## @evidence contracts/development/common.md#meaningful-documentation

Publishes retained triangle spans, area measurements and diagnostics under the corresponding saved pair IDs.
