import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanLean,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanStance } from "@automovie/motions";
import {
  AutoMovieMotionHumanLean
} from "../../../../../packages/motions/src/compose/internal/AutoMovieMotionHumanLean";
import {
  poseBones
} from "../../../../../packages/motions/src/posture/internal/poseBones";
import {
  resolveHumanPosture
} from "../../../../../packages/motions/src/posture/internal/resolveHumanPosture";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";

/** Rounding of the hips' placed shift, metres. */
const ROUNDING: number = 1e-6;

/** How far a planted foot may move under the sway, metres: a millimetre. */
const SLIP: number = 1e-3;

/** The feet. */
const FEET: readonly AutoMovieHumanoidBone[] = ["leftFoot", "rightFoot"];

/**
 * `AutoMovieMotionHumanLean.sway` carries the hips by a floor-frame shift in
 * the performer's own frame and tilts the trunk, over planted feet: it claims
 * the root and the trunk over its span, reads its angles and shift at the
 * second it writes, lowers the hips as far as the planted legs need, keeps both
 * feet where they stood, and leaves the limb goals and joints it was given.
 *
 * The body is built whole (`humanFixtureBody`): the sway fits the planted legs.
 * The average man stands at the origin.
 *
 * Scenarios, a sway over 0.5 to 2 s rolling −6 degrees and shifting (0.15, 5,
 * 0.02), written at 1.25 s:
 *
 * 1. It claims the root and the trunk over 0.5 to 2 s and reads its angles and
 *    shift once each at 1.25 s.
 * 2. The hips move 150 mm along X and 20 mm along Z and lower, by more than a
 *    millimetre and less than 20 cm; the roll is −6.
 * 3. Both feet stay within a millimetre of their plants; the limb goals and joints
 *    are the given ones.
 * 4. Facing 90 degrees, a 5 cm shift ahead moves the hips 5 cm along +X.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the affected channels and write time, horizontal shift, vertical fit over two plants and heading-relative motion.
 * @evidence contracts/development/testing.md#behavioral-verification Calls HumanLean.sway with counted pose inputs, evaluates stored-body foot bones before and after the write, and inspects the retained goals and joint payloads.
 * @evidence contracts/development/testing.md#independent-expectations The authored displacements are 0.15 m in X and 0.02 m in Z, with a bounded height drop and -6 degree roll. Both feet must stay within their stated slip bound. At 90 degrees, a forward 0.05 m input adds 0.05 m to X.
 */
export async function test_motions_compose_lean_sway(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const bones = (
    posture: IAutoMovieMotionHumanPosture,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
    poseBones(body, resolveHumanPosture(body, posture));
  const hips = (posture: IAutoMovieMotionHumanPosture): IAutoMovieVector3 =>
    bones(posture).get("hips")!.worldPosition;
  const standing: IAutoMovieMotionHumanPosture =
    AutoMovieMotionHumanStance.stand.posture(body, { x: 0, y: 0, z: 0 }, 0);

  // 1. Claims and reads.
  const asked: number[] = [];
  const sway: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanLean.sway({
    body,
    from: 0.5,
    to: 2,
    angles: (seconds: number): IAutoMovieMotionHumanLean.IAngles => {
      asked.push(seconds);
      return { pitch: 0, roll: -6 };
    },
    shift: (seconds: number): IAutoMovieVector3 => {
      asked.push(seconds);
      return { x: 0.15, y: 5, z: 0.02 };
    },
  });
  const swayed: IAutoMovieMotionHumanPosture = sway.write(standing, 1.25);
  TestValidator.equals(
    "the root and the trunk over the span",
    [sway.channels, sway.from, sway.to],
    [["root", "trunk"], 0.5, 2],
  );
  TestValidator.predicate(
    "the angles and the shift read at the second written",
    asked.length === 2 && asked.every((s: number): boolean => s === 1.25),
  );

  // 2. The hips.
  const from: IAutoMovieVector3 = hips(standing);
  const to: IAutoMovieVector3 = hips(swayed);
  const drop: number = from.y - to.y;
  TestValidator.predicate(
    "the hips carried and lowered",
    swayed.roll === -6 &&
      Math.abs(to.x - from.x - 0.15) <= ROUNDING &&
      Math.abs(to.z - from.z - 0.02) <= ROUNDING &&
      drop > 0.001 &&
      drop < 0.2,
  );

  // 3. The feet.
  const before: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    bones(standing);
  const after: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    bones(swayed);
  TestValidator.predicate(
    "both feet on their plants, the goals and joints kept",
    FEET.every((bone: AutoMovieHumanoidBone): boolean => {
      const a: IAutoMovieVector3 = after.get(bone)!.worldPosition;
      const b: IAutoMovieVector3 = before.get(bone)!.worldPosition;
      return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) <= SLIP;
    }),
  );
  TestValidator.equals(
    "the goals and joints kept",
    [swayed.limbs, swayed.joints],
    [standing.limbs, standing.joints],
  );

  // 4. The performer's frame.
  const facing: IAutoMovieMotionHumanPosture =
    AutoMovieMotionHumanStance.stand.posture(body, { x: 0, y: 0, z: 0 }, 90);
  const ahead: IAutoMovieMotionHumanPosture = AutoMovieMotionHumanLean.sway({
    body,
    from: 0,
    to: 1,
    angles: (): IAutoMovieMotionHumanLean.IAngles => ({ pitch: 0, roll: 0 }),
    shift: (): IAutoMovieVector3 => ({ x: 0, y: 0, z: 0.05 }),
  }).write(facing, 0.5);
  TestValidator.predicate(
    "the shift is in the performer's frame",
    Math.abs(hips(ahead).x - hips(facing).x - 0.05) <= ROUNDING,
  );
}
