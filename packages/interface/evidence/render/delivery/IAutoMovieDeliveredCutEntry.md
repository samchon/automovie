# src/render/delivery/IAutoMovieDeliveredCutEntry.ts#IAutoMovieDeliveredCutEntry

## @evidence contracts/development/design.md#principled-representation

One row maps a sequence entry to output frame indices of the delivered file: seconds stay on the output clock as `IAutoMoviePlaybackEntry` states them, `offset` on the shot-local clock, and `liveFrames` is a half-open `[first, endExclusive)` pair of whole frame indices, so an empty range is `[k, k)` and adjacent rows share their boundary. The tuple type fixes two members; that the ranges are whole, ordered and tile `[0, frameCount)` is guaranteed by `planAutoMovieDeliveredCut`, not by the type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

`planAutoMovieDeliveredCut` produces it, `IAutoMovieDrawnVideoResult.cut` carries it, and the CLI writes it into `render-report.json` for the scaffold's assembly handoff and request records. The copied entry fields are the ones the issue's report row names; `playbackRate` stays optional because the source entry omits it at the default rate, and copying absence keeps the row from inventing a rate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The row is keyed by `entry`, not by `shot`, since a shot can play in two entries. No camera, lens or geometry rides on it, so it is not a scene export; per-cell camera and lens stay in the capture record.

## @evidence contracts/development/common.md#meaningful-documentation

States what is copied from the playback entry, how `liveFrames` is computed and on which grid, why rows are keyed by entry, what an empty range means, that the ranges tile the frames, and that a transition's first frames belong to the incoming entry while showing mostly the outgoing shot, or only it in a fade's first half.
