import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasisSurface } from "../structures/surface/IAutoMovieHumanBodyBasisSurface";

/**
 * Ascending vertices whose largest skin weight belongs to a requested bone.
 *
 * Equal largest weights choose the first of four slots, matching createHumanBodySegmenter. The caller supplies admitted aligned four-slot skin arrays. Dominant rig attachment defines this measurement region rather than a physical bone or segmented tissue surface; source data remain unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Requested joint slots form a set, then every admitted vertex chooses its maximum of four skin weights with first-slot tie resolution before ascending inclusion.
 * @evidence contracts/common.md#clear-and-simple-design One attachment-region helper serves extent, reach and ground instruments without carrying geometry or independent anatomical boundaries.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Complete finite normalized skin rows remain basis-admission premises; dominant weights cannot identify physical bones, tissue segmentation or contact support.
 * @evidence contracts/common.md#meaningful-documentation The prose gives ascending source ordinals, tie behavior, four-slot admission and rig-region versus tissue meaning.
 * @evidence contracts/performance.md#efficient-algorithms Joint selection scans S slots against B requested bones, then four comparisons per V vertex give O(SB+V) work without sorting output ordinals.
 * @evidence contracts/performance.md#reuse-equivalent-work One wanted-slot set serves the whole vertex walk and the same tie policy is consumed by contact segmentation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The set expires and only the owned ordinal vector escapes; no skin arrays, geometry cache or background work are retained.
 *
 * @author Samchon
 */
export function humanBodyDominantVertices(
  surface: Pick<IAutoMovieHumanBodyBasisSurface, "skin">,
  bones: readonly AutoMovieHumanoidBone[],
): number[] {
  const { joints, boneIndices, weights }: typeof surface.skin = surface.skin;
  const wanted: Set<number> = new Set(
    joints.flatMap((joint: AutoMovieHumanoidBone, slot: number): number[] => (bones.includes(joint) ? [slot] : [])),
  );
  const vertices: number[] = [];
  if (wanted.size === 0) return vertices;
  for (let vertex: number = 0; vertex * 4 < weights.length; vertex++) {
    let best: number = 0;
    for (let k: number = 1; k < 4; k++)
      if (weights[vertex * 4 + k] > weights[vertex * 4 + best]) best = k;
    if (wanted.has(boneIndices[vertex * 4 + best])) vertices.push(vertex);
  }
  return vertices;
}
