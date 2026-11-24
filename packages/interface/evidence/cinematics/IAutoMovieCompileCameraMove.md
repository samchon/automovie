# src/cinematics/IAutoMovieCompileCameraMove.ts#IAutoMovieCompileCameraMove.IProps

## @evidence contracts/development/design.md#principled-representation

Positions and subject bounds use world metres, camera fovY uses degrees, actions use shot-local seconds and the frame rate is an exact rational in frames per second. performShot gates timing and camera inputs; this low-level compiler does not validate all numerical premises or guarantee visible enclosure between keys.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Hero and coverage compilation share the same camera/action/subject contracts and differ only in their staged camera, entries and clip identity.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The optional aspect has a stated square fallback; it is not evidence that a narrower output contains the subject. The optional frame rate falls back to 24 fps, which keys the paths but does not align them with another delivery rate. No camera or subject identity changes the grammar.

## @evidence contracts/development/common.md#meaningful-documentation

Defines world placement, timebase, aspect and frame-rate fallbacks, input ordering, callback lifetime and the null/error outcomes.
