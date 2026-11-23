# src/math/assignAutoMovieMinimumCost.ts#assignAutoMovieMinimumCost

## @evidence contracts/development/common.md#meaningful-documentation

States the problem solved, the rectangular case, the result's meaning, the deterministic tie rule and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Kuhn's Hungarian method with row and column potentials, each row added by a Dijkstra-like search for the shortest augmenting path in reduced costs (the O(n^2 m) form of Jonker and Volgenant's shortest-path formulation); reduced costs stay nonnegative, which is the optimality certificate of the dual.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the table, add the rows one at a time by an augmenting path, read the matching back.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Exact on finite costs: no cost is scaled, rounded or capped.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(rows^2 columns) time and O(rows + columns) memory beyond the table, against the factorial count of assignments: each path search marks one new column a pass, so it ends within columns passes; an overflowed potential, which would re-enter the start column, is refused instead.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its table; nothing is kept between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the working arrays are freed on return.
