# src/cinematics/IAutoMovieCameraCoverageEntry.ts#IAutoMovieCameraCoverageEntry

## @evidence contracts/development/design.md#principled-representation

Extends the hero take's frame entry with the intent record, so `compileCameraCoverage` maps the same entry list to both the camera move and the intent spans and the two lists cannot diverge in length or order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Reuses `IAutoMovieCameraFrameEntry` for the solve inputs and adds one field, rather than a parallel intent array the caller would have to keep aligned.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The intent rides as guide metadata only; the camera solve never reads it, and the lens fields stay null rather than being invented for an alternate angle.

## @evidence contracts/development/common.md#meaningful-documentation

States what the bundle is for, the one-to-one correspondence it guarantees, how the producer fills it including the beat-long span and null lens fields, and what the intent member holds.
