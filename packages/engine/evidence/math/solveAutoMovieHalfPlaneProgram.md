# src/math/solveAutoMovieHalfPlaneProgram.ts#solveAutoMovieHalfPlaneProgram

## @evidence contracts/development/common.md#meaningful-documentation

States the problem, the half-plane convention, the incremental method, the fallback and their source.

## @evidence contracts/development/implementation.md#principled-implementation

The cited paper's two-dimensional incremental linear program with its one-dimensional subproblem and its three-dimensional program for the infeasible case, which carries the leading `hard` half-planes unchanged as the paper's program carries its obstacle half-planes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the input, run the two-dimensional program, fall back to the three-dimensional one from the half-plane it failed on.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No half-plane is dropped or softened: an infeasible set is answered by the least worst violation, and the result says it is.

## @evidence contracts/development/implementation.md#efficient-algorithms

Expected linear in the half-planes for the feasible program, at worst quadratic, and cubic at worst for the fallback, on the few neighbours of one agent. The admission reads each half-plane's values in place, with no array a half-plane (a crowd solves one program an agent at every stage of every step).

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input; nothing is kept between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
