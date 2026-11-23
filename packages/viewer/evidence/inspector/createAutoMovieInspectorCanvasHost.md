# src/inspector/createAutoMovieInspectorCanvasHost.ts#createAutoMovieInspectorCanvasHost

## @evidence contracts/development/common.md#meaningful-documentation

States what each member is in a browser, the context reuse across mounts and the zero-size case.

## @evidence contracts/development/implementation.md#principled-implementation `requestAnimationFrame` paces drawing to the display and stops in a hidden tab; `clientWidth` and `clientHeight` are the CSS size the page laid out, and `devicePixelRatio` scales the buffer to device pixels.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Four one-line members over the canvas and its window.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No global is replaced; the canvas's own window is used, so a canvas in another frame paces by that frame.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant per call.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A host computes nothing to reuse; the mount reuses its renderer.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the borrowed canvas only; each renderer it creates is owned and disposed by the mount that asked for it.
