/**
 * The `userData` key that marks the root object of one surface graphic track.
 *
 * `prepareSurfaceGraphics` sets it to `true` on every root it builds,
 * and the render-mode boundary reads it to hide surface graphics in the passes
 * that leave them out, so both address the same mark without a second registry
 * outside the scene.
 */
export const AutoMovieRenderSurfaceGraphicKey: string = "automovieSurfaceGraphic";
