# src/render/audio/IAutoMovieDialogueLipSync.ts#IAutoMovieDialogueLipSync

## @evidence contracts/development/common.md#meaningful-documentation

States which line is measured and against what, the three unmeasured reasons with what each means, why a jaw-driven mouth is not measured, and which entries block.

## @evidence contracts/development/design.md#principled-representation

A union discriminated by status: a measured entry carries the measurement result; an unmeasured one its reason.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Written by render's lip-sync measure on the drawn video's mouths, carried by the drawn video's sound record into `render-report.json`, and read by the CLI's publication gate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The measurement fields are absent from unmeasured entries rather than zeroed.
