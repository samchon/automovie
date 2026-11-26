import { ROM_TOLERANCE, Vector3, getConstraint, physicalShapeSpan, AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { HumanColliders } from "../posture/HumanColliders";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The twist a flat hand's thumb metacarpal turns by so the thumb clears the
 * palmar plane: the nominal flat hand's distal thumb projects past the palm, so
 * the metacarpal turns within its own twist range until the thumb's skin lies
 * on the palm's side of the plane, or to the clinical limit that leaves it
 * least past the plane when no twist clears it. Only the local shape of the
 * hand matters: the thumb is read in its palm plane, with the wrist, its
 * contact and every other finger left in place. The twist is bisected to the
 * engine's joint-angle resolution.
 *
 * @param body The body.
 * @param shape The posture whose root and heading the hand is read in.
 * @param side The hand.
 * @returns The twist added to the flat shape's thumb metacarpal, degrees; zero
 *   when the rig gives that joint no twist range or the flat thumb already
 *   clears the palm.
 */
export function bendFloorThumb(
  body: IAutoMovieMotionHumanBody,
  shape: IAutoMovieMotionHumanPosture,
  side: AutoMovieHumanSide,
): number {
  const thumb: AutoMovieHumanoidBone = `${side}ThumbMetacarpal`;
  const range: IAutoMovieAngleRange | null | undefined = getConstraint(
    thumb,
    body.bones.get(thumb)?.constraint ?? null,
  )?.twist;
  if (range === null || range === undefined) return 0;
  const requested: ReadonlySet<AutoMovieHumanoidBone> =
    new Set<AutoMovieHumanoidBone>([
      `${side}Hand`,
      thumb,
      `${side}ThumbProximal`,
      `${side}ThumbDistal`,
    ]);
  const read: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    requested,
  );
  const place: ReturnType<typeof HumanColliders.preparePlaced> =
    HumanColliders.preparePlaced(body, requested);
  const straight: ReturnType<typeof HumanHand.shape> = HumanHand.shape(
    side,
    "flat",
  );
  const base: readonly [number, number, number] = straight[thumb]!;
  const penetration: (twist: number) => number = (twist: number): number => {
    const pose: IAutoMovieMotionHumanPosture = {
      ...shape,
      limbs: {},
      joints: { ...straight, [thumb]: [base[0], base[1], twist] },
    };
    const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      read(
        resolveHumanPosture.seeded(
          body,
          pose,
          undefined,
          {},
          undefined,
          requested,
        ).pose,
      );
    const palm: ReturnType<typeof HumanHand.frame> = HumanHand.frame(
      body,
      bones,
      side,
      "palm",
      "flat",
    );
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
  if (penetration(base[2]) <= 0) return 0;
  const lower: number = penetration(range.min);
  const upper: number = penetration(range.max);
  const limit: number = (lower < upper ? range.min : range.max) - base[2];
  const sign: number = Math.sign(limit);
  return Math.min(lower, upper) > 0
    ? limit
    : sign *
        AutoMovieEngineMath.bracketedBisection(
          (offset: number): boolean => penetration(base[2] + sign * offset) > 0,
          0,
          Math.abs(limit),
          ROM_TOLERANCE,
        );
}
