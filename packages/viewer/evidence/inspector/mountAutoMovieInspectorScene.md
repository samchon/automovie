# src/inspector/mountAutoMovieInspectorScene.ts#mountAutoMovieInspectorScene

## @evidence contracts/development/common.md#meaningful-documentation

States the arrival sequence, the fallback on refusal, what a frame does and when it redraws, the error rule, the aspect rule, the lifecycle guarantees, which view and pass are drawn, and how labels and focus are placed.

## @evidence contracts/development/implementation.md#principled-implementation

The scene is changed only through render's inspection, which restores before re-applying; views are resolved by render's view resolver on the inspection's drawn bounds, and the delivery camera takes the raster's aspect as the capture does. Wall time comes from the frame callback's own timestamp, so a frame's advance is the time actually elapsed. The subject's seek promise is the draw contract's readiness signal, so a picture is drawn only once the subject reports it can be.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One closure owns one mount: arrival, apply, frame, seek, paint, failure and dispose are local steps over one record of what is held; React, the DOM and WebGL stay with the component and the host. A transition's outgoing shot is planned, placed, painted and held by `AutoMovieInspectorTransition` before the seek and composited with the live picture after it, on render's `planAutoMovieDrawLayers` and compositor, the ones the draw page uses, so the Viewer paints the transition frame delivery and capture draw at the same second.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A refused request is reported with the request still drawn rather than drawn half-applied, an instance that arrives after dispose is released rather than drawn, and no frame is drawn from a size that is not positive.

## @evidence contracts/development/implementation.md#efficient-algorithms

A frame that changed nothing costs one size read and one snapshot comparison; a redraw costs the subject's seek, the opted-in observation, the inspection's update linear in its marks, one view resolution and the render. A full inspection re-application per redraw happens only while the request changes what the observation would read. Paths and the first second's marks are listed once per mount. A redraw inside a transition adds the outgoing shot's placement and draw, two canvas copies and one composite pass.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The applied inspection, the renderer and the instance live for the whole mount; an inspection is re-applied only when its written text changes or when it had to be restored for an observation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The mount owns one instance, one renderer, one applied inspection, one witness-cube overlay, one transition owner with at most two held copies and at most one pending frame, released by `dispose` in reverse order, each attempted even when another fails; the playhead is borrowed and gains no listener.
