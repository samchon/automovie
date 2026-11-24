# src/AutoMovieRenderOutputReservation.ts#AutoMovieRenderOutputReservation

## @evidence contracts/development/common.md#meaningful-documentation

States what the lock is, how it is installed and when a stale one is reclaimed.

## @evidence contracts/development/design.md#principled-representation

A directory installed by one atomic rename with exactly one process ticket names the owner.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owner and consumers: `renderAutoMovieVideo` reserves before staging and releases in its `finally`; moved out of it unchanged so the render stays under the file limit.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Static members only; it holds no state between calls.

# src/AutoMovieRenderOutputReservation.ts#AutoMovieRenderOutputReservation.reserve

## @evidence contracts/development/common.md#meaningful-documentation

States the ticket and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Atomic directory rename claims the folder; a ticket whose process the operating system confirms gone is reclaimed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Bounded retries over races with a completing render.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A live or unreadable owner refuses instead of being overwritten.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most four attempts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It computes afresh from its arguments; nothing is shared between calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns the ticket the caller releases with `release`.

# src/AutoMovieRenderOutputReservation.ts#AutoMovieRenderOutputReservation.release

## @evidence contracts/development/common.md#meaningful-documentation

States what is removed.

## @evidence contracts/development/implementation.md#principled-implementation

Removes the exact ticket, then the directory only when empty, since a later render may already own it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two file operations.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing ticket is not an error; other failures propagate.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It computes afresh from its arguments; nothing is shared between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It holds no handle, task or state beyond its return value.
