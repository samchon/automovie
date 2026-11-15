import {
  type IAutoMovieResolvedBone,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanHand, type IHumanBody, poseBones } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/** The digits as the regions spell them, with the rig bone of the phalanx before the distal one. */
const DIGITS: readonly { name: string; bone: string; before: string }[] = [
  { name: "thumb", bone: "Thumb", before: "Proximal" },
  { name: "index", bone: "Index", before: "Intermediate" },
  { name: "middle", bone: "Middle", before: "Intermediate" },
  { name: "ring", bone: "Ring", before: "Intermediate" },
  { name: "little", bone: "Little", before: "Intermediate" },
];

/** A region's world frame under a hand shape. */
const placed = (
  body: IHumanBody,
  pose: IAutoMoviePose,
  region: AutoMovieHumanoidRegion,
): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } => {
  const frame: resolveAutoMovieHumanoidSurfaces.IFrame =
    body.surfaces.regions[region];
  const bone: IAutoMovieResolvedBone = poseBones(body, pose).get(frame.bone)!;
  return resolveAutoMovieHumanoidSurfaces.place(frame, bone);
};

/** A pose holding one hand shape. */
const shaped = (body: IHumanBody, form: HumanHand.Shape): IAutoMoviePose => ({
  skeleton: body.skeleton.id,
  root: null,
  joints: Object.entries(HumanHand.shape("right", form)).map(
    ([bone, a]): IAutoMovieJointPose => ({
      bone: bone as AutoMovieHumanoidBone,
      flexion: a![0],
      abduction: a![1],
      twist: a![2],
    }),
  ),
});

/**
 * The tip and the pad of every digit are surfaces of the body (#3443).
 *
 * Scenarios, on every body of `EXTREMES`:
 *
 * 1. Each tip lies beyond the end of its distal phalanx's joint along the
 *    phalanx, farther out than its pad, and each pad faces the palm's side
 *    (its normal's dot with the palm's normal positive), in the flat hand.
 * 2. In the flat hand the tips of the forefinger to the little finger lie in
 *    order across the hand (toward the little finger's side, -Z of the right
 *    hand at rest); in the fist every finger's pad faces the palm (its normal
 *    toward the palm's point).
 * 3. Both sides are mirror images: each left tip is its right twin with the
 *    lateral coordinate negated.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Resolves generated bodies' surfaces and places them by forward kinematics under hand shapes.
 * @evidence contracts/development/testing.md#independent-expectations Anatomy: a tip ends its digit, a pad faces the palm, fingers lie in order across the hand, a curled pad faces into the fist, the body is mirror-symmetric.
 * @evidence contracts/development/testing.md#distinguishing-cases Four bodies, ten digits, two sides and two shapes.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit test; no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the three scenarios.
 */
export function test_engine_finger_surfaces(): void {
  const complaints: string[] = [];
  for (const name of motionHumanBody.EXTREMES) {
    const body: IHumanBody = motionHumanBody(name);
    const flat: IAutoMoviePose = shaped(body, "flat");
    const fist: IAutoMoviePose = shaped(body, "fist");
    const palm: { point: IAutoMovieVector3; normal: IAutoMovieVector3 } =
      placed(body, flat, "palmRight");
    const fistPalm: { point: IAutoMovieVector3; normal: IAutoMovieVector3 } =
      placed(body, fist, "palmRight");
    const bones = poseBones(body, flat);

    // 1. Tips at the ends, pads on the palm's side.
    for (const d of DIGITS) {
      const distal: IAutoMovieVector3 = bones.get(
        `right${d.bone}Distal` as AutoMovieHumanoidBone,
      )!.worldPosition;
      const before: IAutoMovieVector3 = bones.get(
        `right${d.bone}${d.before}` as AutoMovieHumanoidBone,
      )!.worldPosition;
      const along: IAutoMovieVector3 = Vector3.normalize(
        Vector3.subtract(distal, before),
      );
      const tip = placed(
        body,
        flat,
        `${d.name}TipRight` as AutoMovieHumanoidRegion,
      );
      const pad = placed(
        body,
        flat,
        `${d.name}PadRight` as AutoMovieHumanoidRegion,
      );
      const tipOut: number = Vector3.dot(
        Vector3.subtract(tip.point, distal),
        along,
      );
      const padOut: number = Vector3.dot(
        Vector3.subtract(pad.point, distal),
        along,
      );
      if (!(tipOut > padOut && tipOut > 0))
        complaints.push(
          `${name} ${d.name}: the tip lies ${(tipOut * 1000).toFixed(1)} mm out along the phalanx, the pad ${(padOut * 1000).toFixed(1)} mm`,
        );
      if (!(Vector3.dot(pad.normal, palm.normal) > 0))
        complaints.push(
          `${name} ${d.name}: the pad does not face the palm's side`,
        );
    }

    // 2. Order across the flat hand, and pads into the fist.
    const across: number[] = DIGITS.slice(1).map(
      (d): number =>
        placed(body, flat, `${d.name}TipRight` as AutoMovieHumanoidRegion).point
          .z,
    );
    if (
      !across.every(
        (z: number, i: number): boolean => i === 0 || z < across[i - 1]!,
      )
    )
      complaints.push(
        `${name}: the flat tips do not lie in order across the hand (${across.map((z) => z.toFixed(3)).join(", ")})`,
      );
    for (const d of DIGITS.slice(1)) {
      const pad = placed(
        body,
        fist,
        `${d.name}PadRight` as AutoMovieHumanoidRegion,
      );
      if (
        !(
          Vector3.dot(pad.normal, Vector3.subtract(fistPalm.point, pad.point)) >
          0
        )
      )
        complaints.push(
          `${name} ${d.name}: the curled pad does not face into the fist`,
        );
    }

    // 3. Mirror symmetry of the rest frames.
    for (const d of DIGITS)
      for (const kind of ["Tip", "Pad"]) {
        const l =
          body.surfaces.regions[
            `${d.name}${kind}Left` as AutoMovieHumanoidRegion
          ];
        const r =
          body.surfaces.regions[
            `${d.name}${kind}Right` as AutoMovieHumanoidRegion
          ];
        if (
          !(
            l.point.x === -r.point.x &&
            l.point.y === r.point.y &&
            l.point.z === r.point.z
          )
        )
          complaints.push(
            `${name} ${d.name}${kind}: the left frame is not the right's mirror`,
          );
      }
  }
  TestValidator.equals("every digit's tip and pad", complaints, []);
}
