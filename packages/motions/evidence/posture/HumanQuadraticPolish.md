# src/posture/HumanQuadraticPolish.ts#HumanQuadraticPolish

## @evidence contracts/development/implementation.md#principled-implementation

Implements the cited active-set regularized KKT solve and iterative refinement; the outer solver accepts its result only when the original residual checks permit it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Selects current bound rows and fixed soft multipliers, reuses an exactly equivalent retained system or factors it, then shares that factor across the current initial solve and refinement passes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps existing delta, active-row rules and refinement count; the Cholesky diagonal guard is retained and a polish is not itself a success certificate.

## @evidence contracts/development/implementation.md#efficient-algorithms

Matching persistent factors need O(active rows) comparison; misses assemble O(n*w+sum(active k_r*k_r)) and factor O(n*w*w). Every current-rhs refinement costs O(n*w+Z+m), with O(n*w+n+m) workspace; exceptional products may additionally visit R original entries, and exact diagonal finite-x curvature takes O(n).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Retains only an exact P/A/delta/active factor; current q, bounds and fixed soft multipliers rebuild the rhs. Final x/y share one ordered Ax/A-transpose-y pass and its producer-maintained finite-x proof feeds immediate curvature/residual reading; exceptional zero terms stay original.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Candidate x/z/y remain independent of workspace; the solver transfers accepted candidates and may reset only discarded candidates as later scratch. Persistent owners retain one read-only polish factor and rotate its replaced predecessor into the bounded mutable-band slot; one-shot scratch releases at return.

## @evidence contracts/development/common.md#meaningful-documentation

Describes hard and soft active rows, regularized reduction, iterative refinement, scaled outputs and outer acceptance ownership.
