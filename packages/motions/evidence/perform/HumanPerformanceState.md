# src/perform/HumanPerformanceState.ts#HumanPerformanceState

## @evidence contracts/development/common.md#meaningful-documentation

States what the record holds, who reads it, why its members are public and that it is not exported.

## @evidence contracts/development/design.md#principled-representation

One record of the resolved performance, built in one place and read by functions that take it, in place of one class of two thousand lines.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Shared performance members retain their existing owners; flight is the single resolved staged/physical authored-turn policy read by the flight dispatcher. Supplied momentum remains physical.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No reader keeps a copy of a member; the caches live here and are settled here.

# src/perform/HumanPerformanceState.ts#HumanPerformanceState.of

## @evidence contracts/development/common.md#meaningful-documentation

States that every input is resolved afresh, that a refusal is thrown on each resolution, and what the diagnostic observation receives.

## @evidence contracts/development/implementation.md#principled-implementation

A resolution is a pure function of its input, so constructing it is the whole method: the admitted flight mode (`HumanPerformanceFlightMode.of`) and the optional observer go to construction. No process-wide memo holds another performance's state.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the mode, construct; the flight mode has its own owner and the state owns its caches.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No structural key, identity numbering or least-recently-used list decides which state a caller gets; equal inputs resolve to equal states.

## @evidence contracts/development/implementation.md#efficient-algorithms

One resolution per call; an equal input resolved twice pays two resolutions, the cost of owning its state instead of borrowing a process-wide one.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing is shared between two resolutions; the readers' caches live in the state each resolution returns.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned state is the caller's and is released with it; the module retains nothing.
