# src/geometry/construction/AutoMovieLoftPhaseSource.ts#AutoMovieLoftPhaseSource.prepare

## @evidence contracts/development/implementation.md#principled-implementation

Solves the existing natural spline for identity ordinate columns, producing its exact linear cardinal operator up to binary64 arithmetic.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One explicit failure string precedes preparation; successful output keeps native data separate from numeric interpolation tables.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Rejects malformed coordinate/source data and nonfinite tables rather than selecting a spline fallback or a substitute curve.

## @evidence contracts/development/common.md#meaningful-documentation

Coordinates need at least two finite increasing values; curve radii use one millimetre unit and returned native records are borrowed immutably.

## @evidence contracts/development/implementation.md#efficient-algorithms

L identity columns require O(L squared) time and retained derivative storage through the existing O(LW) natural solver; temporary identity storage has the same order.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One curvature table feeds the slope solve and every subsequent station preparation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns copied coordinates, a copied curve-reference list and two owned derivative tables; temporary identity rows die with the call.

# src/geometry/construction/AutoMovieLoftPhaseSource.ts#AutoMovieLoftPhaseSource.station

## @evidence contracts/development/implementation.md#principled-implementation

Brackets the same source coordinates and applies the existing quintic Hermite rule to cardinal endpoint values/derivatives; these endpoint jets reproduce the natural cubic.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Binary bracketing and one optional two-order chain rule return three ordinary linear-combination rows.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Outside/nonfinite q or coordinate changes throw without clamping or a legacy fallback; singular physical changes must be withheld by their owner.

## @evidence contracts/development/common.md#meaningful-documentation

q uses the prepared coordinate unit; omitted change returns q derivatives and supplied finite change returns physical station derivatives per mm.

## @evidence contracts/development/implementation.md#efficient-algorithms

Binary bracketing plus three L-component Hermite combinations cost O(log L plus L) time and O(L) output.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Returned weights are reusable across phases and both point/jet readers without another solve.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Owns three rows and borrows source; endpoint identity rows and raw parameter weights are call-local.

# src/geometry/construction/AutoMovieLoftPhaseSource.ts#AutoMovieLoftPhaseSource.point

## @evidence contracts/development/implementation.md#principled-implementation

Combines native polar points with the station's value row, preserving source sections at their cardinal coordinates.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One value-only reader avoids materializing unused derivative rows in point consumers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Negative interpolation weights remain observable and any nonfinite source read throws; there is no shape-dependent fallback.

## @evidence contracts/development/common.md#meaningful-documentation

Gives millimetre output, polar-radian input and the native radius owner's still-computed jet cost.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most L nonzero weights read native radius jets in O(L) time; the radius owner currently computes its three orders even though this reader uses only value.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses one prepared value row without a new station solve; zero cardinal weights avoid irrelevant source reads.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one fresh pair and retains no source/query state globally.

# src/geometry/construction/AutoMovieLoftPhaseSource.ts#AutoMovieLoftPhaseSource.jet

## @evidence contracts/development/implementation.md#principled-implementation

Analytic polar product rules give both phase derivatives, and the same station cardinal rows commute with these derivatives on finite C2 native sources.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The six-component rows fit the existing world-frame product rule without constructing a second phase representation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses no finite difference, overshoot clamp or point-derived normal; this candidate supplies neither a pole jet nor a world frame.

## @evidence contracts/development/common.md#meaningful-documentation

Documents row/column order, millimetre values, per-radian phase derivatives and the prepared station coordinate's derivative units.

## @evidence contracts/development/implementation.md#efficient-algorithms

One native three-order radius read per contributing source and fixed three-by-six accumulation cost O(L) time with constant-size output.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Source radius and trigonometric values serve all station/phase derivative orders in one query.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns three fresh six-entry rows; no phase or geometry registry is retained.
