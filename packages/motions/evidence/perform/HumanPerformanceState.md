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

States ordinary equal-input memo reuse and explicit diagnostic cold planning without retaining an observer in the result.

## @evidence contracts/development/implementation.md#principled-implementation

Pure unobserved resolution uses structural-key memoization with LRU eviction; requested physical-work observation resolves afresh. Both paths pass the key owner's single effective flight-policy capture into construction, so getters, inherited fields and non-enumerable fields cannot classify the cache and constructed state differently.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Obtain key plus admitted captured policy together; observed planning constructs with that policy, while ordinary inputs keep lookup and miss construction with the same policy. Neither constructor branch adds another input.flight access.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Diagnostics changes no authored input, physical bound or refusal. Neither cold branch rereads the flight getter after keying; an invalid captured policy refuses before serialization or lookup and cannot borrow a valid cached staged state. Keys remain content/identity values rather than mutable caller references.

## @evidence contracts/development/implementation.md#efficient-algorithms

Both paths pay the original key walk and one observer branch; an ordinary memo hit still skips resolution. Explicit observation pays full cold construction without concealing the ordinary key cost and is not a speedup path.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Equal unobserved inputs retain the existing whole-performance sharing. Observed construction still shares only its actually equivalent internal preparation, never another completed performance.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

At most KEEP ordinary resolutions remain in the memo. Observed states are neither read from nor inserted into it, and the observer is passed through construction without becoming a retained state field.
