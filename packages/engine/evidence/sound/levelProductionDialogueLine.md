# src/sound/levelProductionDialogueLine.ts#levelProductionDialogueLine

## @evidence contracts/development/common.md#meaningful-documentation

The comment states that the line is measured as the faded dual-mono pair the mixer places, why that reads 3.01 LU above a mono measure, the one-block rule for short lines, the ±12 dB bound, both refusals and the units of the result.

## @evidence contracts/development/implementation.md#principled-implementation

The gain is the dialogue target minus the line's BS.1770-5 integrated loudness as placed, so the line meets the target after gain. Measuring the faded stereo pair the mixer adds equals measuring the line's contribution to the mix.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The mixer owns placement and the fade; this function owns the measurement and the bound and receives the fade as a function, so it measures exactly what is placed.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The ±12 dB bound is the range #4053 sets; the target comes from the production's intent or EBU R 128. No line is special-cased: a line under the absolute gate has no loudness to level and is refused.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the line's samples: one placed copy and one meter pass.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each line is measured once, by the one call that places it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The placed copy and the meter are released on return; the caller keeps the line's samples.
