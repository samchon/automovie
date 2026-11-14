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
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieQuaternion,
} from "@automovie/interface";
import { type IHumanBody, blendHumanJoint } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { makeRng } from "../internal/random";

/**
 * Wherever in its range a shoulder's far end travels, the blend stays in the
 * range and follows it without a step, and it meets both ends: the claims of
 * the in-region blend (`swingTwistRange.blend`), which `blendHumanJoint` uses
 * for a joint ranged by swing and twist.
 *
 * `test_human_motion_core_joint_blend_moving` reads one travel across one
 * change of route. This one draws them: 120 seeded travels of the right
 * upper arm's far end between two rotations drawn inside its swing-twist
 * range, blended against a near end drawn inside it too, at a share drawn
 * in (0.1, 0.9). Each travel is cut into steps of at most a tenth of a
 * degree of each angle.
 *
 * The blend moves straight across the range's chart (`swingTwistRange.chart`),
 * which is continuous and one to one over the range, so a step is judged
 * wherever both its far ends lie inside the range.
 *
 * Scenarios, on the average man:
 * 1. The region's radius about the rest direction stays below 180 degrees by
 *    at least 45 on every great circle, so the rest direction's antipode,
 *    where the reading has no azimuth and no twist, lies outside the range.
 * 2. At every drawn step the blended rotation lies inside the range (an
 *    overshoot of at most a millionth of a degree).
 * 3. The blend meets both ends: at shares 0 and 1 the engine's blend is
 *    each end's rotation within a hundred-thousandth of a degree (the arithmetic's own rounding is a few millionths).
 * 4. Along every travel, where the far end's own rotation turns less than
 *    0.3 degrees in a step and the step is judged as above, the blended
 *    rotation turns no more than 1.5 degrees in it (five times the end's
 *    step and above the continuity audit's 5 mm at an upper arm's length).
 *
 * A failing row names the travel's draw, the step, the near end, the two
 * far ends of the step and the two blended triples, so the case can be
 * replayed by hand.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the one owner of a joint blend and the engine's blend on drawn ends and reads the rotations and the range; a step, a blend outside the range, an end missed or a region that reaches the antipode fails with the values that show it.
 * @evidence contracts/development/testing.md#independent-expectations The bounds are the range itself, a multiple of the far end's own measured step and the audit's distance at an upper arm's length, stated; nothing is read from the blend.
 * @evidence contracts/development/testing.md#distinguishing-cases A fixed seed's 120 travels over the whole range, its edges included by the draw; a far end outside the range is not judged.
 * @evidence contracts/development/testing.md#execution-ownership Pure arithmetic on one prepared body's joint axes; no performance is built.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the draws, the four scenarios with their bounds, what is judged and what a failing row carries.
 */
export function test_human_motion_core_joint_blend_sweep(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const axes: IAutoMovieJointAxes = skeletonJointAxes(
    body.skeleton,
    HUMANOID_JOINT_AXES,
  ).rightUpperArm!;
  const joint: swingTwistRange.IJoint = {
    axes,
    frame: HUMANOID_REST_FRAME.rightUpperArm,
  };
  const rom: IAutoMovieJointConstraint = DEFAULT_HUMANOID_ROM.rightUpperArm!;
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
  const inside = (q: IAutoMovieQuaternion): boolean =>
    swingTwistRange.overshoot(q, rom, joint) <= 1e-6;
  const complaints: string[] = [];

  // 1. The region stays within the record's own reach, which stays clear
  // of the rest direction's antipode.
  const reach: number = rom.swingTwist?.reach ?? 180;
  let widest: number = 0;
  for (let azimuth: number = 0; azimuth < 360; azimuth += 0.5)
    widest = Math.max(widest, swingTwistRange.radius(rom, joint, azimuth));
  if (!(reach < 180 && widest <= reach + 1e-6))
    complaints.push(
      `the region's radius reaches ${widest.toFixed(2)} degrees against the record's reach of ${reach}, which must stay short of the antipode (180)`,
    );

  const rng: () => number = makeRng(0x3400b1e);
  const drawn = (): [number, number, number] => {
    for (;;) {
      const of: [number, number, number] = [
        rom.flexion!.min + (rom.flexion!.max - rom.flexion!.min) * rng(),
        rom.abduction!.min + (rom.abduction!.max - rom.abduction!.min) * rng(),
        rom.twist!.min + (rom.twist!.max - rom.twist!.min) * rng(),
      ];
      if (inside(rotation(of))) return of;
    }
  };
  const text = (of: readonly [number, number, number]): string =>
    of.map((v: number): string => v.toFixed(2)).join("/");
  for (let draw: number = 0; draw < 120; ++draw) {
    const near: [number, number, number] = drawn();
    const first: [number, number, number] = drawn();
    const last: [number, number, number] = drawn();
    const share: number = 0.1 + 0.8 * rng();

    // 3. Both ends are met.
    for (const [at, end] of [
      [0, near],
      [1, first],
    ] as const) {
      const met: number = turn(
        swingTwistRange.blend(rotation(near), rotation(first), at, rom, joint),
        rotation(end),
      );
      if (!(met <= 1e-5))
        complaints.push(
          `draw ${draw}: at share ${at} the blend lies ${met.toExponential(2)} degrees from its end ${text(end)}`,
        );
    }

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
    let outside: { value: number; at: number } = { value: 0, at: 0 };
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
      // 2. Inside the range, wherever the far end is inside too.
      if (inside(rotation(far(k)))) {
        const past: number = swingTwistRange.overshoot(
          rotation(here),
          rom,
          joint,
        );
        if (past > outside.value) outside = { value: past, at: k };
      }
      // 4. Continuous wherever both far ends are inside.
      if (
        turn(rotation(far(k - 1)), rotation(far(k))) < 0.3 &&
        inside(rotation(far(k - 1))) &&
        inside(rotation(far(k)))
      ) {
        const value: number = turn(rotation(previous), rotation(here));
        if (value > worst.value) worst = { value, at: k };
      }
      previous = here;
    }
    if (outside.value > 1e-6)
      complaints.push(
        `draw ${draw}: at step ${outside.at} of ${steps} the blend lies ${outside.value.toFixed(4)} degrees outside the range; near end ${text(near)}, share ${share.toFixed(3)}, far end ${text(far(outside.at))}`,
      );
    if (worst.value > 1.5)
      complaints.push(
        `draw ${draw}: at step ${worst.at} of ${steps} the blended rotation turns ${worst.value.toFixed(2)} degrees; near end ${text(near)}, share ${share.toFixed(3)}, far end ${text(far(worst.at - 1))} then ${text(far(worst.at))}, blended ${text(blendHumanJoint(body, "rightUpperArm", near, far(worst.at - 1), share))} then ${text(blendHumanJoint(body, "rightUpperArm", near, far(worst.at), share))}`,
      );
  }
  TestValidator.equals(
    "a shoulder blend stays in the range, follows its far end and meets both ends",
    complaints.slice(0, 12),
    [],
  );
}
