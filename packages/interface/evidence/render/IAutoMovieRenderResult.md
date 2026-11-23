# src/render/IAutoMovieRenderResult.ts#IAutoMovieRenderResult

## @evidence contracts/development/design.md#principled-representation

The encoded output path is accompanied by the half-open sample schedule and frame records, retaining encode order and the exact encoder argument vector.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One result envelope supplies both direct clip rendering and the inspectable render wrapper without another path inference layer.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The result exposes host-returned output and frame paths; its type makes no claim that an encoder succeeded beyond the callback outcome.

## @evidence contracts/development/common.md#meaningful-documentation

Members explain seconds, frame ordering, directory, input pattern and the distinction between adapter output and requested paths.
