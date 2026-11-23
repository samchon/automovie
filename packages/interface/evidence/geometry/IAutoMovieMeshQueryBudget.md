# src/geometry/IAutoMovieMeshQueryBudget.ts#IAutoMovieMeshQueryBudget

## @evidence contracts/development/design.md#principled-representation

A decrement-before-work counter: the query checks `remaining` is a nonnegative safe integer on entry and throws before any unit whose spend would go below zero, so the work a caller can be charged never exceeds the count it handed over.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One mutable field on a shared object, so a hair fit can thread one bound through every separation call of a curve without the query returning or merging partial counts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Exhaustion throws instead of returning an uncertified or partial answer, so running out of budget never reads as a geometric refusal or a pass.

## @evidence contracts/development/common.md#meaningful-documentation

States the spender, what one unit buys, the admission and exhaustion refusals, that it is shared and mutated in place, and that resetting it mid-refinement defeats the bound.
