import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { HumanDigitFit } from "../posture/HumanDigitFit";

/**
 * Upper bound in metres on the left index and middle fingertip separation.
 * The posed proximal joints give the knuckle spacing and each digit's
 * remaining joint lengths give its greatest possible extension.
 *
 * @param body The performer whose fingertip surfaces complete the chains.
 * @param bones The resolved entry bones from which invariant distances are read.
 * @returns The triangle-inequality bound for the two articulated tips.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the measured chains, units and meaning of the bound.
 * @evidence contracts/development/implementation.md#principled-implementation Adds the knuckle separation and both articulated chain lengths.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The two chains are read with their distal fingertip offsets in one traversal each.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The bound uses the performer's own bones and surfaces. A point inside the bound still needs a joint fit.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work over two three-bone chains.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the posed entry bones already needed for both arm goals.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a scalar and retains no pose.
 */
export function guitarFrettingSpan(
  body: IAutoMovieMotionHumanBody,
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
): number {
  const index: AutoMovieHumanoidBone[] = HumanDigitFit.bones("left", "Index");
  const middle: AutoMovieHumanoidBone[] = HumanDigitFit.bones("left", "Middle");
  const knuckles: number = Vector3.length(
    Vector3.subtract(
      bones.get(index[0]!)!.worldPosition,
      bones.get(middle[0]!)!.worldPosition,
    ),
  );
  const chains: readonly [
    AutoMovieHumanoidBone[],
    IAutoMovieHumanoidSurfaces.IFrame,
  ][] = [
    [index, body.surfaces.regions.indexTipLeft],
    [middle, body.surfaces.regions.middleTipLeft],
  ];
  let length: number = knuckles;
  for (const [chain, tip] of chains) {
    length += Vector3.length(tip.point);
    for (let i: number = 1; i < chain.length; ++i)
      length += Vector3.length(
        Vector3.subtract(
          bones.get(chain[i]!)!.worldPosition,
          bones.get(chain[i - 1]!)!.worldPosition,
        ),
      );
  }
  return length;
}
