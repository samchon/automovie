# src/production/sound/IAutoMovieRenderedProductionSound.ts#IAutoMovieRenderedProductionSound

## @evidence contracts/development/design.md#principled-representation

`renderProductionSound` accumulates events, cues and levelled dialogue into Float32 stereo, refuses non-finite samples and analyzes the unmastered mix; `masterProductionSound` returns the master of that mix in the same shape, with its master stage recorded.

## @evidence contracts/development/design.md#minimal-and-owned-surface

PCM, its scalar analysis and its loudness record travel together without codec or host resources; render's film sound route reads all three and the render report records the analysis and loudness.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing cue assets use an audible procedural bus stand-in and missing dialogue is omitted; mixed-master peak alignment is not proof that an individual event contributed energy. One shape serves mix and master because both are stereo samples with their analysis; `loudness.master` tells them apart.

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the LRLR sample layout, the 48 kHz premise, which function returns a mix or a master, and that the analysis describes these exact samples; callers mutating pcm must discard or recompute the paired analysis.

# src/production/sound/IAutoMovieRenderedProductionSound.ts#IAutoMovieRenderedProductionSound.ILoudness

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit, where its value comes from and its bound; the comment points to the analysis for the measured result.

## @evidence contracts/development/design.md#principled-representation

LUFS, dB and dBTP values of the targets and the gains the mix chose, with the source of the targets as a closed union so the report can say whether EBU R 128 applied.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The mixer writes the targets and line gains, the master stage adds `master`, and the render report and delivery host read them: the host checks the decoded file against `intent`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

`master` is one optional record, present exactly after mastering, rather than separate optional fields that could appear partly.

# src/production/sound/IAutoMovieRenderedProductionSound.ts#IAutoMovieRenderedProductionSound.IMaster

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit and its meaning when the mix is silent.

## @evidence contracts/development/design.md#principled-representation

The mix's loudness before gain, the static gain and the deepest limiting together explain how the master reached its target.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Written by `masterProductionSound` and read by the render report.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A silent mix reports null loudness and zero gains rather than invented values.
