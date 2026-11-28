# src/geometry/IAutoMovieMeshQueryBudget.ts#IAutoMovieMeshQueryBudget

## @evidence contracts/development/common.md#meaningful-documentation

Caller-owned remaining geometry work, shared across separation measurements and refinements.

## @evidence contracts/development/design.md#principled-representation

Separation spends one unit before each visited box, support, tested triangle or inner feature step. Work exhaustion throws at the next attempted spend.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The counter carries only mutable remaining work. Result reporting keeps its own examined count per completed query.

# src/geometry/IAutoMovieMeshQueryBudget.ts#IAutoMovieMeshQueryBudget.remaining

## @evidence contracts/development/common.md#meaningful-documentation

Nonnegative safe integer of remaining work. Each successful spend decrements it in place before the associated geometry operation.
