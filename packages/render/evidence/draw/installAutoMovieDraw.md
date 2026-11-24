# src/draw/installAutoMovieDraw.ts#installAutoMovieDraw

## @evidence contracts/development/common.md#meaningful-documentation

States who calls it, when the subject and renderer are made, every step of a draw in order, the film picture's transition layers and the shot every record follows, why the canvas is read instead of a render target, the supersampling rule, and how the dialogue mouths are handed and reported.

## @evidence contracts/development/implementation.md#principled-implementation

WebGL's `readPixels` on the default framebuffer, read before the task ends, returns what the page shows; the inspection, the view grammar and the camera resolution are the inspection core's, so a still and the page draw the same scene through the same code. A beauty draw of a subject with optics goes through AutoMovieFilmResponseStage, the stage the inspector also draws with, so a delivered frame and a paused Viewer frame share one camera response, and the graphics plate takes the same response with alpha kept as coverage. `AutoMovieDrawFilm` plans the second by `planAutoMovieDrawPicture`: every record follows `playbackShownLayer`, the shot the picture shows most of, placed last through `seekShot` when it is a transition's outgoing shot, trails included, and its diagnostics offer no synchronous `place` then. A delivery draw or a plain beauty capture or plate composites the layers `playbackLayersAt` gives: every other layer of positive weight is placed on its own entry's clock (`playbackEntryTime`), drawn and held, the shown layer drawn and held last, and the held pictures mixed by `renderAutoMovieFilmFrame`, whose compositor mixes associated colour and alpha (Porter and Duff 1984) and fades toward alpha 0 over a transparent background and for the plate, so the plate composited in post matches the film; the witness cubes are drawn over the composite. Optics that set `samples` accumulate the shown layer's sub-frame samples, each placed on that layer's own clock, before the inspection places the second again, so a cut's first frame integrates the incoming shot's handle, as an editor's handle frames supply it, and marks, diagnostics and labels describe the frame's own second. Outside a transition the picture is drawn by exactly the calls it was drawn by before, except that a shutter sample before the live entry's start places that entry. A mask draw reports the palette `autoMovieSemanticMaskOf` finds on the scene. Framing on all the run's seconds keeps one camera per view, as `.agents/skills/visual-debugging/capture.md` asks for a view a later round compares. The mouth record is cleared right before the drawn second's own placement, after any trail, shutter or layer placements, so the reported mouths are the last reads of the drawn second.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The installer owns loading and the order of a draw's steps; `AutoMovieDrawFilm` owns the picture's plan, its layers, samples and composite, including the rule that the subject's `beforeDraw` runs right after each placement before any render mode applies; `readAutoMovieDrawResult` owns the read-back and the result; `AutoMovieDrawPlacement` owns the inspection lifecycle, framing and the mouth record, and `AutoMovieDrawBeauty` the beauty stages, the graphics plate, the held transition layers and their overlay, so each file holds one responsibility under the line limit. One placed observer is invoked by the final placement alone, before inspection. Describing, pixel encoding and pattern resolution retain their owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A subject that is not ready is awaited, never drawn half placed; a view or request the inspection refuses throws to the host, which records the cell as not drawn; a transition or a cut's shutter sample that needs `seekShot` from a subject without it is refused by name rather than drawn on another shot's clock.

## @evidence contracts/development/implementation.md#efficient-algorithms

A draw places the actual second and applies inspection to its current objects, then renders and reads back linearly in pixels. A new fitted view additionally places and inspects each framing second; trails add their requested samples. A frame inside a transition adds, for each other layer of positive weight, one placement, its samples when the optics have them, and one draw, plus one canvas copy per drawn layer and the compositor's pass; so a dissolve's first half places the live entry once more, and a layer of weight 0, the live entry on a dissolve's first frame or at a fade's midpoint, costs nothing.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The subject, renderer, stages and framing boxes keyed by view/selection/seconds are shared across draws. Inspection handles are recreated after placement because seek may replace geometry; unchanged request text proves no object identity or measurement equivalence. Held transition layers are copied from the canvas for every frame that composites them.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The page holds one subject, one renderer, one placement with one applied inspection, one box per framed view and at most one mouth recorder, and one beauty owner with its stages and at most two held layer copies, for its life; leaving the page restores the inspection and disposes the subject, the beauty owner and the renderer.
