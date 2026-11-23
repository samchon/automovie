# src/geometry/construction/AutoMovieSolidTraceLaw.ts#AutoMovieSolidTraceLaw.arc

## @evidence contracts/development/implementation.md#principled-implementation

Prepares a periodic cubic reference Q and the normal-plane equation (P-Q).Q'=0, with analytic partials and the stated second-order remainder; a regular transverse local branch is required.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One local reference-jet reader supplies the equation/derivative callbacks without another geometric intersection representation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Equal-chord guide samples and stationary normal planes do not certify exact arclength or a nearest reference foot; this remains an approximation to the public requested arc parameter, not a proof of that requirement.

## @evidence contracts/development/common.md#meaningful-documentation

Gives the spline, equation, derivatives, mm input and requested-arclength limitation.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N) fixed-filter preparation stores N reference controls; each callback uses constant four-control work but computes all four reference derivative orders even when fewer are read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reference controls are prepared once, while g/grad/gt/extra independently reevaluate the same parameter's basis/jet; no per-parameter jet sharing is implemented.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned law closures retain O(N) prepared reference controls for their owner's lifetime; callback basis/jet arrays are fixed-size temporaries and no global cache grows.

# src/geometry/construction/AutoMovieSolidTraceLaw.ts#AutoMovieSolidTraceLaw.of

## @evidence contracts/development/implementation.md#principled-implementation

Phase uses its direct difference; angle normalizes the supplied axis/projected reference and builds analytic rotating-plane callbacks with an atan2 seed branch.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One closed parameter dispatch returns phase/angle laws and delegates walked-guide preparation to arc.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Returns null for arc or failed normal/reference normalization; it does not validate every extreme-scale axis, enforce a half-plane inequality or prove transversality of a selected branch.

## @evidence contracts/development/common.md#meaningful-documentation

Gives supported kinds, nullable failures and the exact phase/angle equations above.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed-size basis preparation and constant callback arithmetic; current angle readings allocate small vectors rather than retaining a query cache.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The angle basis is prepared once for all callbacks; its centre remains the supplied tuple reference, so changing authoring data is not a cache invalidation mechanism.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Phase closures hold no geometry; angle closures retain two basis vectors and the borrowed centre for the law's lifetime, without a growing map or acquired handle.
