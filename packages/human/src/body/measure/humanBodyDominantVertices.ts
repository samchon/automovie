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
 * @evidence contracts/common.md#principled-implementation One owner selects a dominant-bone region for every instrument that reads one.
 * @evidence contracts/common.md#clear-and-simple-design One pass over the four influence slots.
 * @evidenceExclude contracts/common.md#prohibited-implementation-shortcuts It selects vertices and substitutes nothing.
 * @evidence contracts/common.md#meaningful-documentation States the tie rule and that the region is a rig attachment.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The region is a rig attachment, not an anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits vertex indices, not geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions It reads weights, not positions.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The skin owns its surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation Its readers own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range It admits no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It is not an authoring input.
 * @author Samchon
 */
export function humanBodyDominantVertices(
  surface: Pick<IAutoMovieHumanBodyBasisSurface, "skin">,
  bones: readonly AutoMovieHumanoidBone[],
): number[] {
  const { joints, boneIndices, weights } = surface.skin;
  const wanted = new Set(joints.flatMap((joint, slot) => (bones.includes(joint) ? [slot] : [])));
  const vertices: number[] = [];
  if (wanted.size === 0) return vertices;
  for (let vertex = 0; vertex * 4 < weights.length; vertex++) {
    let best = 0;
    for (let k = 1; k < 4; k++) if (weights[vertex * 4 + k] > weights[vertex * 4 + best]) best = k;
    if (wanted.has(boneIndices[vertex * 4 + best])) vertices.push(vertex);
  }
  return vertices;
}
