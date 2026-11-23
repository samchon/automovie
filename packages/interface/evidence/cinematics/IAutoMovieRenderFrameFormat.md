# src/cinematics/IAutoMovieRenderFrameFormat.ts#IAutoMovieRenderFrameFormat

## @evidence contracts/development/design.md#principled-representation `frameTimes` derives `round(duration * fps)` frames sampled at the exact rational `i / fps`, and `ffmpegArgs` passes `fps` as both input and output rate and pins the encoded size with `-s width x height`, so the clock and raster here are the ones the encoder writes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Clock, raster and optional crop sit in one value nested under `IAutoMovieRenderSpec.frameFormat`, separate from the encoder settings, because the sidecars need the former and never the latter.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Nothing rounds an odd dimension up behind the caller; the remaining gap is that the plain render path does not check evenness or integrality, which the `width` documentation states, while the production render job checks evenness of its own frame format.

## @evidence contracts/development/common.md#meaningful-documentation

States what the clock sets, the units and parity rule of each dimension and why, who must enforce it, and that an omitted or whole-frame crop changes nothing.
