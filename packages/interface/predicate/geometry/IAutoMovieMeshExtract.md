# src/geometry/IAutoMovieMeshExtract.ts#IAutoMovieMeshExtract.IExtreme

## @evidence contracts/development/common.md#meaningful-documentation

One directional support crossing of a section. Its point uses the input millimetre frame and its reach is a signed projection from the station centre.

## @evidence contracts/development/design.md#principled-representation

Outline selects the maximum of the edge crossings projected on the requested direction. It preserves the first crossing in a tie.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The support result carries exactly the chosen crossing and its reach. Direction identity belongs to the enclosing extremes key.

# src/geometry/IAutoMovieMeshExtract.ts#IAutoMovieMeshExtract.IExtreme.point

## @evidence contracts/development/common.md#meaningful-documentation

The selected crossing in the input millimetre frame. Several directions can reference the same returned tuple.

# src/geometry/IAutoMovieMeshExtract.ts#IAutoMovieMeshExtract.IExtreme.reach

## @evidence contracts/development/common.md#meaningful-documentation

Signed millimetres from the station centre along the specified unit direction.

# src/geometry/IAutoMovieMeshExtract.ts#IAutoMovieMeshExtract.IReduceResult

## @evidence contracts/development/common.md#meaningful-documentation

The retained knots and measured scalar error after greedy reduction of dense finite samples.

## @evidence contracts/development/design.md#principled-representation

The scalar reducer retains input values and protected stations, then uses least-squares neighbour slopes to measure residuals at the remaining dense samples.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result transfers a mutable knot array and the observed sample error. Removal candidates and excluded samples stay with the reducer.

# src/geometry/IAutoMovieMeshExtract.ts#IAutoMovieMeshExtract.IReduceResult.knots

## @evidence contracts/development/common.md#meaningful-documentation

Owns copied retained knots in input order, including both endpoints. Each knot index still addresses the original input.

# src/geometry/IAutoMovieMeshExtract.ts#IAutoMovieMeshExtract.IReduceResult.error

## @evidence contracts/development/common.md#meaningful-documentation

Largest absolute residual at the retained dense sample stations, in their value unit. Excluded samples and between-station extrema are outside this measurement.

# src/geometry/IAutoMovieMeshExtract.ts#IAutoMovieMeshExtract.IReduceLoopResult

## @evidence contracts/development/common.md#meaningful-documentation

Periodic Hermite knots, their closed chord parameter period and sampled planar residual.

## @evidence contracts/development/design.md#principled-representation

The loop reducer refits tangent components in cumulative chord length, preserves the selected extrema and inflections, and keeps at least four knots.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The loop result owns the copied tuples and the metrics needed to use their parameter. It carries no reconstructed dense samples.

# src/geometry/IAutoMovieMeshExtract.ts#IAutoMovieMeshExtract.IReduceLoopResult.knots

## @evidence contracts/development/common.md#meaningful-documentation

Owns points and tangent tuples in loop order, with at least four knots and no repeated closing point.

# src/geometry/IAutoMovieMeshExtract.ts#IAutoMovieMeshExtract.IReduceLoopResult.length

## @evidence contracts/development/common.md#meaningful-documentation

Chord period of the retained dense loop, including the closing chord, in the input coordinate unit.

# src/geometry/IAutoMovieMeshExtract.ts#IAutoMovieMeshExtract.IReduceLoopResult.error

## @evidence contracts/development/common.md#meaningful-documentation

Largest Euclidean residual at retained dense chord parameters, in the input coordinate unit.
