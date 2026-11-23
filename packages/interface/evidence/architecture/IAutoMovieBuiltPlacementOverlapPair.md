# src/architecture/IAutoMovieBuiltPlacementOverlapPair.ts#IAutoMovieBuiltPlacementOverlapPair

## @evidence contracts/development/design.md#principled-representation

The sweep sums pairwise AABB intersection-volume products and divides by the smaller body's summed part-box volume, clamping the ratio to one. These static proxies can include empty mesh/member gaps and double-count overlapping parts. Representable finite products/sums are a premise: extreme bounds can overflow volume and produce NaN ratios, and the fold currently filters only volume <= 0 rather than independently rejecting nonfinite metrics.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Each body carries its locator and basis side by side, and the two numbers are the only grading the sweep sorts by, so no severity class or threshold is stored on the pair.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Parts of one body that overlap each other are counted for each, and the fraction is clamped to `1` for that reason; the clamp is documented on the member rather than hidden, and no body kind is exempt from the sweep.

## @evidence contracts/development/common.md#meaningful-documentation

States declaration order, cubic-metre pairwise volume sums, duplicate-part counting, ratio/clamp/zero-denominator rules and the finite-product premises behind positive volume and fraction range.
