# src/render/IAutoMovieSequenceRenderResult.ts#IAutoMovieSequenceRenderResult

## @evidence contracts/development/design.md#principled-representation

The result records captured samples in encode order alongside the executed manifest, schedule and actual encoded path.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Keeping the exact plan with captured frames lets inspection compare intended sequence samples with host-returned artifacts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Frame paths are capture results and the output is the encoder result; neither is guessed from a fixture or inferred pattern.

## @evidence contracts/development/common.md#meaningful-documentation

Members distinguish global sample seconds, capture-order records, input pattern, directory and exact encoder arguments.
