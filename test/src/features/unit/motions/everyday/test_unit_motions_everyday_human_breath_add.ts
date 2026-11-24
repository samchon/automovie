import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import { HumanBreath } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of one product and sum per angle, degrees. */
const ROUNDING: number = 1e-12;

/**
 * `HumanBreath.add` adds a lung volume's trunk angles to a posture: each bone
 * of the tidal table (`HumanBreath.TIDAL`) turns by the volume times its tidal
 * angles over what the posture holds, zero where it holds none, and nothing
 * else changes.
 *
 * Scenarios:
 *
 * 1. Half a tidal breath over a posture holding (1, 2, 3) at every tidal bone
 *    gives `(1, 2, 3) + TIDAL / 2` there.
 * 2. Over a posture holding none, a whole breath gives the table itself.
 * 3. The root and the limbs are left as they are.
 */
export function test_unit_motions_everyday_human_breath_add(): void {
  const bones: AutoMovieHumanoidBone[] = Object.keys(
    HumanBreath.TIDAL,
  ) as AutoMovieHumanoidBone[];
  const held: IAutoMovieMotionHumanPosture["joints"] = {};
  for (const bone of bones) held[bone] = [1, 2, 3];
  const posture = (
    joints: IAutoMovieMotionHumanPosture["joints"],
  ): IAutoMovieMotionHumanPosture => ({
    root: { x: 1, y: 0, z: 2 },
    yaw: 30,
    pitch: 0,
    roll: 0,
    joints,
    limbs: {},
  });
  const tidal = (bone: AutoMovieHumanoidBone): readonly number[] =>
    HumanBreath.TIDAL[bone]!;

  // 1. Half a breath over held angles.
  const half: IAutoMovieMotionHumanPosture = HumanBreath.add(
    posture(held),
    0.5,
  );
  for (const bone of bones)
    TestValidator.predicate(
      `half a breath at ${bone}`,
      half.joints[bone]!.every((v: number, i: number): boolean =>
        nclose(v, i + 1 + tidal(bone)[i]! / 2, ROUNDING),
      ),
    );

  // 2. A whole breath over none.
  const whole: IAutoMovieMotionHumanPosture = HumanBreath.add(posture({}), 1);
  for (const bone of bones)
    TestValidator.predicate(
      `a whole breath at ${bone}`,
      whole.joints[bone]!.every((v: number, i: number): boolean =>
        nclose(v, tidal(bone)[i]!, ROUNDING),
      ),
    );

  // 3. The rest untouched.
  TestValidator.predicate(
    "the root and the limbs",
    whole.root.x === 1 &&
      whole.root.z === 2 &&
      whole.yaw === 30 &&
      Object.keys(whole.limbs).length === 0,
  );
}
