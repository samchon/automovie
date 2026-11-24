import { minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanWireFlight,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanFall,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";

import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";

/**
 * The root's allowed departure from the authored path, metres: the displayed
 * pose's rounding.
 */
const PATH: number = 1e-6;
/** A step of time for velocity reads, seconds. */
const STEP: number = 1e-3;
/**
 * The largest root speed at either end of a flight, metres per second: at rest,
 * within the finite difference's error.
 */
const REST: number = 0.02;

/**
 * Wire flights along authored paths in each shape, on two body sizes.
 *
 * Scenarios:
 *
 * 1. The root follows the straight segments of the path on the minimum-jerk arc
 *    length the test computes, at every sampled instant.
 * 2. The flight leaves and arrives at rest, so it joins the stands before and
 *    after it without a jump in root velocity.
 * 3. A superman flight lies face down along its travel at mid-flight, and a hover
 *    stays upright.
 * 4. Absolute seeks in any order read the same root, and a flight with no length
 *    or time is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the path check, the rest at the ends, the shapes and the refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Plans the registered law between stands through HumanPerformance and reads the displayed root and bones.
 * @evidence contracts/development/testing.md#independent-expectations The expected root is computed here from the authored points and the minimum-jerk profile; a face-down body has its head ahead of its pelvis at their height.
 * @evidence contracts/development/testing.md#distinguishing-cases Four shapes, two bodies, waypoints, seek orders and two invalid flights.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_motion_fall_wire_flight(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const cast of ["m-average", "f-small"] as const) {
    try {
      const body: IAutoMovieMotionHumanBody = motionHumanBody(cast);
      const play = (
        params: IAutoMovieMotionHumanWireFlight.IParams,
      ): HumanPerformance =>
        new HumanPerformance({
          seed: "wire-flight",
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          laws: [AutoMovieMotionHumanFall.wireFlight],
          composition: HumanChain.subject("a")
            .stand({ hold: 0.4, sway: 0 })
            .registered(AutoMovieMotionHumanFall.wireFlight.name, params)
            .stand({ hold: 0.4, sway: 0 }).node,
        });
      for (const shape of ["superman", "hover", "seated", "stride"] as const) {
        const start: IAutoMovieVector3 = play({
          to: { x: 0, y: 0, z: 1 },
          duration: 1,
        }).posture("a", 0).root;
        const via: IAutoMovieVector3 = { x: 0, y: start.y + 1.5, z: 2 };
        const to: IAutoMovieVector3 = { x: 1, y: start.y, z: 5 };
        const seconds: number = 2.4;
        const film: HumanPerformance = play({
          to,
          via: [via],
          duration: seconds,
          shape,
        });
        const flight = film.segments("a")[1]!;
        const points: IAutoMovieVector3[] = [start, via, to];
        const legs: number[] = [distance(start, via), distance(via, to)];
        const expected = (t: number): IAutoMovieVector3 => {
          let s: number = (legs[0]! + legs[1]!) * minimumJerk(t / seconds).s;
          const k: number = s <= legs[0]! ? 0 : 1;
          if (k === 1) s -= legs[0]!;
          const u: number = s / legs[k]!;
          const a: IAutoMovieVector3 = points[k]!;
          const b: IAutoMovieVector3 = points[k + 1]!;
          return {
            x: a.x + (b.x - a.x) * u,
            y: a.y + (b.y - a.y) * u,
            z: a.z + (b.z - a.z) * u,
          };
        };
        for (let i: number = 0; i <= 24; ++i) {
          const t: number = (seconds * i) / 24;
          checks.check(
            `${cast} ${shape} root on the path at ${t.toFixed(2)} s`,
            distance(film.posture("a", flight.start + t).root, expected(t)) <=
              PATH,
          );
        }
        const speed = (t: number): number =>
          distance(
            film.posture("a", t + STEP).root,
            film.posture("a", t - STEP).root,
          ) /
          (2 * STEP);
        checks.check(
          `${cast} ${shape} leaves and lands at rest`,
          speed(flight.start) <= REST && speed(flight.end) <= REST,
        );
        const mid = film.bones("a", flight.start + seconds / 2);
        const head: IAutoMovieVector3 = mid.get("head")!.worldPosition;
        const hips: IAutoMovieVector3 = mid.get("hips")!.worldPosition;
        if (shape === "superman")
          checks.check(
            `${cast} superman lies along its travel`,
            Math.abs(head.y - hips.y) < 0.25 &&
              Math.hypot(head.x - hips.x, head.z - hips.z) > 0.4,
          );
        if (shape === "hover")
          checks.check(`${cast} hover stays upright`, head.y - hips.y > 0.5);
        const times: number[] = [
          flight.start + 0.3,
          flight.start + 1.9,
          flight.start + 1.1,
        ];
        const first: IAutoMovieVector3[] = times.map(
          (t: number): IAutoMovieVector3 => film.posture("a", t).root,
        );
        checks.check(
          `${cast} ${shape} seeks repeat`,
          [...times.keys()]
            .reverse()
            .every(
              (i: number): boolean =>
                distance(film.posture("a", times[i]!).root, first[i]!) < 1e-12,
            ),
        );
      }
      const rest: IAutoMovieVector3 = play({
        to: { x: 0, y: 1, z: 1 },
        duration: 1,
      }).posture("a", 0).root;
      for (const [axis, params] of [
        ["duration", { to: { x: 0, y: 1, z: 1 }, duration: 0 }],
        ["to", { to: rest, duration: 1 }],
      ] as const) {
        let refusal: unknown;
        try {
          play(params);
        } catch (error: unknown) {
          refusal = error;
        }
        checks.check(
          `${cast} refuses a flight on ${axis}`,
          refusal instanceof HumanRefusal && refusal.axis === axis,
        );
      }
    } catch (error: unknown) {
      checks.check(`${String(cast)}: ${everydayTake.describe(error)}`, false);
    }
  }
  checks.assert("fall wire flight");
}

/** The distance between two points, metres. */
function distance(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}
