import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  closestPointsBetweenSegments,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../../body/IHumanBody";

/**
 * How deep two people's right hands enter each other, the rule the handshake
 * and handover cases measure interpenetration by: every right-hand phalanx
 * capsule and the right forearm capsule of one person against those of the
 * other, the palm boxes left out.
 */
export namespace HandOverlap {
  /**
   * The deepest overlap between two people's right-hand phalanx and forearm
   * capsules.
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
    for (const u of capsules(a, aBones))
      for (const v of capsules(b, bBones))
        least = Math.min(
          least,
          closestPointsBetweenSegments(u.p, u.q, v.p, v.q).distance - u.r - v.r,
        );
    return least;
  }
}

/** A placed capsule: its core segment and radius, metres. */
interface ICapsule {
  p: IAutoMovieVector3;
  q: IAutoMovieVector3;
  r: number;
}

/** A person's right-hand phalanx and forearm capsules, placed. */
function capsules(
  body: IHumanBody,
  bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
): ICapsule[] {
  const digit: RegExp = /^right(Thumb|Index|Middle|Ring|Little)/;
  return body.profile.segments
    .filter((x) => digit.test(x.bone) || x.bone === "rightLowerArm")
    .flatMap((x): ICapsule[] =>
      x.shapes.flatMap((shape): ICapsule[] => {
        if (shape.kind !== "capsule") return [];
        const bone: IAutoMovieResolvedBone = bones.get(
          x.bone as AutoMovieHumanoidBone,
        )!;
        const centre: IAutoMovieVector3 = Vector3.add(
          bone.worldPosition,
          Quaternion.rotateVector(bone.worldRotation, shape.transform.position),
        );
        const axis: IAutoMovieVector3 = Quaternion.rotateVector(
          Quaternion.multiply(bone.worldRotation, shape.transform.rotation),
          { x: 0, y: shape.halfLength, z: 0 },
        );
        return [
          {
            p: Vector3.subtract(centre, axis),
            q: Vector3.add(centre, axis),
            r: shape.radius,
          },
        ];
      }),
    );
}
