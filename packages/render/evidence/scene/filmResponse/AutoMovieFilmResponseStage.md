# src/scene/filmResponse/AutoMovieFilmResponseStage.ts#AutoMovieFilmResponseStage

## @evidence contracts/development/design.md#principled-representation

One stage per renderer owns the linear half-float target with its depth texture, the glare pyramid and blur targets, and the four programs; a frame depends only on the optics and scene of its own draw.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The draw host and the inspector each hold one and call draw and dispose; final exposes the final program so the uniforms the shader receives can be compared with the engine's closed forms.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member names a film or host; the display overlay rule is the toneMapped convention inspection materials already state.

## @evidence contracts/development/common.md#meaningful-documentation

The class comment lists the four steps in order, the overlay rule and its shadow limit, what absent optics draws, how `alpha` is carried through every step and to which colour the response is given, what is restored and the resource lifetime.
# src/scene/filmResponse/AutoMovieFilmResponseStage.ts#AutoMovieFilmResponseStage.prototype.draw

## @evidence contracts/development/common.md#meaningful-documentation

States the props, the admission before drawing and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Draws the scene into a linear target with the renderer's own curve and exposure neutral, blurs the glare kernels on a box pyramid, then one final pass applies glare, the engine's exposure and white-balance matrix, the curve, the sRGB encoding and the CDL grade, writing the linear depth so display overlays drawn last are occluded by the scene. Absent optics is one plain render, the pre-stage behaviour. Each linear render is followed by the medium pass, which marches a scene's medium in place; a scene with a medium and no optics is refused, since no other path can draw it. With `accumulated` the linear target already holds the average of the second's sub-frame samples and the scene draw is skipped, so the response, glare and overlays apply to that average. With `alpha` the linear target's colour is associated with its coverage, as blending over a transparent clear leaves it: the glare and the medium, linear in it, act on colour and alpha alike, and the final pass divides by alpha before its nonlinear steps and multiplies back after, so exposure, white balance, the curve, the encoding and the grade change colour and never alpha (Porter and Duff 1984); without `alpha` the final uniform keeps the opaque path, whose colour arithmetic is the one before alpha was carried.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission, the matrix and the plan are delegated to their owners; draw owns only pass order and state restoration, with preparation and glare as private steps.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

All renderer, scene, layer and background state is restored in a finally block; the overlay layer is chosen free of every mask in the scene rather than assumed.

## @evidence contracts/development/implementation.md#efficient-algorithms

One linear scene draw, one overlay draw when overlays exist, two scene traversals for overlays and a free layer, and with glare at most five pyramid steps and six bounded blur passes on reduced targets.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Targets are reused across draws while the raster is unchanged; uniforms are rewritten every draw, so nothing from an earlier frame reaches a later one.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Targets are allocated on the first draw with optics and on a raster change, replacing the previous set, which is disposed; the stage owns them until dispose.
# src/scene/filmResponse/AutoMovieFilmResponseStage.ts#AutoMovieFilmResponseStage.prototype.accumulate

## @evidence contracts/development/common.md#meaningful-documentation

States the caller's placement premise, when optics are admitted, and that the sum belongs to `AutoMovieFilmSampleSum`.

## @evidence contracts/development/implementation.md#principled-implementation

Admits the optics at sample 0, sizes the stage's targets and sets the final pass's uniforms as `draw` does, then hands the linear target to the sample sum, so the averaged frame gets exactly the response a single draw gets.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The stage owns its targets and response; the sum's targets, program and ping-pong live in `AutoMovieFilmSampleSum`, which keeps the stage under one responsibility per class.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No sample is weighted or skipped; equal weights follow the issue's box filter over the shutter interval and aperture.

## @evidence contracts/development/implementation.md#efficient-algorithms

Per sample one scene draw and one full-frame pass; one more pass on the last sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Targets are reused while the raster is unchanged; sample 0 restarts the sum, so nothing of an earlier second is reused.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The stage's targets as in `draw`, plus the sum's two float targets, released by `dispose`.
# src/scene/filmResponse/AutoMovieFilmResponseStage.ts#AutoMovieFilmResponseStage.prototype.dispose

## @evidence contracts/development/common.md#meaningful-documentation

States what is released.

## @evidence contracts/development/implementation.md#principled-implementation

Disposes the targets, the depth texture, the programs, the quad geometry and the sample sum.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One release path shared with resizing for the targets.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Releases every GPU object the stage created; the renderer and scene are the caller's.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the handful of targets.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Nothing is shared beyond the stage.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

After dispose the stage holds no GPU resource; the hosts call it when their renderer is released.
