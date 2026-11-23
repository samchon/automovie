# src/math/minimizeAutoMovieSimplexQuadratic.ts#minimizeAutoMovieSimplexQuadratic

## @evidence contracts/development/implementation.md#principled-implementation

Convex simplex duality gives price_i=a_i dot aggregate+b_i. Nonnegative weighted pricing slacks avoid subtraction of two near-equal means; measured mass error contributes abs((sum(lambda)-1)*minimumPrice). Normalizing weights precedes recomputing aggregate/prices. This remains a floating numerical certificate, not a sub-ulp interval proof. Exact pairwise line search requires no Gram matrix, dependent-row inverse or assumed convergence rate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This generic owner keeps sparse admission, complete pricing, weight transfer and finite work together; recovery determines objective/constraint rows and original-coordinate acceptance.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No constraint sampling, curvature floor, gamma regularization, dropped dependent row or budget-limited success replaces the authored convex problem. Nonrepresentable arithmetic throws.

## @evidence contracts/development/common.md#meaningful-documentation

States the exact objective, sparse pairwise update, absolute gap units, degeneracy handling and absence of nonlinear or parameter-accuracy guarantees.

## @evidence contracts/development/implementation.md#efficient-algorithms

With n coordinates, m atoms and Z sparse coefficients, each complete pass costs O(n+m+Z). At most I pairwise transfers require O(I*(n+m+Z)) work and O(n+m+Z) logical storage, without a dense m-by-m Gram or n-dimensional nullspace. Explicit scalar-visit bounds precede every pass and transfer.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One aggregate supplies all prices. Weights are normalized and the aggregate is rebuilt on every pass to avoid accumulating mass/vector drift; pair curvature merges the two sorted sparse supports without allocating a dense difference.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrowed atoms remain unchanged. Owned weights, aggregate and prices are admitted before allocation; prices expire on return and weights/aggregate transfer, with no cache, WASM reactor or external handles.
