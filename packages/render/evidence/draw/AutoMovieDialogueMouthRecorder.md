# src/draw/AutoMovieDialogueMouthRecorder.ts#AutoMovieDialogueMouthRecorder

## @evidence contracts/development/common.md#meaningful-documentation

States what it hands the subject, how each read is sampled and recorded, why the last read wins, when the page clears and reports it, and shows that order.

## @evidence contracts/development/design.md#principled-representation

The sampler the subject reads and the record of what it returned live in one object, so a report can only hold values the subject was actually handed; the record keys by actor and keeps each form only when it was read.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, each used by `installAutoMovieDraw`: `mouths` for the subject, `clear` before placement and `drawn` for the draw result; sampling is engine's `sampleAutoMovieDialogueMouth`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It names no actor, figure or film, and reports copies, so neither the subject nor the host can change the record.

# src/draw/AutoMovieDialogueMouthRecorder.ts#AutoMovieDialogueMouthRecorder.prototype.clear

## @evidence contracts/development/common.md#meaningful-documentation

States the effect and when the page calls it.

## @evidence contracts/development/implementation.md#principled-implementation

A picture reports only what was read while its own second was placed, so the record starts empty at each placement.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One map clear.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is kept across placements as a fallback.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time per entry.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Clearing shares nothing.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The release point of the record's entries.

# src/draw/AutoMovieDialogueMouthRecorder.ts#AutoMovieDialogueMouthRecorder.prototype.drawn

## @evidence contracts/development/common.md#meaningful-documentation

States what is returned and its order.

## @evidence contracts/development/implementation.md#principled-implementation

Each entry is the last value of each form the subject read for the actor since the last clear, which after a placement is the drawn second's value.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Copy the record's entries in first-read order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No absent form is filled in, so a jaw-driven figure is never reported as viseme-driven.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the actors read and their viseme weights.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call copies the current record.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The copies are the caller's; the record keeps one entry per actor read.
