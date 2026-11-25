# src/motion/AirborneTabulatedShapeHistory.ts#AirborneTabulatedShapeHistory

## @evidence contracts/development/implementation.md#principled-implementation

Fornberg derivatives estimate part centre velocity and spin from the sampled knots. A cubic Hermite tensor is a convex combination of four Bézier controls, so SPD endpoints and controls preserve SPD in exact arithmetic. One zero slope per unsuitable knot preserves continuity on both sides. Knots with a non-SPD tensor retain existing principal-axis admission.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lazy build samples the grid, reduces its poses and limits the tensor slopes. Query interpolation finds its interval by binary search, and the memo owns exact-second readings.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No rounded query time, no nearest-knot answer and no changed physical bound: every query interpolates at its own second, and the knots' tensors pass the stencil history's own admission.

## @evidence contracts/development/implementation.md#efficient-algorithms

For K final knots and S mass parts the build reads K shapes and does O(K S) work, with fixed-width derivatives. A fresh query takes O(log K) search time and evaluates nine cubics with no shape read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One table serves every stage, defect probe and shooting trial of the history's lifetime, since none of them changes the shape; an exact second's issued instant, with its tensor factor, is shared by the memo, and a defect's reading of a second with no instant keeps its numbers and factorisation for the instant a later query issues there, counted as the query and factorisation that instant would have made. No attitude, momentum or flight answer is kept.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The history owns two arrays of nine scalars a knot, the knots' seconds and one issued instant or numeric reading (nine scalars and a factor) per distinct queried second, unbounded in the number of distinct seconds; posed shapes are dropped when the build ends. `clear` releases the arrays, both memos and each instant's factor; the caller releases a prepared model.

## @evidence contracts/development/common.md#meaningful-documentation

States what is tabulated and why it may be, the knots, each knot's two readings with their order, the interpolant and its sources, the lazy build, the statistics' meaning, every input's frame and unit and every refusal.
