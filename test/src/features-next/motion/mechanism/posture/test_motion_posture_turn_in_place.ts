import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  HumanVerdicts,
} from "@automovie/motions";

import { motionComplaints } from "../../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { nclose } from "../../../../features/internal/nclose";

/**
 * An on-the-spot quarter turn changes displayed heading at the given
 * position. Reversing the requested yaw reflects the first stepping side.
 *
 * Scenarios:
 * 1. The original positive quarter turn and its negative reflection each
 *    complete with a clean displayed contact and range report.
 * 2. Each end's horizontal heading is along the requested signed world X
 *    axis. The root finishes at its starting horizontal position within
 *    the shared contact bound.
 * 3. Each turn names a first heel strike on the opposite foot from its
 *    reflection, so a fixed preferred side cannot implement both.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Uses the public chain and performance, the displayed root, declared heel strikes and the unchanged verdicts. Wrong signed heading, final location, first-foot reflection or contact fails.
 * @evidence contracts/development/testing.md#independent-expectations A quarter turn about world Y takes +Z to signed X, and reflecting the world across the sagittal plane exchanges feet while negating yaw. Final drift uses the same centimetre bound as the shipped contact audit.
 * @evidence contracts/development/testing.md#distinguishing-cases The positive composition probe and its negative reflection distinguish the zero-distance heading branch from translation and fixed-sided stepping.
 * @evidence contracts/development/testing.md#execution-ownership One discovered unit spec runs both takes in memory on the same prepared polygon man.
 * @evidence contracts/development/common.md#meaningful-documentation States endpoint geometry, reflection and the three observations.
 */
export function test_motion_posture_turn_in_place(): void {
  const body = motionHumanBody("m-average");
  checkWalkPlacement(body);
  const origin = { x: 0, y: 0, z: 0 };
  const checks = motionComplaints();
  const land = (sign: number) => {
    const performance = new HumanPerformance({
      seed: "turn",
      performers: [
        {
          subject: "a",
          body,
          at: origin,
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a").walk({ to: origin, face: 90 * sign })
        .node,
    });
    const start = performance.pose("a", 0).root!,
      end = performance.pose("a", performance.duration).root!;
    const heading = Quaternion.rotateVector(end.rotation, { x: 0, y: 0, z: 1 });
    const length = Math.hypot(heading.x, heading.z);
    const epsilon = 32 * Number.EPSILON;
    checks.check(
      "quarter turn points along signed X",
      length > 0 &&
        nclose(heading.x / length, sign, epsilon) &&
        nclose(heading.z / length, 0, epsilon),
    );
    checks.check(
      "turn stays at the same point",
      Math.hypot(
        end.translation.x - start.translation.x,
        end.translation.z - start.translation.z,
      ) <= HumanVerdicts.SKIN,
    );
    checks.equals(
      "turn remains physically sound",
      HumanVerdicts.describe(HumanVerdicts.of(performance)),
      "clean",
    );
    return performance
      .segments("a")[0]!
      .plan.events.map((e) => /^(left|right)HeelStrike\d+$/.exec(e.name))
      .find((m) => m !== null)?.[1];
  };
  const right = land(1),
    left = land(-1);
  checks.check(
    "reflected turns first land on opposite sides",
    right !== undefined && left !== undefined && right !== left,
  );
  checks.assert("turn in place");
}
/** A rigidly placed walk has the same clock and transforms each displayed joint rigidly. */
function checkWalkPlacement(body: IAutoMovieMotionHumanBody): void {
  const walk = (
    at: IAutoMovieVector3,
    to: IAutoMovieVector3,
    yaw: number,
  ): IAutoMovieMotionHumanPerformance =>
    new HumanPerformance({
      seed: "placement",
      performers: [
        { subject: "walker", body, at, yaw, proficiency: { level: "trained" } },
      ],
      composition: HumanChain.subject("walker").walk({ to }).node,
    });
  const shift = { x: 3, y: 0, z: -2 };
  const moved = (p: IAutoMovieVector3): IAutoMovieVector3 => ({
    x: shift.x + p.z,
    y: p.y,
    z: shift.z - p.x,
  });
  const at = { x: 0, y: 0, z: 0 },
    to = { x: 0, y: 0, z: 2 };
  const original = walk(at, to, 0);
  const placed = walk(moved(at), moved(to), 90);
  const findings = motionComplaints();
  findings.check(
    "placement preserves walk duration",
    nclose(original.duration, placed.duration, 1e-9),
  );
  for (const time of [0, original.duration / 2, original.duration]) {
    const destination = placed.bones("walker", time);
    for (const [bone, joint] of original.bones("walker", time)) {
      const actual = destination.get(bone)!.worldPosition;
      const expected = moved(joint.worldPosition);
      findings.check(
        `${bone} at ${time}s follows the placed walk`,
        Math.hypot(
          actual.x - expected.x,
          actual.y - expected.y,
          actual.z - expected.z,
        ) <= 1e-3,
      );
    }
  }
  findings.assert("walk uses its authored placement");
}
