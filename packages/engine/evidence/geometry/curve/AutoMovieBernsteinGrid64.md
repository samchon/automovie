# src/geometry/curve/AutoMovieBernsteinGrid64.ts#AutoMovieBernsteinGrid64.hermite

## @evidence contracts/development/implementation.md#principled-implementation

All endpoint/derivative courses elevate to one degree and form four longitudinal Bernstein rows using length/3.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The tensor constructor shares elevation and scaled polynomial addition.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Complete derivative coefficients are retained rather than unit tangent vectors.

## @evidence contracts/development/common.md#meaningful-documentation

Build four longitudinal rows from endpoint curves and full derivatives over a physical chart length.

## @evidence contracts/development/implementation.md#efficient-algorithms

Degree elevation and four row constructions dominate cost.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One maximum degree and elevated endpoint nets are reused for both inner rows.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The four-row grid owns its endpoint and handle coefficient arrays.

# src/geometry/curve/AutoMovieBernsteinGrid64.ts#AutoMovieBernsteinGrid64.gridValue

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates every cross-course coefficient column in the outer grid parameter.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Grid evaluation delegates to the same vector De Casteljau owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The complete cross-course polynomial survives; no sparse samples replace its coefficients.

## @evidence contracts/development/common.md#meaningful-documentation

Evaluate the outer grid parameter while retaining the complete cross-course coefficients.

## @evidence contracts/development/implementation.md#efficient-algorithms

For C cross-course controls and outer degree R, cost is O(CR²).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each returned cross coefficient is evaluated once from its corresponding grid column.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the resulting new polynomial net escapes the temporary columns.

# src/geometry/curve/AutoMovieBernsteinGrid64.ts#AutoMovieBernsteinGrid64.gridTangent

## @evidence contracts/development/implementation.md#principled-implementation

Adjacent outer rows are subtracted and scaled by outer degree and chart factor.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Grid differentiation composes degree-aware vector polynomial subtraction and scaling.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No finite-difference parameter step or sampled tangent is introduced.

## @evidence contracts/development/common.md#meaningful-documentation

Differentiate the outer grid parameter using the supplied physical scale.

## @evidence contracts/development/implementation.md#efficient-algorithms

One polynomial subtraction/scaling per adjacent row determines cost.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Differentiated rows remain reusable coefficient nets for later grid evaluations.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The new grid retains no source-row array references.
