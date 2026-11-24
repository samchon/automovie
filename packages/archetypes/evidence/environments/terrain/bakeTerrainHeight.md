# src/environments/terrain/bakeTerrainHeight.ts#bakeTerrainHeight

## @evidence contracts/development/implementation.md#principled-implementation

Each cell's bilinear term has coefficient d = h11 - h10 - h01 + h00. Its triangular interpolation error is d times the covariance of the unit-square coordinates of triangle vertices with barycentric weights. Each coordinate variance is at most 1/4, hence the absolute error bound |d|/4 covers all triangles inside the cell, including clipped edges.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Geometry and grade preparation choose a feature pitch. This owner alone bakes samples, checks representable grid spacing and refines the draw error. Rendering and ground queries read the same approved record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The pitch is refined by halving both axis spacings. Exhaustion of the one-million-sample budget, collapsed grid spacing or nonfinite values refuses instead of relaxing the stated error. The bound applies before the renderer's Float32 coordinate conversion.

## @evidence contracts/development/common.md#meaningful-documentation

Gives world units and frame, the bilinear bound, refinement policy, sample budget and Float32 limit, and the optional advice the budget refusal appends for the relief that drives the lattice.

## @evidence contracts/development/implementation.md#efficient-algorithms

Baking and checking the final R by C lattice take O(RC) operations plus grade evaluator cost. Earlier dyadic populations have a geometric sum and each shared sample from the immediately preceding level is read instead of evaluating it again.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Dyadic refinement reuses even row and column samples because origin, grade evaluator and previous sample positions are identical. No cache spans separate terrain builds.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains at most a candidate and the preceding lattice, each bounded by the sample budget. Only the accepted record transfers to the caller.
