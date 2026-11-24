# src/touch/touchClock.ts#touchClock

## @evidence contracts/development/common.md#meaningful-documentation

States what it computes from what `touch.plan` hands it and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

The reach is the free-space transport time of the farther hand's distance, and at least the arms' travel-bound time; the strokes repeat at the form's period or a given repetition, hold and return in the reach's time, the manner scaling the whole.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility of `touch.plan`: its clock, apart from its other parts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `touch.plan`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called where `touch.plan` computed it before; its cost is the moved code's.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the values `touch.plan` already holds instead of computing them again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what its result holds, for as long as the caller holds it.
# src/touch/touchClock.ts#touchClock.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

Each member names the value it carries.

## @evidence contracts/development/design.md#principled-representation

The values `touch.plan` prepared before calling `touchClock`, each typed as its owner declares it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `touchClock` only; every type is imported from its owner.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Each member is one prepared value; no optional combination arises.
