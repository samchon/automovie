# src/lexicon/readHumanBladeExchangeCues.ts#readHumanBladeExchangeCues

## @evidence contracts/development/common.md#meaningful-documentation

Defines the three cues, their timebase, ordering, cut semantics and missing exchange error.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the composer-owned phase anchors, the schedule's placed contact and the block's declared stroke. A placed schedule preserves named events past a cut, so the stroke is read only inside the retained action.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Find the exact phase anchors in one pass, then project their scheduled instants to the existing cue record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Each second comes from the placed schedule. No pose or physical contact is sampled, and no missing cue is inferred.

## @evidence contracts/development/implementation.md#efficient-algorithms

One scan of the schedule and one lookup in the block's events. The result holds at most three cues, so sorting it is bounded independently of schedule size.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Cases read a completed schedule without placing its actions again. The projection stores no data to reuse across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns only new cue records and keeps no input reference or resource after the call.
