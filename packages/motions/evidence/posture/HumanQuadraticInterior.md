# src/posture/HumanQuadraticInterior.ts#HumanQuadraticInterior

## @evidence contracts/development/common.md#meaningful-documentation

States the program, the optimality conditions, the elimination, the reduced system, the step rule, the regularisation, the termination, the failure cases and the units of the result.

## @evidence contracts/development/implementation.md#principled-implementation

Newton's method on the perturbed optimality conditions of a convex program with Mehrotra's predictor-corrector, derived above and matching HPIPM's reduced system; convex curvature is the caller's premise as for the OSQP solve, and the method's own premises (positive slacks and multipliers) are kept by the step length.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission and equilibration stay with `HumanQuadraticPreparation`, the banded assembly, factor and substitution with the OSQP solve's owners; this file owns the iteration alone.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No row, bound or penalty is dropped or relaxed: a zero-weight soft end, which costs nothing, and an empty row, which holds no variable, are the only ends left out, and a hard empty row that excludes zero fails the solve. `ITERATIONS`, `BOUNDARY`, `REGULAR` and `ACCURACY` are named parameters with their origins stated; a solve that misses its accuracy returns nothing rather than an approximate answer.

## @evidence contracts/development/implementation.md#efficient-algorithms

An iteration costs O(n w^2 + n w + Z + m) for Z stored row coefficients and m rows, at most `ITERATIONS` of them and one last residual reading, independent of the curvature's conditioning; storage is O(n w + n + m). No speedup is claimed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One factor serves an iteration's two solves; within a session its last preparation serves a program of the same data and scaling (`HumanQuadraticPreparation.scaled`), and its variable and cost scales, its scratch and its last converged point as a start: any positive diagonal scaling leaves the program's minimiser, and a start decides no answer since a warm solve short of its accuracy is solved again cold.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Without a session all scratch is the call's own, one banded factor and O(n + m) vectors, released on return or throw; a session holds one scaling, one preparation, one scratch set of its sizes and one point until its caller drops it; the returned arrays are fresh.
