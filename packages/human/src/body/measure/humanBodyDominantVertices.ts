import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasisSurface } from "../structures/surface/IAutoMovieHumanBodyBasisSurface";

/**
 * The vertices of one surface whose largest skin weight belongs to one of
 * `bones`, ascending.
 *
 * Among equal largest weights the first slot wins, the rule
 * `createHumanBodySegmenter` uses. A dominant weight is a rig attachment, so
 * the set is a skin region attached to those bones, not a bone surface.
 *
 * @author Samchon
 */
export function humanBodyDominantVertices(
  surface: Pick<IAutoMovieHumanBodyBasisSurface, "skin">,
  bones: readonly AutoMovieHumanoidBone[],
): number[] {
  const { joints, boneIndices, weights } = surface.skin;
  const wanted = new Set(
    joints.flatMap((joint, slot) => (bones.includes(joint) ? [slot] : [])),
  );
  const vertices: number[] = [];
  if (wanted.size === 0) return vertices;
  for (let vertex = 0; vertex * 4 < weights.length; vertex++) {
    let best = 0;
    for (let k = 1; k < 4; k++)
      if (weights[vertex * 4 + k] > weights[vertex * 4 + best]) best = k;
    if (wanted.has(boneIndices[vertex * 4 + best])) vertices.push(vertex);
  }
  return vertices;
}
