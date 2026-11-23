# src/createViewerDisplayClock.ts#createViewerDisplayClock

## @evidence contracts/development/implementation.md#principled-implementation

Separates a validated synchronous producing-time scope from last completed time; completion prefers explicit seconds, then nested producer time, then prior display, and finally restores the enclosing producer clock even after refusal. Async work must complete with explicit time because run's scope is synchronous.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Keeps two scalar clock states and one admission rule instead of tying requested seek to displayed completion or advancing an accumulator each frame.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fixture seek time or dropped-frame estimate advances the display; negative/nonfinite requests refuse before mutation and failed producers do not overwrite the enclosing request state.

## @evidence contracts/development/common.md#meaningful-documentation

Gives requested-versus-completed time, nested scope restoration, finite nonnegative seconds and out-of-loop completion precedence.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed-count scalar validation/assignment per request/completion, constant retained storage plus the actual synchronous call-stack depth of nested producers.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses last completed time for out-of-loop redraws without a new authoritative timestamp; effectful producer callbacks are still invoked rather than skipped because their requested seconds match.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds only displayed/producing scalars, borrows each synchronous callback for its invocation and starts no timer, worker or render task; no cancellation/resource handle is acquired.
