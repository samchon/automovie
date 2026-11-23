# src/kinematics/distalEndSwivelNearest.ts#distalEndSwivelNearest

## @evidence contracts/development/common.md#meaningful-documentation

States the admissible set, why the candidates are the desired swivel and the interval ends, the fallback and who verifies.

## @evidence contracts/development/implementation.md#principled-implementation

The admissible set is a finite union of closed intervals with known ends, so its point nearest a given one is that point or an end; each candidate is tested by the two exact conditions.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The box's own candidate, the test, the desired swivel, then the ends by distance.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No sampling of the swivel; a swivel is returned as admitted only when both closed-form conditions hold at it, and the caller still scores it.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most one test for each of the few arc ends and two for each of the at most twelve breakpoints, each constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The arcs' nearest end is `swivelArcs.nearest`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
