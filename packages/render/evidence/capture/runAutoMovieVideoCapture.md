# src/capture/index.ts#runAutoMovieVideoCapture

## @evidence contracts/development/common.md#meaningful-documentation

States every step and its order, what a still is captioned by, what a missing frame becomes, what the record adds, and every refusal.

## @evidence contracts/development/implementation.md#principled-implementation `.agents/skills/visual-debugging/capture.md`: around every cut and decisive instant capture the output's own consecutive frames, and sample a file from the file itself at the same seconds as its source. Frames are selected by index, so each still is a frame the file holds, and the source pairing is the round comparison's `time` matching.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Plan, detect cuts, plan again, extract, then the shared capture run; FFmpeg's arguments, the report reader and the frame plan each belong to their own function.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A frame missing from the file is recorded as a failure, never filled from a neighbour, and a still keeps the file's decoded pixels.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two FFmpeg runs decode the file twice, once for cuts and once for the frames; each extracted still is read, decoded and encoded once.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each run detects and extracts afresh, because the file may have changed.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Extracted stills wait in the folder, claimed by its record, and each is deleted once read; one decoded still is held at a time.
