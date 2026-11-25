# src/geometry/curve/AutoMovieBernsteinSubdivision64.ts#AutoMovieBernsteinSubdivision64.split

## @evidence contracts/development/implementation.md#principled-implementation

At t=0 or t=1, one child is the copied original polynomial and the other is the repeated endpoint coefficient of the same degree. Other parameters use one De Casteljau triangle for both child nets, preserving the existing interior arithmetic and common junction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Both restrictions share one reduction triangle.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No curve sampling, degree reduction or implicit chart reversal occurs.

## @evidence contracts/development/common.md#meaningful-documentation

States the nonempty input, exact degenerate endpoint restrictions, preserved degree and independently owned child arrays.

## @evidence contracts/development/implementation.md#efficient-algorithms

Endpoint splits copy O(n) vectors; other parameters take O(n²) vector blends with linear child storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same reduction levels produce both children rather than evaluating them independently.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each child owns its copied controls and the temporary levels expire.

# src/geometry/curve/AutoMovieBernsteinSubdivision64.ts#AutoMovieBernsteinSubdivision64.splitS

## @evidence contracts/development/implementation.md#principled-implementation

Embeds scalar coefficients in one coordinate, splits them with the vector operation, and extracts that coordinate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Scalar and vector restriction retain one subdivision arithmetic path.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unused coordinates remain zero and do not introduce a different scalar blend rule.

## @evidence contracts/development/common.md#meaningful-documentation

Split a scalar polynomial using the same De Casteljau restriction.

## @evidence contracts/development/implementation.md#efficient-algorithms

The vector split dominates O(n²) work; embedding/extraction are linear.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both scalar children come from the one shared vector split.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only fresh scalar child arrays escape the temporary vector embedding.

# src/geometry/curve/AutoMovieBernsteinSubdivision64.ts#AutoMovieBernsteinSubdivision64.restrict

## @evidence contracts/development/implementation.md#principled-implementation

Splits first at b and then at a/b, preserving the polynomial on the ordered subinterval.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Restriction is assembled from the same split owner and exact endpoint cases.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unordered endpoints or endpoints outside [0,1] reject.

## @evidence contracts/development/common.md#meaningful-documentation

Return the exact algebraic restriction to ordered local endpoints inside [0,1].

## @evidence contracts/development/implementation.md#efficient-algorithms

At most two De Casteljau splits dominate O(n²) work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The left net from the first split is reused for the second subinterval.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned restricted net does not alias the original controls.

# src/geometry/curve/AutoMovieBernsteinSubdivision64.ts#AutoMovieBernsteinSubdivision64.restrictS

## @evidence contracts/development/implementation.md#principled-implementation

The scalar coordinate passes through the same ordered vector restriction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One restriction contract governs scalar and vector polynomials.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No sampled fit or alternate endpoint tolerance changes the chosen interval.

## @evidence contracts/development/common.md#meaningful-documentation

Restrict scalar coefficients while preserving their original chart authority.

## @evidence contracts/development/implementation.md#efficient-algorithms

Vector restriction dominates O(n²), with linear embedding and extraction.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The existing restriction owner handles both interval endpoint cases.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the new scalar restricted coefficients are retained by the caller.

# src/geometry/curve/AutoMovieBernsteinSubdivision64.ts#AutoMovieBernsteinSubdivision64.thirds

## @evidence contracts/development/implementation.md#principled-implementation

A split at 1/3 followed by a half split of the remainder yields three consecutive equal parameter domains.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One helper fixes the actual two-split arithmetic path used by rational and scalar callers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Thirds are parameter intervals, not claims of equal arc length.

## @evidence contracts/development/common.md#meaningful-documentation

Partition one vector course into three exact consecutive restrictions.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two De Casteljau splits take O(n²) work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The remaining right child supplies both later thirds.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The three returned nets own their control arrays.

# src/geometry/curve/AutoMovieBernsteinSubdivision64.ts#AutoMovieBernsteinSubdivision64.thirdsS

## @evidence contracts/development/implementation.md#principled-implementation

Scalar coefficients are embedded and partitioned by the same two vector splits.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Scalar thirds delegate to the shared parameter-partition owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No arc-length or physical-distance equality is inferred.

## @evidence contracts/development/common.md#meaningful-documentation

Partition one scalar course into three exact consecutive restrictions.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two vector subdivisions dominate O(n²) work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The common thirds operation supplies all scalar pieces in one call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the three scalar output arrays escape the embedding.
