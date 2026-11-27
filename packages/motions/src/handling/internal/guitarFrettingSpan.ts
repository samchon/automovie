import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { HumanDigitFit } from "../../posture/HumanDigitFit";

/**
 * Upper bound in metres on the left index and middle fingertip separation. The
 * posed proximal joints give the knuckle spacing and each digit's remaining
 * joint lengths give its greatest possible extension.
 *
 * @param body The performer whose fingertip surfaces complete the chains.
 * @param bones The resolved entry bones from which invariant distances are
 *   read.
 * @returns The triangle-inequality bound for the two articulated tips.
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
