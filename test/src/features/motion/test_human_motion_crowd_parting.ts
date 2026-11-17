import type { IAutoMovieMotionHumanBody, IAutoMovieMotionHumanCrowd, IAutoMovieMotionHumanEnsemble, IAutoMovieMotionHumanFormation, IAutoMovieMotionHumanObstacle, IAutoMovieVector3 } from "@automovie/interface";
import { AutoMovieGravity, steerAutoMovieCrowd } from "@automovie/engine";

import { HUMAN_ATTRIBUTE_EFFECTS, HumanCrowd, HumanEnsemble, HumanFormation, walk } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Pedestrians in two opposing flows part around a carriage crossing the
 * street and close behind it: nobody walks through the carriage or through
 * anybody, everybody arrives, and the same seed steers them the same way.
 *
 * Scenarios, 40 civilians on three bodies in two flows of 20 along a street,
 * each three abreast 0.8 m apart in ranks 1.1 m apart, a 2.4 by 1.6 m
 * carriage footprint crossing it at 3 m/s:
 * 1. No member's course comes within its shoulders' half breadth of the
 *    carriage's footprint at any 1/24 s sample.
 * 2. No two members' courses come within their summed half breadths at any
 *    1/24 s sample (the pass reports no contact).
 * 3. Every member reaches its goal before the pass ends: the course over the
 *    slowest desired speed the law can draw, plus the law's start and
 *    arrival times.
 * 4. Steering again with the same seed gives bit-identical courses.
 * 5. Moving the whole scene by (4, 0, -2) m moves every course by the same
 *    vector within 1e-6 m over the first second, inside the divergence a
 *    crowd of 40 was measured to show (1.8e-15 m at 0 s, 1.2e-6 m at 2 s),
 *    and every member of the moved scene arrives (the pass refuses any
 *    contact in it too).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Steers an ensemble with a moving obstacle and reads every member's course: a member entering the carriage or another member, a member that never arrives, a non-replaying pass or a frame-dependent one is caught.
 * @evidence contracts/development/testing.md#independent-expectations Non-penetration and arrival are the scene's requirement; the breadths are the bodies' own measures; the span is the law's own speed floor, start and arrival; replay follows from keyed draws, and the moved scene's bound is the measured divergence of a crowd sensitive to its initial conditions.
 * @evidence contracts/development/testing.md#distinguishing-cases A moving obstacle, two opposing flows, a replay and a moved scene; the engine law's own cases belong to `test_engine_steer_crowd`, the members' steps on their courses to the civil crowd scene.
 * @evidence contracts/development/testing.md#execution-ownership A unit test of the motions package on prepared polygon-man bodies, discovered by its exported name; courses only, no pose, no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios and what each pins.
 */
