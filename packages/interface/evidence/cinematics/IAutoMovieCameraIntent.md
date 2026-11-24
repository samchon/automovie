# src/cinematics/IAutoMovieCameraIntent.ts#IAutoMovieCameraIntent

## @evidence contracts/development/design.md#principled-representation `performShot` writes one intent per live-camera `frame` action, copying start, framing, move, focal length and, when authored, the f-number and resolving ordinary focus at shot time `0` and a timed pull at its two marked instants; a coverage take writes one intent at `0` with both lens fields `null`, and the shot artifact validator bounds `start` to the shot and `focalLength` and `fNumber` above `0`.

## @evidence contracts/development/design.md#minimal-and-owned-surface `framing` and `move` index into `IAutoMovieCameraAction` so the recorded vocabulary is the authored one, and the lens fields are nullable members rather than optional ones so every span states whether the author chose them. The second mark appears only on an authored focus pull.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A focus pull records two world marks for a downstream host to interpret. Ordinary focus retains the historical opening read.

## @evidence contracts/development/common.md#meaningful-documentation

States that the record is guide metadata the solve ignores, the time at which focus is resolved, the seconds and millimetre units, the bounds, and what each `null` means.
