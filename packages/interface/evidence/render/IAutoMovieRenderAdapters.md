# src/render/IAutoMovieRenderAdapters.ts#IAutoMovieRenderAdapters

## @evidence contracts/development/design.md#principled-representation

Separate asynchronous capture and encoding callbacks expose the two host effects while preserving clip-local seconds and frame naming at the capture boundary.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The renderer-agnostic loop receives host I/O through this record so no browser, GPU or ffmpeg implementation enters scheduling.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The callbacks are the supported injection seam, not replacements for a global or foreign method; their failures remain rejected promises.

## @evidence contracts/development/common.md#meaningful-documentation

Members define clip-local seconds, zero-based index, destination directory, encoder arguments and returned written paths.
