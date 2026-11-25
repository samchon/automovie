# src/motion/AirborneQuadratureAggregate.ts#AirborneQuadratureAggregate

## @evidence contracts/development/implementation.md#principled-implementation

Nonnegative weights make componentwise maxima valid priority bounds and weighted sums equal the sum of panel measures. Error-free TwoSum recovers each new integral-addition residual; outward positive sums enclose that additional aggregation roundoff. Simpson truncation estimates still require smoothness and are not physical certificates.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Build a leaf, replace the selected leaf by two children, refresh its ancestors, and search by current component bounds.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No stale heap, fixed weights, time grid, tolerance floor or dropped panel is used. Unsupported nonseparable callbacks keep the original generic quadrature path.

## @evidence contracts/development/implementation.md#efficient-algorithms

For n integral coordinates, k error components and tree depth D, replacement refreshes O(D(n+k)) aggregates instead of all P leaves. Best-first bound search can prune subtrees but still has O(Pk) worst-case cost when bounds overlap; no unconditional logarithmic timing claim is made. Storage is O(P(n+k)) plus actual panel data.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each leaf's fixed error components are computed once. Changed whole-integral weights are reevaluated against the same valid component maxima, while exact parent samples remain owned by the Simpson panel producer.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The quadrature call owns this tree and its leaf weak index; replacement removes the old leaf from the index and tree. All nodes and callbacks release on return or throw; no global population, handle or physical model is retained.

## @evidence contracts/development/common.md#meaningful-documentation

Defines changing weighted priorities, aggregate sums, safe bounds, earlier-time ties and ownership.
