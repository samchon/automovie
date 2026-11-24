import { AutoMovieGravity } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanThrown,
  IAutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanFall,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** A blast or a cable source in front of the performer, who faces +Z. */
const SOURCE: IAutoMovieMotionTarget = {
  kind: "point",
  frame: "world",
  at: { x: 0, y: 1, z: 2 },
};
/** The authored throw, metres. */
const DISTANCE: number = 2.5;
/** The authored rise above take-off, metres. */
const HEIGHT: number = 0.5;
/** The root's allowed departure from the projectile, metres: the displayed pose's rounding. */
const PATH: number = 1e-6;

/**
 * Bodies thrown by a blast and by a jerk-back, on two body sizes.
 *
 * Scenarios:
 * 1. The feet leave the floor at `takeoff`; the root then follows the
 *    projectile of the authored distance and height under standard gravity,
 *    sampled through the flight, and lands at `land` with its root the
 *    distance away.
 * 2. A blast throws the body away from its source and a jerk-back toward
 *    the cable; both land on the back, facing against their travel.
 * 3. Seeks before, during and after flight read the same poses in any
 *    order, and a non-positive distance is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the rigs, the projectile check, the landing and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Plans the registered law through HumanPerformance and reads the displayed root and bones.
 * @evidence contracts/development/testing.md#independent-expectations The projectile is computed here from the authored distance and height and the measured take-off height; the rigs set the expected travel.
 * @evidence contracts/development/testing.md#distinguishing-cases Two rigs, two bodies, in-flight against grounded instants, and an invalid throw.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_motion_fall_thrown(): void {
  const g: number = AutoMovieGravity.STANDARD;
  for (const cast of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(cast);
    const play = (
      params: IAutoMovieMotionHumanThrown.IParams,
    ): HumanPerformance =>
      new HumanPerformance({
        seed: "thrown",
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        laws: [AutoMovieMotionHumanFall.thrown],
        composition: HumanChain.subject("a")
          .stand({ hold: 0.3, sway: 0 })
          .registered(AutoMovieMotionHumanFall.thrown.name, params).node,
      });
    for (const rig of ["blast", "jerkBack"] as const) {
      const film: HumanPerformance = play({
        rig,
        target: SOURCE,
        distance: DISTANCE,
        height: HEIGHT,
      });
      const segment: IAutoMovieMotionHumanSegment = film.segments("a")[1]!;
      const at = (name: string): number =>
        segment.start +
        segment.plan.duration *
          segment.plan.events.find(
            (event: IAutoMovieMotionEvent): boolean => event.name === name,
          )!.share;
      const takeoff: number = at("takeoff");
      const land: number = at("land");
      const root = (t: number): IAutoMovieVector3 => film.posture("a", t).root;
      const start: IAutoMovieVector3 = root(takeoff);
      const sign: number = rig === "blast" ? -1 : 1;
      const rise: number = Math.sqrt(2 * g * HEIGHT);
      const flight: number = land - takeoff;
      for (let i: number = 0; i <= 10; ++i) {
        const t: number = (flight * i) / 10;
        const now: IAutoMovieVector3 = root(takeoff + t);
        TestValidator.predicate(
          `${cast} ${rig} root follows the projectile at ${t.toFixed(2)} s`,
          Math.abs(now.y - (start.y + rise * t - 0.5 * g * t * t)) <= PATH &&
            Math.abs(now.z - (start.z + (sign * DISTANCE * t) / flight)) <=
              PATH,
        );
      }
      const feet = (t: number): number =>
        Math.min(
          film.bones("a", t).get("leftFoot")!.worldPosition.y,
          film.bones("a", t).get("rightFoot")!.worldPosition.y,
        );
      TestValidator.predicate(
        `${cast} ${rig} feet leave the floor after take-off`,
        feet(takeoff + flight / 4) > feet(takeoff - 0.05) + 0.05,
      );
      const end: number = film.duration;
      const head: IAutoMovieVector3 = film
        .bones("a", end)
        .get("head")!.worldPosition;
      const hips: IAutoMovieVector3 = film
        .bones("a", end)
        .get("hips")!.worldPosition;
      TestValidator.predicate(
        `${cast} ${rig} lands on its back the distance away (root ${root(end).z.toFixed(4)}, hips ${hips.x.toFixed(2)} ${hips.y.toFixed(2)} ${hips.z.toFixed(2)}, head ${head.x.toFixed(2)} ${head.y.toFixed(2)} ${head.z.toFixed(2)})`,
        Math.abs(root(end).z - (start.z + sign * DISTANCE)) <= PATH &&
          hips.y <= body.measure.chestDepth &&
          sign * (head.z - hips.z) > 0.3,
      );
      const times: number[] = [0.1, takeoff + flight / 2, land + 0.2, end];
      const first: IAutoMovieVector3[] = times.map(root);
      const reversed: IAutoMovieVector3[] = [...times]
        .reverse()
        .map(root)
        .reverse();
      TestValidator.predicate(
        `${cast} ${rig} seeks read the same poses`,
        first.every(
          (a: IAutoMovieVector3, i: number): boolean =>
            Math.abs(a.x - reversed[i]!.x) +
              Math.abs(a.y - reversed[i]!.y) +
              Math.abs(a.z - reversed[i]!.z) <
            1e-9,
        ),
      );
    }
    let refusal: unknown;
    try {
      play({ target: SOURCE, distance: 0, height: HEIGHT });
    } catch (error: unknown) {
      refusal = error;
    }
    TestValidator.predicate(
      cast + " refuses a throw that goes nowhere",
      refusal instanceof HumanRefusal && refusal.axis === "distance",
    );
  }
}
