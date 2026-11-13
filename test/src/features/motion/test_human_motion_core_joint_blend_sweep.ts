import {
  DEFAULT_HUMANOID_ROM,
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Quaternion,
  jointToQuaternion,
  skeletonJointAxes,
  swingTwistRange,
} from "@automovie/engine";
import type {
  IAutoMovieAngleRange,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieQuaternion,
} from "@automovie/interface";
import { type IHumanBody, blendHumanJoint } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { makeRng } from "../internal/random";

/** The farthest the two ends of a judged step lie apart, degrees: short of the half turn where the shorter way between them changes sides. */
const APART: number = 150;

/**
 * Wherever in its range a joint's far end travels, the blend follows it
 * without a step: a far end that turns a little turns the blended rotation
 * a little.
 *
 * `test_human_motion_core_joint_blend_moving` reads one travel across one
 * change of route. This one draws them: 120 seeded travels of the right
 * upper arm's far end between two triples drawn inside its range of motion,
 * blended against a near end drawn inside the range too, at a share drawn
 * in (0.1, 0.9). Each travel is cut into steps of at most a tenth of a
 * degree of each angle.
 *
 * No blend can follow every pair of ends: a choice of a path between every
 * two rotations that moved continuously with both would contract the space
 * of rotations to a point, which it is not, and two rotations half a turn
 * apart have no shorter way between them to follow. So a step is judged
 * where both its far ends lie under `APART` degrees from the near end, and
 * where the turn about the arm of the arc's rotation at the share, before it
 * is brought into the range, lies less than 60 degrees past the shoulder's
 * swing-twist interval (the clamp of a turn onto an interval breaks at the
 * turn farthest from it, `swingTwistRange`), and where that rotation points
 * less than 150 degrees from the arm's rest direction (at its antipode the
 * turn about the arm has no value at all).
 *
 * Scenarios, on the average man:
 * 1. Along every travel, where the far end's own rotation turns less than
 *    0.3 degrees in a step and the step is judged as above, the blended
 *    rotation turns no more than 1.5 degrees in it (five times the end's
 *    step and above the continuity audit's 5 mm at an upper arm's length).
 *
 * A failing row names the travel's draw, the step, the near end, the two
 * far ends of the step and the two blended triples, so the case can be
 * replayed by hand.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the one owner of a joint blend on drawn ends and reads the rotations its angles give; any term of the blend that changes at one step, a route, a reading or a way into the range, fails with the ends that show it.
 * @evidence contracts/development/testing.md#independent-expectations The bound is a multiple of the far end's own measured step and the audit's distance at an upper arm's length, stated; nothing is read from the blend.
 * @evidence contracts/development/testing.md#distinguishing-cases A fixed seed's 120 travels over the whole range, the shoulder's 90 degrees of flexion and the range's edges included by the draw; a travel whose end itself turns fast in a step (near the reading's singular flexion) is not judged there.
 * @evidence contracts/development/testing.md#execution-ownership Pure arithmetic on one prepared body's joint axes; no performance is built.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the draws, the bound and what a failing row carries.
 */
export function test_human_motion_core_joint_blend_sweep(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const axes: IAutoMovieJointAxes | undefined = skeletonJointAxes(
    body.skeleton,
    HUMANOID_JOINT_AXES,
  ).rightUpperArm;
  const rotation = (
    of: readonly [number, number, number],
  ): IAutoMovieQuaternion =>
    Quaternion.normalize(
      jointToQuaternion(
        { flexion: of[0], abduction: of[1], twist: of[2] },
        axes,
        HUMANOID_REST_FRAME.rightUpperArm,
      ),
    );
  const turn = (a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): number =>
    (2 *
      Math.acos(
        Math.min(1, Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w)),
      ) *
      180) /
    Math.PI;
  const rom: IAutoMovieJointConstraint = DEFAULT_HUMANOID_ROM.rightUpperArm!;
  const rng: () => number = makeRng(0x3400b1e);
  const drawn = (): [number, number, number] => [
    rom.flexion!.min + (rom.flexion!.max - rom.flexion!.min) * rng(),
    rom.abduction!.min + (rom.abduction!.max - rom.abduction!.min) * rng(),
    rom.twist!.min + (rom.twist!.max - rom.twist!.min) * rng(),
  ];
  const text = (of: readonly [number, number, number]): string =>
    of.map((v: number): string => v.toFixed(2)).join("/");
  // How far a far end's turn about the arm lies past the shoulder's
  // swing-twist interval, degrees, on the nearer side.
  const shoulder: IAutoMovieJointConstraint =
    DEFAULT_HUMANOID_ROM.rightUpperArm!;
  const twistPast = (q: IAutoMovieQuaternion): number => {
    const reading: swingTwistRange.IReading = swingTwistRange.read(q, {
      axes: axes!,
      frame: HUMANOID_REST_FRAME.rightUpperArm,
    });
    // Near the rest direction's antipode the turn about the arm is not
    // defined, so such an arc is never judged.
    if (reading.swing >= 150) return Infinity;
    const turned: number = reading.twist;
    const interval: IAutoMovieAngleRange = shoulder.swingTwist!.twist;
    return Math.min(
      ...[-360, 0, 360].map((k: number): number =>
        Math.max(0, interval.min - (turned + k), turned + k - interval.max),
      ),
    );
  };
  const complaints: string[] = [];
  for (let draw: number = 0; draw < 120; ++draw) {
    const near: [number, number, number] = drawn();
    const first: [number, number, number] = drawn();
    const last: [number, number, number] = drawn();
    const share: number = 0.1 + 0.8 * rng();
    const steps: number = Math.ceil(
      Math.max(
        Math.abs(last[0] - first[0]),
        Math.abs(last[1] - first[1]),
        Math.abs(last[2] - first[2]),
      ) / 0.1,
    );
    const far = (k: number): [number, number, number] => [
      first[0] + ((last[0] - first[0]) * k) / steps,
      first[1] + ((last[1] - first[1]) * k) / steps,
      first[2] + ((last[2] - first[2]) * k) / steps,
    ];
    let worst: { value: number; at: number } = { value: 0, at: 0 };
    let previous: readonly [number, number, number] = blendHumanJoint(
      body,
      "rightUpperArm",
      near,
      far(0),
      share,
    );
    for (let k: number = 1; k <= steps; ++k) {
      const here: readonly [number, number, number] = blendHumanJoint(
        body,
        "rightUpperArm",
        near,
        far(k),
        share,
      );
      if (
        turn(rotation(far(k - 1)), rotation(far(k))) < 0.3 &&
        [far(k - 1), far(k)].every(
          (end: readonly [number, number, number]): boolean =>
            turn(rotation(near), rotation(end)) < APART &&
            twistPast(
              Quaternion.slerp(rotation(near), rotation(end), share),
            ) < 60,
        )
      ) {
        const value: number = turn(rotation(previous), rotation(here));
        if (value > worst.value) worst = { value, at: k };
      }
      previous = here;
    }
    if (worst.value > 1.5)
      complaints.push(
        `draw ${draw}: at step ${worst.at} of ${steps} the blended rotation turns ${worst.value.toFixed(2)} degrees; near end ${text(near)}, share ${share.toFixed(3)}, far end ${text(far(worst.at - 1))} then ${text(far(worst.at))}, blended ${text(blendHumanJoint(body, "rightUpperArm", near, far(worst.at - 1), share))} then ${text(blendHumanJoint(body, "rightUpperArm", near, far(worst.at), share))}`,
      );
  }
  TestValidator.equals(
    "a joint blend follows its far end without a step",
    complaints.slice(0, 12),
    [],
  );
}
