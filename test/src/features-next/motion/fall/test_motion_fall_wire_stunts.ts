import { AutoMovieGravity, Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanFall,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** The wall's face plane, metres along +x from the flight's line. */
const WALL: number = 0.7;
/** A foot meets its surface within this, metres: a sole's thickness. */
const SOLE: number = 0.05;
/** The rise of a lifted body, metres. */
const RISE: number = 1.2;
/** A hanging hand stays this far below its shoulder, metres: an arm that hangs, not one raised. */
const HANG: number = 0.3;
/** The arrested fall's free drop, metres. */
const DROP: number = 0.8;
/** The arrested fall's stop height, metres. */
const STOP: number = 0.3;
/** A sampled vertical acceleration may exceed the bound by this, m/s²: the finite difference's error. */
const SLACK: number = 0.5;
/** The finite difference step, seconds. */
const STEP: number = 1e-3;

/**
 * Wire stunts beyond a plain flight, on two bodies.
 *
 * Scenarios:
 * 1. A wuxia run: the right foot meets a wall's face at its authored share
 *    of the flight; a touch the leg cannot reach from the path is refused.
 * 2. A lifted body: raised by the wire in the limp shape, the hands hang
 *    below the shoulders throughout.
 * 3. An arrested fall: the root falls free, brakes within the authored
 *    deceleration, holds at the authored height and lands on the floor; a
 *    stop needing more than the bound is refused.
 * 4. Each take passes the shipped verdict report.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three stunts and what each check pins.
 * @evidence contracts/development/testing.md#behavioral-verification Plans the registered wireFlight and wireArrest rows through HumanPerformance and reads feet, hands, shoulders, the root and the verdict report.
 * @evidence contracts/development/testing.md#independent-expectations The wall, rise, drop and stop are authored; the deceleration bound is the authored one, read by finite differences.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies; a reachable and an unreachable touch; a feasible and a refused stop.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_motion_fall_wire_stunts(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const label of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(label);
    const g: number = AutoMovieGravity.STANDARD;

    // 1. The wall run.
    try {
      const film: HumanPerformance = perform(
        body,
        HumanChain.subject("a")
          .stand({ hold: 0.3, sway: 0 })
          .registered(AutoMovieMotionHumanFall.wireFlight.name, {
            to: { x: 0, y: 0.4, z: 3 },
            duration: 2,
            shape: "stride",
            touches: [
              {
                part: "rightFoot",
                target: { kind: "prop", subject: "wall", point: "face" },
                at: 0.5,
              },
            ],
          })
          .stand({ hold: 0.3, sway: 0 }),
      );
      const flight: IAutoMovieMotionHumanSegment = film.segments("a")[1]!;
      const at: number = flight.start + flight.plan.duration * 0.5;
      const foot: IAutoMovieVector3 = film
        .bones("a", at)
        .get("rightFoot")!.worldPosition;
      checks.check(
        `${label}: the foot meets the wall at its share (${(WALL - foot.x).toFixed(3)} m)`,
        Math.abs(WALL - foot.x) <= SOLE + 0.039 * body.measure.stature,
      );
      assertTakeClean(`${label} wall run`, film);
    } catch (error: unknown) {
      checks.check(`${label} wall run refused: ${String(error)}`, false);
    }
    let refusal: unknown = undefined;
    try {
      perform(
        body,
        HumanChain.subject("a")
          .stand({ hold: 0.3, sway: 0 })
          .registered(AutoMovieMotionHumanFall.wireFlight.name, {
            to: { x: -2, y: 0.4, z: 3 },
            duration: 2,
            touches: [
              {
                part: "rightFoot",
                target: { kind: "prop", subject: "wall", point: "face" },
                at: 0.5,
              },
            ],
          }),
      );
    } catch (error: unknown) {
      refusal = error;
    }
    checks.check(
      `${label}: an unreachable touch is refused: ${String(refusal)}`,
      refusal instanceof HumanRefusal && refusal.axis === "touches.0.target",
    );

    // 2. The lifted body.
    try {
      const film: HumanPerformance = perform(
        body,
        HumanChain.subject("a")
          .stand({ hold: 0.3, sway: 0 })
          .registered(AutoMovieMotionHumanFall.wireFlight.name, {
            to: { x: 0, y: RISE, z: 0.2 },
            duration: 2,
            shape: "limp",
          }),
      );
      const flight: IAutoMovieMotionHumanSegment = film.segments("a")[1]!;
      for (let i: number = 0; i <= 8; ++i) {
        const t: number = flight.start + (flight.plan.duration * i) / 8;
        const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          film.bones("a", t);
        for (const side of ["left", "right"] as const)
          checks.check(
            `${label}: the lifted ${side} hand hangs at ${t.toFixed(2)}`,
            bones.get(`${side}UpperArm`)!.worldPosition.y -
              bones.get(`${side}Hand`)!.worldPosition.y >=
              HANG,
          );
      }
      assertTakeClean(`${label} lift`, film);
    } catch (error: unknown) {
      checks.check(`${label} lift refused: ${String(error)}`, false);
    }

    // 3. The arrested fall, from a hover.
    const fall: (deceleration?: number) => HumanPerformance = (
      deceleration?: number,
    ): HumanPerformance =>
      perform(
        body,
        HumanChain.subject("a")
          .stand({ hold: 0.3, sway: 0 })
          .registered(AutoMovieMotionHumanFall.wireFlight.name, {
            to: { x: 0, y: 2.2, z: 0 },
            duration: 2,
          })
          .registered(AutoMovieMotionHumanFall.wireArrest.name, {
            drop: DROP,
            stop: STOP,
            ...(deceleration === undefined ? {} : { deceleration }),
          }),
      );
    try {
      const film: HumanPerformance = fall();
      const arrest: IAutoMovieMotionHumanSegment = film.segments("a")[2]!;
      const y: (t: number) => number = (t: number): number =>
        film.posture("a", t).root.y;
      let worst: number = 0;
      for (let i: number = 1; i < 60; ++i) {
        const t: number = arrest.start + (arrest.plan.duration * i) / 60;
        const a: number =
          (y(t + STEP) - 2 * y(t) + y(t - STEP)) / (STEP * STEP);
        worst = Math.max(worst, a);
      }
      const stopped: number =
        arrest.start +
        arrest.plan.duration *
          arrest.plan.events.find((e): boolean => e.name === "stopped")!.share;
      checks.check(
        `${label}: the wire brakes within its bound (${worst.toFixed(1)} m/s²)`,
        worst <= 2 * g + SLACK,
      );
      checks.check(
        `${label}: the fall holds at the stop (${y(stopped + 0.1).toFixed(3)} m) and lands`,
        Math.abs(y(stopped + 0.1) - STOP) <= 1e-6 &&
          Math.abs(y(arrest.start + arrest.plan.duration)) <= 1e-6,
      );
      assertTakeClean(`${label} arrested fall`, film);
    } catch (error: unknown) {
      checks.check(`${label} arrested fall refused: ${String(error)}`, false);
    }
    refusal = undefined;
    try {
      fall(2);
    } catch (error: unknown) {
      refusal = error;
    }
    checks.check(
      `${label}: a stop beyond the bound is refused: ${String(refusal)}`,
      refusal instanceof HumanRefusal && refusal.axis === "deceleration",
    );
  }
  checks.assert("wire stunts");
}

/** One performer with a wall beside the flight line. */
function perform(
  body: IAutoMovieMotionHumanBody,
  chain: IAutoMovieMotionHumanChain,
): HumanPerformance {
  return new HumanPerformance({
    seed: "wire-stunts",
    laws: [
      AutoMovieMotionHumanFall.wireFlight,
      AutoMovieMotionHumanFall.wireArrest,
    ],
    props: [wall()],
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: chain.node,
  });
}

/** A fixed wall whose face looks toward the flight line, its `face` point at mid-run. */
function wall(): IAutoMovieMotionHumanProp {
  return {
    subject: "wall",
    fixed: true,
    frame: {
      position: { x: WALL, y: 0, z: 1.5 },
      rotation: Quaternion.identity(),
    },
    points: {
      face: { point: { x: 0, y: 1.2, z: 0 }, normal: { x: -1, y: 0, z: 0 } },
    },
    affordances: [],
    shapes: [
      {
        id: "slab",
        kind: "box",
        halfExtents: { x: 0.1, y: 1.5, z: 2 },
        material: "stone",
        transform: {
          position: { x: 0.1, y: 1.5, z: 0 },
          rotation: Quaternion.identity(),
        },
      },
    ],
  };
}
