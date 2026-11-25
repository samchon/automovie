# src/render/capture/IAutoMovieCaptureCellRecord.ts#IAutoMovieCaptureCellRecord

## @evidence contracts/development/design.md#principled-representation

The cell's fixing values and sheet position are shared by both outcomes. A drawn still has a file, a pixel hash, an optional encoded-file digest, backend, camera and resolved paths. A failed cell records its cause.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Capture execution publishes cell outcomes. Round comparison, production verification, command, motion and archetype reporting consume them independently of complete capture metadata. Existing records retain the pixel hash when an encoded digest is absent.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The two outcomes are union members keyed by `state`.

## @evidence contracts/development/common.md#meaningful-documentation

States what each member holds and its unit.
