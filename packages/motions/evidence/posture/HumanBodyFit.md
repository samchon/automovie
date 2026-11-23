# src/posture/HumanBodyFit.ts#HumanBodyFit.fit

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the result.

## @evidence contracts/development/implementation.md#principled-implementation

Sequential quadratic programming on the l1 merit: each convexification linearises the rows at the iterate (each bearing part's lowest point, the floor under every collider near it, the targets, the balance's edges, the pairs near contact), all re-selected at that iterate, and the merit prices the same rows, so the model and the merit agree at the iterate they are taken about.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reading/merit and shared loop; each fixed linearization owns fresh price shells. A selected step's trial getter selects its captured SOC solve/delta, so a later discarded steering solve cannot replace the correction's basis.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every goal is a priced row and every collider near the floor a row; a residual is measured on the fitted posture, never taken from the model.

## @evidence contracts/development/implementation.md#efficient-algorithms

Adds the owning FK/Jacobian and sequential-convex/QP costs with actual projections per candidate. Each subproblem is solved by the interior method in a bounded number of dense factorisations of the n-variable system, independent of the curvature's conditioning; the splitting, whose iteration count grows with it (a third of a supine rise's programs ended unfinished at its 4000-iteration guard), runs only on a program the interior method leaves unsolved. Measured on the get-up's supine rise: 0.7 s of interior solves against 8.0 s of splitting. When all soft prices are implicit, steering reprices O(m) rows without another Jacobian/geometry pass.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A fit-local canonical factory shares skeleton metadata. At fixed x/e/objective, only default soft prices depend on mu; absent every explicit target/angle/centre price, fresh row identities carry exact new weights. One interior session per linearisation shares its scales, scratch and last converged point across its regions, reprices and correction, a start that decides no answer; a new linearisation clears them. The splitting's fallback keeps its same-row warm iterates and keyed duals.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The call owns indices, at most two curvatures, canonical metadata, one interior session (one scaling, one scratch set and one point) and current models/iterates/evaluations. A fallback convexification's splitting model holds copied fixed rows and bounded solver scratch until replacement or return; final written posture ownership transfers to the result, without a global result/body cache.
