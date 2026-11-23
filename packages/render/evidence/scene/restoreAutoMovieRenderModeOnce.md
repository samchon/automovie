# src/scene/restoreAutoMovieRenderModeOnce.ts#restoreAutoMovieRenderModeOnce

## @evidence contracts/development/implementation.md#principled-implementation

The guard marks its one attempt before invoking the callback and retains a wrapper around any thrown value, including undefined, for later refusal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One done flag and optional original cause own synchronous attempt sharing while actual restoration and independent resource fan-out remain with the supplied callback.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A failed first restoration is not hidden by a later no-op success, and a callback is not retried merely because its resource state is uncertain.

## @evidence contracts/development/common.md#meaningful-documentation

Documentation distinguishes one attempt, later original failure and reentrant suppression without claiming physical release from callback completion.

## @evidence contracts/development/implementation.md#efficient-algorithms

Guard work and cause retention are fixed size; the callback's actual restoration cost is incurred only on the first attempt.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Repeated calls represent the same owned restoration and share its attempt/outcome; a different owner must create a separate guard.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The guard retains one callback and optional original failure until its owning handle becomes unreachable, with no global registry or newly acquired GPU resource.
