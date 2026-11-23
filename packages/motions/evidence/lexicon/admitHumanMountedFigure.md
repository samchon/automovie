# src/lexicon/admitHumanMountedFigure.ts#admitHumanMountedFigure

## @evidence contracts/development/common.md#meaningful-documentation

States what is admitted and every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The seat kind's required and optional parts (`HumanMountedSeats.parts`) against the figure's named supports, the carrier's declared contacts, and the shared-support rule for a transfer (motion skill, contacts: transfer weight to the next support before releasing the current one).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The seconds, each part's support, then the transfer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is inferred: a missing or extra support is refused, never filled or ignored.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the parts times the carrier's contacts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Runs once per figure.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Writes only the caller's hand record, at most two entries.
