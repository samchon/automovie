/**
 * Name of the viewer mesh drawing one flame cue, which is also its semantic
 * mask id: `flame:<node>/<cue id>`.
 *
 * Mirrors `prepareAutoMovieFlames` in `render`. The engine cannot import the
 * viewer and the mask has to be derivable without a renderer, so the name both
 * sides agree on lives here.
 */
export function autoMovieFlameNodeName(node: string, cue: string): string {
  return `flame:${node}/${cue}`;
}
