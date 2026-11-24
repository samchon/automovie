# src/inspector/mountAutoMovieInspectorScene.ts#mountAutoMovieInspectorScene

## @evidence contracts/development/common.md#meaningful-documentation

States the arrival sequence, the fallback on refusal, what a frame does and when it redraws, the error rule, the aspect rule, the lifecycle guarantees, which view and pass are drawn, and how labels and focus are placed.

## @evidence contracts/development/implementation.md#principled-implementation

The scene is changed only through render's inspection, which restores before re-applying; views are resolved by render's view resolver on the inspection's drawn bounds, and the delivery camera takes the raster's aspect as the capture does. Wall time comes from the frame callback's own timestamp, so a frame's advance is the time actually elapsed. The subject's placement promise is the draw contract's readiness signal, so a picture is drawn only once the subject reports it can be. The shot the picture shows most of is placed last, by `seekShot` when it is a transition's outgoing shot, so the observation, which then offers no synchronous `place`, the marks and the camera follow it as the draw page's records do. The subject's `beforeDraw` runs once per painted second right after that placement and before any shade applies, on the scene's own materials, as the draw host runs it, so surface feeds show the beauty picture in every shade; an inspection that changes materials or layers is lifted around the seek for it. A renderer double without render targets skips it. Beauty pictures run render's response stage inside its indirect stage through `AutoMovieInspectorBeauty`, so optics and shading match a delivered single-sample frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One closure owns one mount: arrival, apply, frame, seek, paint, failure and dispose are local steps over one `IAutoMovieInspectorLive` record, with the facts read, the raster check, the size following, the inspection install, the view camera, the labels and the release in their own files; React, the DOM and WebGL stay with the component and the host. `AutoMovieInspectorTransition` plans and places the second, painting and holding a transition's other layers before the shown one and compositing them after its records, on render's `planAutoMovieDrawPicture`, `placeAutoMovieDrawLayer` and compositor, the ones the draw page uses, so the Viewer paints the transition frame delivery and capture draw at the same second, with the witness cubes over the composite.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A refused request is reported with the request still drawn rather than drawn half-applied, an instance that arrives after dispose is released rather than drawn, and no frame is drawn from a size that is not positive.

## @evidence contracts/development/implementation.md#efficient-algorithms

A frame that changed nothing costs one size read and one snapshot comparison; a redraw costs the subject's seek, the opted-in observation, the inspection's update linear in its marks, one view resolution and the render. A full inspection re-application per redraw happens only while the request changes what the observation would read. Paths and the first second's marks are listed once per mount. A redraw inside a transition adds the other drawn layer's placement and draw, one canvas copy per drawn layer and one composite pass.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The applied inspection, the renderer and the instance live for the whole mount; an inspection is re-applied only when its written text changes or when it had to be restored for an observation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The mount owns one instance, one renderer, one beauty owner with its two film stages, one applied inspection, one witness-cube overlay, one transition owner with at most two held copies and at most one pending frame, each released by `dispose`, each attempted even when another fails; the playhead is borrowed and gains no listener.
