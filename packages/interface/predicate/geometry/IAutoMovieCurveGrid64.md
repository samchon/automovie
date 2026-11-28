# src/geometry/IAutoMovieCurveGrid64.ts#IAutoMovieCurveGrid64.IConstruction

## @evidence contracts/development/common.md#meaningful-documentation

The construction identifies metres and the actual source and guide courses emitted by the grid owner.

## @evidence contracts/development/design.md#principled-representation

Curve-grid tessellation returns its generated courses and guides in a construction record with the literal unit m. Those lines use the field also sampled for the returned mesh.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The record collects the line outputs beneath one unit tag. Mesh indices and per-boundary derivatives stay on separately named result members.

# src/geometry/IAutoMovieCurveGrid64.ts#IAutoMovieCurveGrid64.IConstruction.units

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the single millimetre-to-metre conversion used before publishing the construction.

# src/geometry/IAutoMovieCurveGrid64.ts#IAutoMovieCurveGrid64.IConstruction.lines

## @evidence contracts/development/common.md#meaningful-documentation

Carries the original courses and requested guide lines in their returned order.

# src/geometry/IAutoMovieCurveGrid64.ts#IAutoMovieCurveGrid64.IConstructionLine

## @evidence contracts/development/common.md#meaningful-documentation

The declaration identifies an ordered line, its closure flag and caller-owned metre positions.

## @evidence contracts/development/design.md#principled-representation

The grid tessellator starts the line list from its actual courses and appends evaluated guide lines. Periodic station guides carry the closure state from their grid evaluation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Each line needs one identity, its closure flag and its samples. The containing result owns any mesh topology and derivative samples.

# src/geometry/IAutoMovieCurveGrid64.ts#IAutoMovieCurveGrid64.IConstructionLine.id

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the source course or the guide associated with a requested normalized course coordinate.

# src/geometry/IAutoMovieCurveGrid64.ts#IAutoMovieCurveGrid64.IConstructionLine.closed

## @evidence contracts/development/common.md#meaningful-documentation

Records whether the station direction closes for this sampled line.

# src/geometry/IAutoMovieCurveGrid64.ts#IAutoMovieCurveGrid64.IConstructionLine.points

## @evidence contracts/development/common.md#meaningful-documentation

Carries the ordered Cartesian line samples in metres.

# src/geometry/IAutoMovieCurveGrid64.ts#IAutoMovieCurveGrid64.IParameterSamples

## @evidence contracts/development/common.md#meaningful-documentation

The declaration distinguishes normalized course coordinates from station coordinates in the input station unit.

## @evidence contracts/development/design.md#principled-representation

The tessellator publishes the actual course-coordinate list and maps its rows to the stored station values. The course set includes the original span boundaries and requested guides.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two aligned axes let readers interpret mesh and boundary samples. They hold parameters only, with Cartesian coordinates owned by separate output arrays.

# src/geometry/IAutoMovieCurveGrid64.ts#IAutoMovieCurveGrid64.IParameterSamples.course

## @evidence contracts/development/common.md#meaningful-documentation

Carries the actual normalized course sample coordinates selected for the mesh grid.

# src/geometry/IAutoMovieCurveGrid64.ts#IAutoMovieCurveGrid64.IParameterSamples.station

## @evidence contracts/development/common.md#meaningful-documentation

Carries the actual sampled station coordinates in the declared station unit.

# src/geometry/IAutoMovieCurveGrid64.ts#IAutoMovieCurveGrid64.IBoundarySamples

## @evidence contracts/development/common.md#meaningful-documentation

The declaration documents copied metre positions and their analytic partials in metres per corresponding parameter unit.

## @evidence contracts/development/design.md#principled-representation

The grid evaluator appends positions and analytic partials to named boundary arrays when visiting their sampled endpoints. For a periodic station boundary the final side copies the corresponding first-side arrays.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The boundary record supplies position and both signed derivative vectors at aligned positions. The grid owner retains evaluation and sampling state.

# src/geometry/IAutoMovieCurveGrid64.ts#IAutoMovieCurveGrid64.IBoundarySamples.positions

## @evidence contracts/development/common.md#meaningful-documentation

Carries copied metre positions from the selected course or station boundary.

# src/geometry/IAutoMovieCurveGrid64.ts#IAutoMovieCurveGrid64.IBoundarySamples.coursePartials

## @evidence contracts/development/common.md#meaningful-documentation

Carries the analytic course partials in metres per unit normalized course coordinate.

# src/geometry/IAutoMovieCurveGrid64.ts#IAutoMovieCurveGrid64.IBoundarySamples.stationPartials

