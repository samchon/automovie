# src/draw/installAutoMovieDraw.ts#installAutoMovieDraw

## @evidence contracts/development/common.md#meaningful-documentation

States who calls it, when the subject and renderer are made, every step of a draw in order, the film picture's transition layers, why the canvas is read instead of a render target, the supersampling rule, and how the dialogue mouths are handed and reported.

## @evidence contracts/development/implementation.md#principled-implementation

WebGL's `readPixels` on the default framebuffer, read before the task ends, returns what the page shows; the inspection, the view grammar and the camera resolution are the inspection core's, so a still and the page draw the same scene through the same code. A beauty draw of a subject with optics goes through AutoMovieFilmResponseStage, the stage the inspector also draws with, so a delivered frame and a paused Viewer frame share one camera response, and the graphics plate takes the same response with alpha kept as coverage. A delivery draw or a plain beauty capture of optics that set `samples` places the second, reads its optics, and accumulates the planned sub-frame samples before the inspection places the second again, so marks, diagnostics and labels describe the frame's own second while the picture integrates the shutter and the lens. The same film pictures draw the layers `playbackLayersAt` gives, the instants `playbackCursor` resolves: a transition's outgoing shot is placed through `seekShot` on its own entry's clock (`playbackEntryTime`), sampled and drawn like the live one and held, and the held pictures are mixed by `renderAutoMovieFilmFrame`, whose compositor mixes associated colour and alpha (Porter and Duff 1984) and fades toward alpha 0 over a transparent background. Outside a transition `planAutoMovieDrawLayers` returns null and the picture is drawn by exactly the calls it was drawn by before. A mask draw reports the palette `autoMovieSemanticMaskOf` finds on the scene. Framing on all the run's seconds keeps one camera per view, as `.agents/skills/visual-debugging/capture.md` asks for a view a later round compares. The mouth record is cleared right before the drawn second's own seek, after any trail, shutter or outgoing-shot seeks, so the reported mouths are the last reads of the drawn second.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The installer owns loading and the order of a draw's steps; `AutoMovieDrawPlacement` owns the inspection lifecycle, framing and the mouth record, `AutoMovieDrawBeauty` the beauty stages, the graphics plate and the held transition layers, and `planAutoMovieDrawLayers` the transition plan, so each file holds one responsibility under the line limit. One placed observer is invoked by the final seek alone, before inspection. Describing, pixel encoding and pattern resolution retain their owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A subject that is not ready is awaited, never drawn half placed; a view or request the inspection refuses throws to the host, which records the cell as not drawn; a transition that needs `seekShot` from a subject without it is refused by name rather than drawn as a hard cut.

## @evidence contracts/development/implementation.md#efficient-algorithms

A draw places the actual second and applies inspection to its current objects, then renders and reads back linearly in pixels. A new fitted view additionally places and inspects each framing second; trails add their requested samples. A frame inside a transition adds one placement and one draw of the outgoing shot, two canvas copies and the compositor's pass; a fade's first half skips the live entry's samples, which it does not draw.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The subject, renderer, stages and framing boxes keyed by view/selection/seconds are shared across draws. Inspection handles are recreated after placement because seek may replace geometry; unchanged request text proves no object identity or measurement equivalence. Held transition layers are copied from the canvas for every frame that composites them.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The page holds one subject, one renderer, one placement with one applied inspection, one box per framed view and at most one mouth recorder, and one beauty owner with its stages and at most two held layer copies, for its life; leaving the page restores the inspection and disposes the subject, the beauty owner and the renderer.
