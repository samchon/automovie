import type { AutoMovieMotionTarget } from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  HumanVerdicts,
  type IHumanBody,
} from "@automovie/motions";

import { motionHumanBody } from "./motionHumanBody";

/**
 * The reading of the stagger recovery specs on one body: the body stands a
 * moment, then is pushed, and recovers by stepping or is refused as a fall.
 *
 * Scenes:
 * - pushed backward (the blow from ahead) at 0.5 m/s, inside every body's
 *   capture region: it plans with a clean verdict report;
 * - pushed to the right (the blow from a point on its left) at 0.5 m/s: it
 *   plans with a clean verdict report;
 * - pushed backward at 1.5 m/s, past what four recovery steps catch: it is
 *   refused as a `HumanRefusal` on `parameter`/`speed`, its value the speed
 *   and its range from none to the fastest push the body catches that way,
 *   which lies between 0.5 and 1.5 m/s.
 *
 * @param name The body.
 * @returns What went wrong; empty when every scene reads as stated.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the staging, the three scenes and what each must show.
 * @evidence contracts/development/implementation.md#principled-implementation Builds each stagger through the public chain and reads the shipped verdict report and the refusal's axis, value and range.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One staging, three scenes.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A refusal of a caught push, any broken bound, or a fall refused on another axis is a complaint with what was read.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two short films and one refused plan.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by the stagger recovery specs, one per body.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function motionStaggerRecovery(name: motionHumanBody.Name): string[] {
  const body: IHumanBody = motionHumanBody(name);
  const pushed = (speed: number, from?: AutoMovieMotionTarget) =>
    new HumanPerformance({
      seed: "stagger",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a")
        .stand({ seconds: 0.3 })
        .stagger({ speed, ...(from === undefined ? {} : { from }) }).node,
    });
  const out: string[] = [];
  const caught = (
    label: string,
    speed: number,
    from?: AutoMovieMotionTarget,
  ) => {
    try {
      const report: string = HumanVerdicts.describe(
        HumanVerdicts.of(pushed(speed, from)),
      );
      if (report !== "clean")
        out.push(`${name} ${label} at ${speed} m/s: ${report}`);
    } catch (error) {
      out.push(
        `${name} ${label} at ${speed} m/s: threw ${error instanceof Error ? error.message : String(error)}, a recovery expected`,
      );
    }
  };

  // 1. and 2. Pushes inside the capture region are caught, cleanly.
  caught("pushed backward", 0.5);
  caught("pushed to the right", 0.5, {
    kind: "point",
    at: { x: 1, y: 1.3, z: 0 },
    frame: "world",
  });

  // 3. A push past four steps is refused as a fall, with the body's limit.
  try {
    pushed(1.5);
    out.push(
      `${name} pushed backward at 1.5 m/s: planned, a fall refused expected`,
    );
  } catch (error) {
    if (!(error instanceof HumanRefusal))
      out.push(
        `${name} pushed backward at 1.5 m/s: threw ${error instanceof Error ? error.message : String(error)}, a HumanRefusal expected`,
      );
    else {
      const range = error.feasible;
      if (error.kind !== "parameter" || error.axis !== "speed")
        out.push(
          `${name} pushed backward at 1.5 m/s: refused on ${error.kind}/${error.axis}, parameter/speed expected`,
        );
      if (error.value !== 1.5)
        out.push(
          `${name} pushed backward at 1.5 m/s: the refusal's value is ${String(error.value)}, 1.5 expected`,
        );
      if (
        range === null ||
        range.kind !== "range" ||
        range.maximum === null ||
        !(range.maximum > 0.5 && range.maximum < 1.5)
      )
        out.push(
          `${name} pushed backward at 1.5 m/s: the refusal's range is ${JSON.stringify(range)}, a limit between 0.5 and 1.5 m/s expected`,
        );
    }
  }
  return out;
}
