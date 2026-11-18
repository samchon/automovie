import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionTarget,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  HumanVerdicts,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A stagger recovery: the body stands a
 * moment, then is pushed, and recovers by stepping or is refused as a fall.
 *
 * Scenarios:
 * 1. Pushed at 0.5 m/s, inside each body's capture region, in each of the
 *   four directions: backward (the blow from ahead), forward (from behind),
 *   to the right (from a point on its left) and to the left (from a point
 *   on its right). Each plans with a clean verdict report.
 * 2. Pushed backward at 1.5 m/s, past what four recovery steps catch: it is
 *   refused as a `HumanRefusal` on `parameter`/`speed`, its value the speed
 *   and its range from none to the fastest push the body catches that way,
 *   which lies between 0.5 and 1.5 m/s.
 *
 * The two speeds bracket measured backward recovery. A push of speed `v` sets the
 * extrapolated centre of mass `v / omega0` ahead of the feet, as a release
 * from a lean `theta` sets it `l sin theta` (Hof's pendulum, `omega0 =
 * sqrt(g / l)`), so a lean reads as `v = sqrt(g l) sin theta`: about 3.2
 * m/s per unit sine on the small woman and 3.5 on the average man. Pitts
 * et al. (2024, Applied Ergonomics 117:104236) report a mean maximum
 * recoverable backward lean of 9 degrees for their 16 young adults in a
 * lean-and-release protocol. The two test speeds correspond to about 8–9
 * degrees and 26–28 degrees of backward lean on the fixture bodies. The
 * controller's four-step admission boundary is checked between those
 * inputs.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the staging, the capture-point relation and the caught and refused speeds.
 * @evidence contracts/development/testing.md#behavioral-verification Plans each direction through the public chain and checks the displayed recovery's verdicts or the refusal's axis, value and feasible speed range.
 * @evidence contracts/development/testing.md#independent-expectations Hof's capture-point formula relates the synthetic speeds to the lean-and-release magnitudes in Pitts et al. The dynamics are audited on the display by the ordinary physical bounds.
 * @evidence contracts/development/testing.md#distinguishing-cases Two measured statures, the four signs of the principal directions, and a backward push outside the capture region.
 * @evidence contracts/development/testing.md#execution-ownership One discovered in-memory spec stages two prepared polygon bodies, each with four short recoveries and one refused push.
 */
export function test_human_motion_stagger_recovery(): void {
  const findings: string[] = [];
  for (const name of ["f-small", "m-average"] as const)
    recovery(name, findings);
  TestValidator.equals(
    "a push is caught by recovery steps or refused as a fall",
    findings,
    [],
  );
}

/** Collect the displayed and refused boundary cases for one morphology. */
function recovery(name: motionHumanBody.Name, out: string[]): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
  const pushed = (
    speed: number,
    from?: IAutoMovieMotionTarget,
  ): HumanPerformance =>
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
  const caught = (
    label: string,
    speed: number,
    from?: IAutoMovieMotionTarget,
    lateral: boolean = false,
  ): void => {
    try {
      const film: HumanPerformance = pushed(speed, from);
      const report: string = HumanVerdicts.describe(
        HumanVerdicts.of(film),
      );
      if (report !== "clean") {
        out.push(`${name} ${label} at ${speed} m/s: ${report}`);
        if (lateral) lateralBoundaries(film, out);
      }
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
  }, true);
  caught("pushed to the left", 0.5, {
    kind: "point",
    at: { x: -1, y: 1.3, z: 0 },
    frame: "world",
  }, true);

  // 2. A push past four steps is refused as a fall, with the body's limit.
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
      const range: HumanRefusal["feasible"] = error.feasible;
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
}

/** Read the raw and displayed limits only after a lateral verdict fails. */
function lateralBoundaries(film: HumanPerformance, out: string[]): void {
  const segment: IAutoMovieMotionHumanSegment = film.segments("a")[1]!;
  const touchdown: number = Math.min(
    ...segment.plan.contacts
      .filter((window) => window.kind === "plant" && window.from > 0)
      .map((window) => segment.start + window.from * segment.plan.duration),
  );
  // The two-sided span is a hundredth of the two-millisecond audit neighbourhood.
  const delta: number = 1e-5;
  for (const [event, at] of [["cut", segment.entryTime], ["first touchdown", touchdown]] as const) {
    if (!Number.isFinite(at)) continue;
    for (const seconds of [at - delta, at, at + delta]) {
      const posture: IAutoMovieMotionHumanPosture = film.posture("a", seconds);
      const bones: ReturnType<HumanPerformance["bones"]> = film.bones("a", seconds);
      const sides = (["left", "right"] as const).map((side) => ({
        side,
        goal: posture.limbs[`${side}Leg`]?.point,
        rotation: posture.limbs[`${side}Leg`]?.rotation,
        planted: posture.limbs[`${side}Leg`]?.planted ?? false,
        ankle: bones.get(`${side}Foot`)?.worldPosition,
        knee: bones.get(`${side}LowerLeg`)?.worldPosition,
      }));
      out.push(`${event} at ${seconds.toFixed(8)} s: ${JSON.stringify({ root: posture.root, hips: bones.get("hips")?.worldPosition, sides })}`);
    }
  }
}
