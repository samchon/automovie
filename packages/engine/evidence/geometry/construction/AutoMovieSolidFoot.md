# src/geometry/construction/AutoMovieSolidFoot.ts#AutoMovieSolidFoot.of

## @evidence contracts/development/implementation.md#principled-implementation

Solves the two tangential stationarity equations by Newton, using the metric Gauss-Newton system when the full Hessian is not positive definite and bounding the chart step's linearized world length.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One local iterate owns residual, Hessian selection, relative small-system solve and step scaling.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only owned finite trials are evaluated; at most twenty scalar feasibility halvings preserve the actual map. Normalized tangential stationarity still does not exclude maxima/other basins or certify a constrained boundary optimum; no post-step distance-descent claim is made.

## @evidence contracts/development/common.md#meaningful-documentation

Gives mm target/tolerance, the two normalized residual tests, regional-guess premise, step/iteration behavior and nullable failure.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most 60 fixed-size jet/system evaluations and twenty scalar domain halvings per update, with constant iterate storage; callback cost and local conditioning remain relevant.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One current jet supplies both residuals, Hessian/metric terms and the accepted point; repeated calls do not share a prepared search.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The iterate and temporary vectors/matrices are call-local on success or null; only a small foot record with the jet's point reference escapes.
