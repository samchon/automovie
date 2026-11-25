# src/handling/fitPianoScoreContact.ts#fitPianoScoreContact

## @evidence contracts/development/common.md#meaningful-documentation

Explains which pose is fitted and what the boundary check admits.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the same digit goals and canonical world fingertip surfaces as playback.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Seed the shared hand, fit its active digits and measure the resulting contact.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses a chord whose actual fitted tips miss the scored surfaces beyond the documented tolerance.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fits the digits and resolves the necessary bones once at each checked boundary.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The at-rest fits are shared by the press and adjacent transports.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The resulting hand angles are the only values returned.
