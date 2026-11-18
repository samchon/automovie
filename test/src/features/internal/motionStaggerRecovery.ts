import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionTarget,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  HumanVerdicts,
} from "@automovie/motions";

import { motionHumanBody } from "./motionHumanBody";

/**
 * The reading of the stagger recovery specs on one body: the body stands a
 * moment, then is pushed, and recovers by stepping or is refused as a fall.
 *
 * Scenes:
 * - pushed at 0.5 m/s, inside every body's capture region, in each of the
 *   four directions: backward (the blow from ahead), forward (from behind),
 *   to the right (from a point on its left) and to the left (from a point
 *   on its right); each plans with a clean verdict report;
 * - pushed backward at 1.5 m/s, past what four recovery steps catch: it is
 *   refused as a `HumanRefusal` on `parameter`/`speed`, its value the speed
 *   and its range from none to the fastest push the body catches that way,
 *   which lies between 0.5 and 1.5 m/s.
 *
 * The two speeds bracket people's threshold. A push of speed `v` sets the
 * extrapolated centre of mass `v / omega0` ahead of the feet, as a release
 * from a lean `theta` sets it `l sin theta` (Hof's pendulum, `omega0 =
 * sqrt(g / l)`), so a lean reads as `v = sqrt(g l) sin theta`: about 3.2
 * m/s per unit sine on the small woman and 3.5 on the average man. Young
 * adults released from a backward lean recover by stepping from at most 9
 * degrees (Pitts et al. 2024, Appl Ergon 117:104236, 16 adults, maximum
 * recoverable lean) to 16.4 +- 3.1 degrees (Telonio, Cyr, Moglo and
 * Smeesters 2005, ISB XX abstract 430), and allowing more steps does not
 * raise the lean recovered from (Cyr and Smeesters 2007, J Biomech
 * 40:2857, 28 adults, one step, two and no limit). So 0.5 m/s, a lean of
 * 9 degrees on the small woman, is caught by every body; 1.5 m/s, a lean
 * of 28 and 26 degrees, lies past every measured backward threshold.
 *
 * @param name The body.
 * @returns What went wrong; empty when every scene reads as stated.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the staging, the scenes and what each must show.
 * @evidence contracts/development/implementation.md#principled-implementation Builds each stagger through the public chain and reads the shipped verdict report and the refusal's axis, value and range.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One staging, four caught pushes and one refused.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A refusal of a caught push, any broken bound, or a fall refused on another axis is a complaint with what was read.
 * @evidence contracts/development/implementation.md#efficient-algorithms Four short films and one refused plan.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by the stagger recovery specs, one per body.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function motionStaggerRecovery(name: motionHumanBody.Name): string[] {
  const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
  const pushed = (speed: number, from?: IAutoMovieMotionTarget) =>
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
    from?: IAutoMovieMotionTarget,
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

  // 1. Pushes inside the capture region, in each of the four directions,
  // are caught, cleanly: the blow from ahead, from behind, from the
  // performer's left (+X) and from its right.
  caught("pushed backward", 0.5);
  caught("pushed forward", 0.5, {
    kind: "point",
    at: { x: 0, y: 1.3, z: -1 },
    frame: "world",
  });
  caught("pushed to the right", 0.5, {
    kind: "point",
    at: { x: 1, y: 1.3, z: 0 },
    frame: "world",
  });
  caught("pushed to the left", 0.5, {
    kind: "point",
    at: { x: -1, y: 1.3, z: 0 },
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