## @evidence contracts/development/common.md#meaningful-documentation

Carries the analytic station partials in metres per declared station unit.

# src/geometry/IAutoMovieCurveGrid64.ts#IAutoMovieCurveGrid64.ICounts

## @evidence contracts/development/common.md#meaningful-documentation

The declaration distinguishes declared course spans, evaluated spans, emitted mesh counts, normal classifications and the minimum retained millimetre-square area.

## @evidence contracts/development/design.md#principled-representation

Curve-grid tessellation reports input spans from the supplied curves, common spans from the unified partition and evaluated spans from actual field evaluation. It derives retained faces from the final index stream and numerical counters from face and normal assembly.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The record keeps observed work and quality counters adjacent to the returned grid without exporting internal coefficients, caches or sample rows.

# src/geometry/IAutoMovieCurveGrid64.ts#IAutoMovieCurveGrid64.ICounts.courses

## @evidence contracts/development/common.md#meaningful-documentation

Counts the supplied generating courses for this field.

# src/geometry/IAutoMovieCurveGrid64.ts#IAutoMovieCurveGrid64.ICounts.inputSpans

## @evidence contracts/development/common.md#meaningful-documentation

Sums each supplied course's original cubic spans.

# src/geometry/IAutoMovieCurveGrid64.ts#IAutoMovieCurveGrid64.ICounts.commonSpans

## @evidence contracts/development/common.md#meaningful-documentation

Counts intervals between consecutive entries of the common course partition.

# src/geometry/IAutoMovieCurveGrid64.ts#IAutoMovieCurveGrid64.ICounts.evaluatedSpans

## @evidence contracts/development/common.md#meaningful-documentation

Counts common spans for which the ordered sampler actually prepared a tensor station family.

# src/geometry/IAutoMovieCurveGrid64.ts#IAutoMovieCurveGrid64.ICounts.vertices

## @evidence contracts/development/common.md#meaningful-documentation

Counts generated mesh vertices, including vertices without a retained incident face.

# src/geometry/IAutoMovieCurveGrid64.ts#IAutoMovieCurveGrid64.ICounts.triangles

## @evidence contracts/development/common.md#meaningful-documentation

Counts triples in the retained output index stream.

# src/geometry/IAutoMovieCurveGrid64.ts#IAutoMovieCurveGrid64.ICounts.omittedZeroAreaTriangles

## @evidence contracts/development/common.md#meaningful-documentation

Counts proposed faces omitted during generated area admission.

# src/geometry/IAutoMovieCurveGrid64.ts#IAutoMovieCurveGrid64.ICounts.unresolvedVertexNormals

## @evidence contracts/development/common.md#meaningful-documentation

Counts generated vertices reported with a zero normal after normal accumulation.

# src/geometry/IAutoMovieCurveGrid64.ts#IAutoMovieCurveGrid64.ICounts.isolatedVertices

## @evidence contracts/development/common.md#meaningful-documentation

Counts unresolved normals associated with no retained incident face.

# src/geometry/IAutoMovieCurveGrid64.ts#IAutoMovieCurveGrid64.ICounts.nonfiniteNormalSums

## @evidence contracts/development/common.md#meaningful-documentation

Counts unresolved normals associated with a nonfinite accumulated length.

# src/geometry/IAutoMovieCurveGrid64.ts#IAutoMovieCurveGrid64.ICounts.minimumTriangleAreaMm2

## @evidence contracts/development/common.md#meaningful-documentation

Carries the observed minimum retained area in square millimetres. The initialized maximum-finite sentinel remains when the face population is empty.

# src/geometry/IAutoMovieCurveGrid64.ts#IAutoMovieCurveGrid64.Result.construction

## @evidence contracts/development/common.md#meaningful-documentation

Publishes the source courses and requested evaluated guides from the same field as the mesh, in metres.

# src/geometry/IAutoMovieCurveGrid64.ts#IAutoMovieCurveGrid64.Result.parameters

## @evidence contracts/development/common.md#meaningful-documentation

Publishes normalized course samples and actual station samples in their respective units.

# src/geometry/IAutoMovieCurveGrid64.ts#IAutoMovieCurveGrid64.Result.boundaries

## @evidence contracts/development/common.md#meaningful-documentation

Publishes the four named families of copied positions and their analytic partials.

# src/geometry/IAutoMovieCurveGrid64.ts#IAutoMovieCurveGrid64.Result.counts

## @evidence contracts/development/common.md#meaningful-documentation

Publishes actual mesh and numerical qualification counts separately from the grid's authored source span totals.
