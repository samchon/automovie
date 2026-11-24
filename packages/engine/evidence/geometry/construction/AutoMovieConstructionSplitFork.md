# src/geometry/construction/AutoMovieConstructionSplitFork.ts#AutoMovieConstructionSplitFork.IRange

## @evidence contracts/development/common.md#meaningful-documentation

The comments identify the existing fork clock and the mutual limit of its adjacent sectors in radians.

## @evidence contracts/development/design.md#principled-representation

The fork window is an address and a positive extent in the periodic band chart. Split realization derives its extent from the smaller physically supported arc and seam ranges, each limited to half of its sector. Finiteness and physical coverage are geometric premises checked by that construction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Split realization owns the measured line support. The transition reads only its address and range. The split edge adds the actual retained parent reader under its own contract.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The same range represents any supported arc and seam pair. Its inputs are geometric data used by the runtime transition.

# src/geometry/construction/AutoMovieConstructionSplitFork.ts#AutoMovieConstructionSplitFork.weight

## @evidence contracts/development/common.md#meaningful-documentation

The function documents a compact partition with two derivatives. The input is signed clock distance divided by its physical window.

## @evidence contracts/development/implementation.md#principled-implementation

The unique quintic with unit value at the center, zero value at the window edge and two zero endpoint derivatives gives `(1 - y)^3(1 + 3 y + 6 y²)`, where `y = |x|`. Even extension is twice differentiable at the center. The zero continuation is twice differentiable at the support edges.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The scalar window supplies the same value and derivatives to the shared fork and its reflected correction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The six endpoint conditions determine the polynomial and all its coefficients.

## @evidence contracts/development/implementation.md#efficient-algorithms

Evaluation takes constant arithmetic work and returns three numbers.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The three derivative orders share one normalized distance and one window branch within the call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The result contains the three readings for the caller. The function retains no inputs beyond the call.

# src/geometry/construction/AutoMovieConstructionSplitFork.ts#AutoMovieConstructionSplitFork.prepare

## @evidence contracts/development/common.md#meaningful-documentation

The comments give the periodic chart support, balanced read addresses, station endpoint jets and bound on material reads.

## @evidence contracts/development/implementation.md#principled-implementation

Adjacent charts first agree on the existing retained fork continuation. Gregory's compatible boundary data motivates supplying that shared curve from one owner. The angular transition reads `±d` with `d² = x² + b²(1−x²)³/3` and weights `(1 ± x/d)/2`. Their weighted normalized address is exactly `x`. Here `b = 4V(1−V)` lies in [0,1], using the original quintic station step. The cubic angular factor preserves value, slope and curvature at each lateral window edge. Both addresses are within the window and `d_x = x(1−b²(1−x²)²)/d` gives directed original-side samples on both half-spans. The factor 1/3 is the largest amplitude in this cubic family that guarantees that property for `b = 1`. The station endpoints still read the original two-jets. At an unresolvable angular separation the reader returns the original chart. [Gregory, Smooth interpolation without twist constraints](https://bura.brunel.ac.uk/handle/2438/1959)

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Split realization identifies and bounds the forks. Split edge carries the source continuation. This function evaluates the two adjacent strips in one interior clock and returns the resulting 2-jet.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The original seam and native arc supply the active geometry. The compact transition depends on source arc extents and analytic boundary constraints. The analytic fixture checks source addresses and the six jet vectors independently of triangulation.

## @evidence contracts/development/implementation.md#efficient-algorithms

One read examines the finite fork ranges at the given clock. It makes one strip jet call outside them and two inside one range. The strip calls dominate the cost and the chain rule uses fixed-size vectors.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each adjacent strip jet supplies all six product-rule terms for that side. Both sides share the same computed addresses and partition within the query.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the prepared closure for its band. It holds the existing strip reader, scalar length and one fixed range per actual fork. Evaluations add no retained state.
