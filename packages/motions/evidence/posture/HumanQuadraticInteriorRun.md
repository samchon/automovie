# src/posture/HumanQuadraticInteriorRun.ts#HumanQuadraticInteriorRun

## @evidence contracts/development/common.md#meaningful-documentation

States the solve, its end and what it writes.

## @evidence contracts/development/implementation.md#principled-implementation

Mehrotra's predictor-corrector interior-point iteration as HPIPM implements it (Frison and Diehl 2020): the residuals of the unregularised conditions, one factorisation of the reduced system, the predictor, the centring its longest step asks for, the corrector and one step short of the boundary.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The interior solve's run, moved verbatim, reads the arrays the solve hands it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The residuals are read on the unregularised conditions at every iterate; an iterate is converged only once they hold through one further Newton step.

## @evidence contracts/development/implementation.md#efficient-algorithms

One banded factorisation and two solves an iteration, at most `ITERATIONS`.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Writes into the solve's arrays and the session's scratch; nothing is allocated an iteration.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing beyond the arrays it was given; a converged point is handed to the caller's session.

# src/posture/HumanQuadraticInteriorRun.ts#HumanQuadraticInteriorRun.IScope

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it holds.

## @evidence contracts/development/design.md#principled-representation

The interior solve's own arrays, named, so the run reads them explicitly.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Every member is read or written by the run.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The arrays are the solve's own, written in place.

# src/posture/HumanQuadraticInteriorRun.ts#HumanQuadraticInteriorRun.IResult

## @evidence contracts/development/common.md#meaningful-documentation

States the state and the convergence flag.

## @evidence contracts/development/design.md#principled-representation

The state a solve ends with and whether it met the accuracy.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An unconverged state is told apart by the flag, never by its values.
