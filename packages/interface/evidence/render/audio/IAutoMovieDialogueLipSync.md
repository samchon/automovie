# src/render/audio/IAutoMovieDialogueLipSync.ts#IAutoMovieDialogueLipSync

## @evidence contracts/development/common.md#meaningful-documentation

States the measured entry, both unmeasured reasons, why the envelope line is not measured and which entries block.

## @evidence contracts/development/design.md#principled-representation

A union discriminated by status: a measured entry carries the measurement result; an unmeasured one its reason.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Written by render's lip-sync route, carried through the mix and drawn video results into `render-report.json`, and read by the CLI's publication gate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The measurement fields are absent from unmeasured entries rather than zeroed.