export function test_human_motion_crowd_parting(): void {
  const findings: string[] = [];
  const pool: IAutoMovieMotionHumanBody[] = [
    motionHumanBody("m-average"),
    motionHumanBody("f-small"),
    motionHumanBody("m-tall"),
  ];

  // The pass's span, derived from the law: the course at the slowest desired speed the population can draw (the walk's normal Froude speed at the shortest hip, the draw's floor `HumanCrowd.SLOWEST` and fatigue's heaviest factor), plus the driving term's start, one relaxation time, and its arrival, whose speed falls linearly within `ARRIVAL` relaxation times of travel and so closes on the goal exponentially, `tau ARRIVAL ln(near / radius)` to come within the agent's radius.
  const slowest: number =
    Math.min(
      ...pool.map((b: IAutoMovieMotionHumanBody): number =>
        Math.sqrt(
          walk.FROUDE.normal * AutoMovieGravity.STANDARD * b.measure.hipHeight,
        ),
      ),
    ) *
    HumanCrowd.SLOWEST *
    Math.min(
      HUMAN_ATTRIBUTE_EFFECTS.fatigue.pace.low,
      HUMAN_ATTRIBUTE_EFFECTS.fatigue.pace.high,
    );
  const tau: number = steerAutoMovieCrowd.RELAXATION;
  const near: number = slowest * tau * steerAutoMovieCrowd.ARRIVAL;
  const spanOf = (e: IAutoMovieMotionHumanEnsemble.IEnsemble): number =>
    (COURSE - near) / slowest +
    tau +
    tau *
      steerAutoMovieCrowd.ARRIVAL *
      Math.log(near / Math.min(...e.members.map(HumanCrowd.half)));
  const scene = (dx: number, dz: number): IScene => {
    const ensemble: IAutoMovieMotionHumanEnsemble.IEnsemble = HumanEnsemble.of({
      id: "street",
      seed: "parting",
      count: 40,
      bodies: pool,
      preset: "civilians",
      places: (index: number): { at: IAutoMovieVector3; yaw: number } => ({
        at: {
          // Three abreast 0.8 m apart, wider than any two of the bodies' shoulders, each flow keeping to its own side.
          x: dx + (index % 2 === 0 ? -1 : 1) * (1.5 + 0.8 * ((index >> 1) % 3)),
          y: 0,
          z:
            dz +
            (index % 2 === 0 ? -14 : 14) +
            (index % 2 === 0 ? -1 : 1) * 1.1 * Math.floor(index / 6),
        },
        yaw: index % 2 === 0 ? 0 : 180,
      }),
    });
    const carriage: IAutoMovieMotionHumanObstacle.IObstacle = {
      subject: "carriage",
      footprint: [
        { x: -0.8, y: 0, z: -1.2 },
        { x: 0.8, y: 0, z: -1.2 },
        { x: 0.8, y: 0, z: 1.2 },
        { x: -0.8, y: 0, z: 1.2 },
      ],
      bottom: 0,
      top: 2.5,
      motion: (
        seconds: number,
      ): { position: IAutoMovieVector3; yaw: number } => ({
        position: { x: dx - 12 + 3 * seconds, y: 0, z: dz },
        yaw: 90,
      }),
    };
    const result: IAutoMovieMotionHumanCrowd.IResult = HumanCrowd.steer(ensemble, {
      goals: (m: IAutoMovieMotionHumanEnsemble.IMember): IAutoMovieVector3 => ({
        x: m.place.at.x,
        y: 0,
        z: m.place.at.z + (m.index % 2 === 0 ? COURSE : -COURSE),
      }),
      gait: "walk",
      start: 0,
      until: spanOf(ensemble),
      obstacles: [carriage],
    });
    return { result, ensemble, carriage };
  };
  const { result, ensemble, carriage }: IScene = scene(0, 0);
  const SPAN: number = spanOf(ensemble);
  const at = (frame: IAutoMovieMotionHumanFormation.ICourse, t: number): IAutoMovieVector3 =>
    HumanFormation.frame({ blocks: [], frame }, t).at;
  for (let t: number = 0; t <= SPAN; t += 1 / 24) {
    const c: IAutoMovieVector3 = carriage.motion!(t).position;
    const points: IAutoMovieVector3[] = result.frames.map(
      (f: IAutoMovieMotionHumanFormation.ICourse): IAutoMovieVector3 => at(f, t),
    );
    for (const [i, p] of points.entries()) {
      const half: number = HumanCrowd.half(ensemble.members[i]!);

      // The carriage faces +X: its 2.4 m runs along X, its 1.6 m along Z.
      const gap: number = Math.hypot(
        Math.max(0, Math.abs(p.x - c.x) - 1.2),
        Math.max(0, Math.abs(p.z - c.z) - 0.8),
      );
      if (gap < half - 1e-6) {
        findings.push(
          `${ensemble.members[i]!.subject} is ${gap.toFixed(3)} m from the carriage at ${t.toFixed(2)} s, within its ${half.toFixed(3)} m half breadth`,
        );
        t = Infinity;
        break;
      }
      for (let j: number = i + 1; j < points.length; ++j) {
        const d: number = Math.hypot(points[j]!.x - p.x, points[j]!.z - p.z);
        const sum: number = half + HumanCrowd.half(ensemble.members[j]!);
        if (d < sum - 1e-6) {
          findings.push(
            `${ensemble.members[i]!.subject} and ${ensemble.members[j]!.subject} are ${d.toFixed(3)} m apart at ${t.toFixed(2)} s, within ${sum.toFixed(3)} m`,
          );
          t = Infinity;
          break;
        }
      }
    }
  }
  result.arrivals.forEach((a: number | null, i: number): void => {
    if (a === null)
      findings.push(`${ensemble.members[i]!.subject} never arrives`);
  });
  const again: IScene = scene(0, 0);
  for (let i: number = 0; i < 40; ++i)
    for (let t: number = 0; t <= SPAN; t += 2) {
      const a: IAutoMovieVector3 = at(result.frames[i]!, t);
      const b: IAutoMovieVector3 = at(again.result.frames[i]!, t);
      if (a.x !== b.x || a.z !== b.z) {
        findings.push(`${ensemble.members[i]!.subject} does not replay`);
        break;
      }
    }
  // A crowd of 40 is sensitive to its initial conditions: measured on this street, the moved scene's courses part from the original's by 1.8e-15 m at 0 s, 1.2e-6 m at 2 s and 1.5e-2 m at 4 s, into another, equally valid parting. So the moved scene is held to 1e-6 m over its first second, inside that measured envelope, and to the scene's own requirements throughout; the law's bitwise frame invariance is `test_engine_steer_crowd`'s.
  const moved: IScene = scene(4, -2);
  for (let i: number = 0; i < 40; ++i)
    for (let t: number = 0; t <= 1; t += 1 / 24) {
      const a: IAutoMovieVector3 = at(result.frames[i]!, t);
      const b: IAutoMovieVector3 = at(moved.result.frames[i]!, t);
      if (Math.hypot(b.x - a.x - 4, b.z - a.z + 2) > 1e-6) {
        findings.push(
          `${ensemble.members[i]!.subject}'s course does not move with the scene`,
        );
        break;
      }
    }
  moved.result.arrivals.forEach((a: number | null, i: number): void => {
    if (a === null)
      findings.push(
        `${ensemble.members[i]!.subject} never arrives in the moved scene`,
      );
  });
  TestValidator.equals("a street parting round a carriage", findings, []);
}

/** Metres each member walks along the street. */
const COURSE: number = 30;

/** A steered street: the crowd's courses, its ensemble and the carriage. */
interface IScene {
  /** The courses. */
  result: IAutoMovieMotionHumanCrowd.IResult;

  /** The ensemble. */
  ensemble: IAutoMovieMotionHumanEnsemble.IEnsemble;

  /** The carriage. */
  carriage: IAutoMovieMotionHumanObstacle.IObstacle;
}
