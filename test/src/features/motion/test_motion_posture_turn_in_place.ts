import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance, HumanVerdicts } from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose } from "../internal/nclose";

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
  const all: motionComplaints.IGatherer = motionComplaints();
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const at: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const forward: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  const firstFeet: string[] = [];
  for (const sign of [1, -1]) {
    const performance: IAutoMovieMotionHumanPerformance = new HumanPerformance({
      seed: "probe",
      performers: [{ subject: "a", body, at, yaw: 0, proficiency: { level: "trained" } }],
      composition: HumanChain.subject("a").walk({ to: at, face: sign * (360 / 4) }).node,
    });
    const report: string = HumanVerdicts.describe(HumanVerdicts.of(performance));
    all.equals(`turn ${sign}: physical verdicts`, report, "clean");
    const initial: IAutoMovieTransform | null = performance.pose("a", 0).root;
    const root: IAutoMovieTransform | null =
      performance.pose("a", performance.duration).root;
    all.check(
      `turn ${sign}: both displayed end frames have a world root`,
      initial !== null && root !== null,
    );
    if (initial === null || root === null) continue;
    const facing: IAutoMovieVector3 = Quaternion.rotateVector(root.rotation, forward);
    const horizontal: number = Math.hypot(facing.x, facing.z);
    // A quarter-turn quaternion and its vector product take only a few
    // binary64 operations. This bounds numerical noise in the unit vector.
    const roundoff: number = 32 * Number.EPSILON;
    all.check(
      `turn ${sign}: displayed end faces the requested signed X axis`,
      horizontal > 0 &&
        nclose(facing.x / horizontal, sign, roundoff) &&
        nclose(facing.z / horizontal, 0, roundoff),
    );
    const drift: number = Math.hypot(
      root.translation.x - initial.translation.x,
      root.translation.z - initial.translation.z,
    );
    all.check(
      `turn ${sign}: root moved ${drift} m from its displayed start along the floor`,
      drift <= HumanVerdicts.SKIN,
    );
    const first: IAutoMovieMotionEvent | undefined = performance
      .segments("a")[0]!.plan.events.find(
        (event: IAutoMovieMotionEvent): boolean => /^(left|right)HeelStrike\d+$/.test(event.name),
      );
    all.check(`turn ${sign}: names its first landing`, first !== undefined);
    if (first !== undefined)
      firstFeet.push(first.name.split("HeelStrike")[0]!);
  }
  all.check(
    "reflected turns first land on opposite feet",
    firstFeet.length === 2 && firstFeet[0] !== firstFeet[1],
  );
  all.assert("the turn-in-place reflection keeps both physical verdicts");
}
