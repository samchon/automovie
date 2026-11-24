# src/audio/admitAutoMovieFilmDialogue.ts#admitAutoMovieFilmDialogue

## @evidence contracts/development/common.md#meaningful-documentation

The comment states which files are read and through what, which package admits and decodes them, the span rule and its clock, which consumers share the result, and every refusal with when it happens.

## @evidence contracts/development/implementation.md#principled-implementation

Each line's span ends at `productionSpeechEndFrame` of its admitted 48 kHz sample count from its start frame on the film's exact rate, the rule the mixer places it with, so a line's samples, span and the frame levels read from them agree with the soundtrack.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One admission serves the mix, the dialogue mouths and the lip-sync measure, so a capture that only needs the mouths admits lines exactly as the delivery render does without mixing.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A file the host cannot read is refused by path rather than replaced by a stand-in; a repeated line id is refused before any read, and a span past the film's last frame is refused rather than cut.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the bytes of the lines: each line's two files are read once and its samples decoded once.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call admits its own list; the caller holds the result for every consumer of one render.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The read bytes live for the call; the placed lines, receipts and samples transfer to the caller. No file handle is opened by render.
