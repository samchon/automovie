/**
 * Name of the viewer object drawing one surface graphic track, which is also
 * its semantic mask id: `surface-graphic:<node>/<surface>`.
 *
 * Mirrors `prepareAutoMovieSurfaceGraphics` in `render`. The engine cannot
 * import the viewer and the mask has to be derivable without a renderer, so the
 * name both sides agree on lives here.
 */
export function autoMovieSurfaceGraphicNodeName(
  node: string,
  surface: string,
): string {
  return `surface-graphic:${node}/${surface}`;
}
