# src/draw/installAutoMovieDraw.ts#installAutoMovieDraw

## @evidence contracts/development/common.md#meaningful-documentation

States who calls it, when the subject and renderer are made, every step of a draw in order, why the canvas is read instead of a render target, and the supersampling rule.

## @evidence contracts/development/implementation.md#principled-implementation

WebGL's `readPixels` on the default framebuffer, read before the task ends, returns what the page shows; the inspection, the view grammar and the camera resolution are the inspection core's, so a still and the page draw the same scene through the same code. A beauty draw of a subject with optics goes through AutoMovieFilmResponseStage, the stage the inspector also draws with, so a delivered frame and a paused Viewer frame share one camera response; structural passes never ask for optics. A mask draw reports the palette `autoMovieSemanticMaskOf` finds on the scene, the same lookup `applyRenderMode` chose it by, so the host records the convention the pixels were painted with. Framing on all the run's seconds keeps one camera per view, as `.agents/skills/visual-debugging/capture.md` asks for a view a later round compares.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One placed observer is invoked by the final seek alone, before inspection. One loader owns the subject/renderer, one placer seeks and gathers marks/trails, one inspection lifecycle restores before placement and binds current objects, and one bounds cache is keyed by view/selection/trails. Describing, pixel encoding and pattern resolution retain their owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A subject that is not ready is awaited, never drawn half placed; a view or request the inspection refuses throws to the host, which records the cell as not drawn.

## @evidence contracts/development/implementation.md#efficient-algorithms

A draw places the actual second and applies inspection to its current objects, then renders and reads back linearly in pixels. A new fitted view additionally places and inspects each framing second; trails add their requested samples. Each necessary inspection includes its mesh/triangle measurements rather than silently measuring removed objects.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The subject, renderer and framing boxes keyed by view/selection/seconds are shared across draws. Inspection handles are recreated after placement because seek may replace geometry; unchanged request text proves no object identity or measurement equivalence.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The page holds one subject, one renderer, one film response stage, one applied inspection and one box per framed view for its life; leaving the page restores the inspection and disposes the subject, the stage and the renderer.
