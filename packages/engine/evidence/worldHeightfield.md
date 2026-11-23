# src/worldHeightfield.ts#worldHeightfield

## @evidence contracts/development/implementation.md#principled-implementation

Each row/column coordinate is evaluated once, finite returned heights become stored samples, and downstream surfaceHeightAt owns bilinear edge-clamped reading. A pure callback is a determinism premise not enforced by this constructor.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The design retains sampled numbers and a copied footprint instead of a live callback, so later rendering depends on the baked generation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Blank id, nonfinite origin/nonpositive spacing, non-safe dimensions below two and nonfinite callback results throw. Derived coordinate overflow and an allocatable total sample population remain unchecked prerequisites; callback effects/errors propagate.

## @evidence contracts/development/common.md#meaningful-documentation

Documents world metre origin/pitch, row-major +X/+Z order, finite sample admission, caller-owned purity and the absence of a lattice population budget.

## @evidence contracts/development/implementation.md#efficient-algorithms

C columns and R rows require C*R callback evaluations/storage plus footprint cloning; callback cost is additional and individually safe dimensions do not bound their product or memory use.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every lattice point is sampled once and the result serves future queries; effectful callbacks are not memoized or retried and changed terrain needs a new bake.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the fresh sample buffer, rule and copied polygon; the callback and input footprint are not retained after success or failure, with no background sampler.
