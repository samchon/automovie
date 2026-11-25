# src/geometry/curve/AutoMovieCubicOval64.ts#AutoMovieCubicOval64.perimeter

## @evidence contracts/development/implementation.md#principled-implementation

Each quadrature sample evaluates the original cubic derivative and adds its weighted Euclidean norm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Diameter halving, quarter symmetry and interval mapping are explicit in one operation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The actual cubic perimeter is integrated instead of replacing the curve by a true ellipse or pi times a diameter.

## @evidence contracts/development/common.md#meaningful-documentation

Diameters are finite nonnegative values in one unit, and the returned length uses that unit.

## @evidence contracts/development/implementation.md#efficient-algorithms

Eight fixed quadrature nodes give constant work per perimeter query.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A call shares one diameter pair and handle ratio across its eight samples.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Nodes and weights are local fixed arrays; only the scalar perimeter escapes.

# src/geometry/curve/AutoMovieCubicOval64.ts#AutoMovieCubicOval64.otherDiameter

## @evidence contracts/development/implementation.md#principled-implementation

A positive feasible circumference brackets the unknown diameter in [0,circumference/2], then 64 bisections use the same cubic perimeter.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The inverse retains one monotone scalar bracket with no solver object.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No anatomical aspect bound or replacement fixed diameter is imposed by the generic solve.

## @evidence contracts/development/common.md#meaningful-documentation

Requires finite fixedDiameter>0 and circumference>2*fixedDiameter; returned diameter uses the same unit.

## @evidence contracts/development/implementation.md#efficient-algorithms

Exactly 64 iterations each perform eight-point quadrature.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each iteration preserves and narrows the prior bracket rather than restarting an independent search.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only scalar bracket endpoints and the returned diameter survive within the call.

# src/geometry/curve/AutoMovieCubicOval64.ts#AutoMovieCubicOval64.perimeterBySimpson

## @evidence contracts/development/implementation.md#principled-implementation

The cubic derivative norm is summed with alternating Simpson weights and the original accumulation order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The Simpson sizing path is explicit and separate from the eight-point quadrature path; consumers retain their numerical contract.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The original handle formula, accumulation order and stopping policy remain explicit; anatomical admission is outside this operation.

## @evidence contracts/development/common.md#meaningful-documentation

Approximate the four-quarter cubic perimeter by composite Simpson quadrature with the retained sqrt(2) handle formula. Positive finite millimetre diameters and an even interval count of at least two are required; default count is 256 per quarter.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N) quadrature samples and constant scalar storage for N intervals.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The current bracket or unit-aspect perimeter is reused within one solve without cross-request result retention.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only returned scalar dimensions escape; no geometry owner, input object or work arrays are cached.

# src/geometry/curve/AutoMovieCubicOval64.ts#AutoMovieCubicOval64.axesBySimpson

## @evidence contracts/development/implementation.md#principled-implementation

Normalize the larger diameter to one before Simpson quadrature, then use perimeter homogeneity to scale both diameters to the requested girth; this avoids extreme-aspect accumulation overflow.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The Simpson sizing path is explicit and separate from the eight-point quadrature path; consumers retain their numerical contract.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The same cubic handle and Simpson weights determine the curve; positive finite output admission refuses underflow instead of publishing a collapsed zero diameter. Anatomical admission remains with callers.

## @evidence contracts/development/common.md#meaningful-documentation

States aspect preservation, millimetre units, positive finite inputs and RangeError for unrepresentable positive output.

## @evidence contracts/development/implementation.md#efficient-algorithms

One default 256-interval quadrature and fixed scalar scaling.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The current bracket or unit-aspect perimeter is reused within one solve without cross-request result retention.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only returned scalar dimensions escape; no geometry owner, input object or work arrays are cached.

# src/geometry/curve/AutoMovieCubicOval64.ts#AutoMovieCubicOval64.otherDiameterBySimpson

## @evidence contracts/development/implementation.md#principled-implementation

A monotone diameter bracket is narrowed with the same perimeter owner; midpoint stagnation stops without changing the fixed diameter.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The Simpson sizing path is explicit and separate from the eight-point quadrature path; consumers retain their numerical contract.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The original handle formula, accumulation order and stopping policy remain explicit; anatomical admission is outside this operation.

## @evidence contracts/development/common.md#meaningful-documentation

Resolve the second diameter from circumference and a fixed first diameter using Simpson quadrature. Inputs are finite millimetre lengths with circumference greater than twice the positive fixed diameter; at most 64 bisections stop when the bracket cannot refine in binary64.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most 64 default-quadrature evaluations and constant scalar bracket storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The current bracket or unit-aspect perimeter is reused within one solve without cross-request result retention.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only returned scalar dimensions escape; no geometry owner, input object or work arrays are cached.
