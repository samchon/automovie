# src/sound/productionDialogueFrameLevels.ts#productionDialogueFrameLevels

## @evidence contracts/development/common.md#meaningful-documentation

The comment defines a frame level, the frame interval on the line's own samples, the silence past the line's end, the unit and its dBFS form.

## @evidence contracts/development/implementation.md#principled-implementation

RMS over exactly the samples a frame shows, on the nearest-tick rule the mixer places the line with, so a frame's level is the loudness heard while that frame is on screen.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function serves the envelope jaw and the lip-sync level series, so both read the same level.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No smoothing or threshold is applied here; the jaw and the measurement apply their own.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the line's samples, with one tick evaluation per frame boundary.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It returns one array of one number per frame and holds no resource.
