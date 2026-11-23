# src/scene/filmResponse/AutoMovieFilmResponseStage.ts#AutoMovieFilmResponseStage

## @evidence contracts/development/design.md#principled-representation

One stage per renderer owns the linear half-float target with its depth texture, the glare pyramid and blur targets, and the four programs; a frame depends only on the optics and scene of its own draw.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The draw host and the inspector each hold one and call draw and dispose; final exposes the final program so the uniforms the shader receives can be compared with the engine's closed forms.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member names a film or host; the display overlay rule is the toneMapped convention inspection materials already state.

## @evidence contracts/development/common.md#meaningful-documentation

The class comment lists the four steps in order, the overlay rule and its shadow limit, what absent optics draws, what is restored and the resource lifetime.
# src/scene/filmResponse/AutoMovieFilmResponseStage.ts#AutoMovieFilmResponseStage.prototype.draw

## @evidence contracts/development/common.md#meaningful-documentation

States the props, the admission before drawing and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Draws the scene into a linear target with the renderer's own curve and exposure neutral, blurs the glare kernels on a box pyramid, then one final pass applies glare, the engine's exposure and white-balance matrix, the curve, the sRGB encoding and the CDL grade, writing the linear depth so display overlays drawn last are occluded by the scene. Absent optics is one plain render, the pre-stage behaviour.

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
# src/scene/filmResponse/AutoMovieFilmResponseStage.ts#AutoMovieFilmResponseStage.prototype.dispose

## @evidence contracts/development/common.md#meaningful-documentation

States what is released.

## @evidence contracts/development/implementation.md#principled-implementation

Disposes the targets, the depth texture, the programs and the quad geometry.

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
