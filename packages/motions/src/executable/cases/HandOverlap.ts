import {
  type IAutoMovieResolvedBone,
  physicalShapePairDistance,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePhysicalProfile,
} from "@automovie/interface";

import type { IHumanBody } from "../../body/IHumanBody";
import { HumanColliders } from "../../posture/HumanColliders";

/**
 * How deep two people's right hands enter each other, the rule the handshake
 * and handover cases measure interpenetration by: every right-hand phalanx
 * collider and every right forearm collider of one person against those of
 * the other, whatever kind the profile gives them, the palms left out.
 */
export namespace HandOverlap {
  /**
   * The deepest overlap between two people's right-hand phalanx and forearm
   * colliders, by the engine's shape pair distance.
   *
   * @param a One person.
   * @param aBones Their posed bones, world frame.
   * @param b The other person.
   * @param bBones Their posed bones, world frame.
   * @returns Metres, negative when overlapping; positive when apart.
   */
  export function deepest(
    a: IHumanBody,
    aBones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    b: IHumanBody,
    bBones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): number {
    let least: number = Infinity;
    const others: IPlaced[] = colliders(b, bBones);
    for (const u of colliders(a, aBones))
      for (const v of others)
        least = Math.min(
          least,
          physicalShapePairDistance(u.pose, u.shape, v.pose, v.shape),
        );
    return least;
  }
}

/** One collider with the posed frame of the segment that carries it. */
interface IPlaced {
  /** The segment's posed frame, world metres. */
  pose: IAutoMoviePhysicalProfile.ITransform;

  /** The shape, placed by `pose` composed with its own transform. */
  shape: IAutoMoviePhysicalProfile.IShape;
}

/** A person's right-hand phalanx and forearm colliders, placed. */
function colliders(
  body: IHumanBody,
  bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
): IPlaced[] {
  const digit: RegExp = /^right(Thumb|Index|Middle|Ring|Little)/;
  return HumanColliders.placed(body, bones)
    .filter(
      (segment: HumanColliders.IPlaced): boolean =>
        digit.test(segment.bone) || segment.bone === "rightLowerArm",
    )
    .flatMap((segment: HumanColliders.IPlaced): IPlaced[] =>
      segment.shapes.map(
        (shape: IAutoMoviePhysicalProfile.IShape): IPlaced => ({
          pose: segment.pose,
          shape,
        }),
      ),
    );
}
