import {
  ROM_TOLERANCE,
  Vector3,
  bracketedBisection,
  getConstraint,
  physicalShapeSpan,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";

import { AutoMovieMotionHumanHand } from "../compose/AutoMovieMotionHumanHand";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/** Open the working hand against its palmar plane as it arrives at the floor. */
export function bendFloorHand(
  body: IAutoMovieMotionHumanBody,
  shape: IAutoMovieMotionHumanPosture,
  side: AutoMovieHumanSide,
  to: number,
  weight: (seconds: number) => number,
): IAutoMovieMotionHumanPrimitive {
  const flat = AutoMovieMotionHumanHand.shape({
    side,
    shape: "flat",
    from: 0,
    to,
    weight,
  });
  const thumb: AutoMovieHumanoidBone = `${side}ThumbMetacarpal`;
  const range = getConstraint(
    thumb,
    body.bones.get(thumb)?.constraint ?? null,
  )?.twist;
  if (!range) return flat;
  const requested: ReadonlySet<AutoMovieHumanoidBone> =
    new Set<AutoMovieHumanoidBone>([
      `${side}Hand`,
      thumb,
      `${side}ThumbProximal`,
      `${side}ThumbDistal`,
    ]);
  const read = poseBones.prepare(body, requested);
  const place = HumanColliders.preparePlaced(body, requested);
  const straight = HumanHand.shape(side, "flat");
  const base = straight[thumb]!;
  // Only the local shape of the hand matters. Read the thumb in its palm
  // plane and leave the wrist, its contact and all other fingers in place.
  const penetration = (twist: number): number => {
    const pose: IAutoMovieMotionHumanPosture = {
      ...shape,
      limbs: {},
      joints: { ...straight, [thumb]: [base[0], base[1], twist] },
    };
    const bones = read(
      resolveHumanPosture.seeded(
        body,
        pose,
        undefined,
        {},
        undefined,
        requested,
      ).pose,
    );
    const palm = HumanHand.frame(body, bones, side, "palm", "flat");
    let highest: number = -Infinity;
    for (const part of place(bones))
      if (part.bone !== `${side}Hand`)
        for (const collider of part.shapes)
          highest = Math.max(
            highest,
            physicalShapeSpan(part.pose, collider, palm.normal)[1],
          );
    return highest - Vector3.dot(palm.point, palm.normal);
  };
  if (penetration(base[2]) <= 0) return flat;
  const lower: number = penetration(range.min),
    upper: number = penetration(range.max);
  const limit: number = (lower < upper ? range.min : range.max) - base[2];
  const sign: number = Math.sign(limit);
  const turn: number =
    Math.min(lower, upper) > 0
      ? limit
      : sign *
        bracketedBisection(
          (offset: number): boolean => penetration(base[2] + sign * offset) > 0,
          0,
          Math.abs(limit),
          ROM_TOLERANCE,
        );
  return {
    ...flat,
    write: (posture, seconds, previous, resolution, projection) => {
      const shown = flat.write(
        posture,
        seconds,
        previous,
        resolution,
        projection,
      );
      const angle = shown.joints[thumb]!;
      return {
        ...shown,
        joints: {
          ...shown.joints,
          [thumb]: [angle[0], angle[1], angle[2] + turn * weight(seconds)],
        },
      };
    },
  };
}
