# src/IAutoMovieFfmpegSources.ts#IAutoMovieFfmpegSources

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what the resolver reads from it.

## @evidence contracts/development/design.md#principled-representation

The environment the resolver reads `FFMPEG_PATH` from, and the production's loader of `ffmpeg-static` typed by that module's declared export.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `resolveAutoMovieFfmpeg`; filled by the capture and render commands and the motions capture script.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Two required members; no optional combination arises.