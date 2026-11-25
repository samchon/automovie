# src/physics/IAutoMovieSolvePhysicalChainTarget.ts#IAutoMovieSolvePhysicalChainTarget.IInput

## @evidence contracts/development/common.md#meaningful-documentation

A proximal-to-distal physical chain and an independent world endpoint goal.

## @evidence contracts/development/design.md#principled-representation

goal and optional terminal localPoint are metres; iterations is an integer in [1,64] and tolerance a positive finite metre residual.

## @evidence contracts/development/design.md#minimal-and-owned-surface

solvePhysicalChainTarget borrows the admitted profile and pose record, then detaches only pose shells it writes; omitted localPoint targets the terminal bone origin.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The producer validates the budget, finite goal and chain length of at least two; caller admission owns coherent chain topology and complete poses. The original endpoint goal remains unchanged when unreachable.

# src/physics/IAutoMovieSolvePhysicalChainTarget.ts#IAutoMovieSolvePhysicalChainTarget.IResult

## @evidence contracts/development/common.md#meaningful-documentation

World motor-goal poses after bounded chain fitting and the remaining endpoint error.

## @evidence contracts/development/design.md#principled-representation

residual is the Euclidean world distance in metres between the fitted terminal support point and the unchanged requested goal.

## @evidence contracts/development/design.md#minimal-and-owned-surface

solvePhysicalChainTarget creates a new target record and detaches changed pose shells; unchanged branches still borrow the input poses and must not be mutated through this result.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The solve projects all declared joint coordinates while updating descendants; budget exhaustion may leave nonzero error. Results do not change solved bodies or certify achieved contact.
