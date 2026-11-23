import { getConstraint } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";

import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/** Extend the knuckles while a wrist near the floor turns the fingers down. */
export function bendReleasedFingers(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  to: number,
  weight: (seconds: number) => number,
  floor: number,
  travel: number,
): IAutoMovieMotionHumanPrimitive {
  const handOnly: ReadonlySet<AutoMovieHumanoidBone> =
    new Set<AutoMovieHumanoidBone>([`${side}Hand`]);
  const readWrist = poseBones.prepare(body, handOnly);
  const fingers: readonly AutoMovieHumanoidBone[] = [
    `${side}IndexProximal`,
    `${side}MiddleProximal`,
    `${side}RingProximal`,
    `${side}LittleProximal`,
  ];
  return {
    channels: [`${side}Hand`],
    reads: ["root", "trunk", `${side}Arm`, `${side}Hand`],
    from: 0,
    to,
    write: (shown, seconds, _before, resolution, projection) => {
      const w = weight(seconds);
      const joints = { ...shown.joints };
      if (travel * (1 - w) <= body.measure.hand) {
        const pose = resolveHumanPosture.seeded(
          body,
          shown,
          undefined,
          {},
          resolution,
          handOnly,
          projection,
        ).pose;
        const hand = HumanHand.frame(
          body,
          readWrist(pose),
          side,
          "palm",
          "flat",
        );
        const tilt: number = Math.atan2(
          -hand.forward.y,
          Math.hypot(hand.forward.x, hand.forward.z),
        );
        const clear: number = Math.asin(
          Math.max(0, Math.min(1, (hand.point.y - floor) / body.measure.hand)),
        );
        const extension: number = (Math.max(0, tilt - clear) * 180) / Math.PI;
        if (extension > 0)
          for (const bone of fingers) {
            const original = joints[bone]!;
            const minimum =
              getConstraint(bone, body.bones.get(bone)?.constraint ?? null)
                ?.flexion?.min ?? original[0];
            joints[bone] = [
              Math.max(minimum, original[0] - extension),
              original[1],
              original[2],
            ];
          }
      }
      return { ...shown, joints };
    },
  };
}
