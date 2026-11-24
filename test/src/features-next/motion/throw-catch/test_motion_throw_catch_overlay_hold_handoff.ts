import { createBall } from "@automovie/archetypes";
import { AutoMovieComposition, Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanStand,
  IAutoMovieMotionHumanVerdicts,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStance,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanVerdicts,
} from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { ballPossessions } from "../../../features/internal/ballPossessions";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * How far a holding hand may drift on the ball it holds, metres: the contact
 * verdicts' own 10 mm.
 */
const DRIFT: number = 0.01;

/**
 * Seconds read before the catch's end, past the overlay's fade back to its
 * carrier (`HumanSegment.FADE`, 0.2 s) and two 24 Hz frames.
 */
const BEFORE: number = 0.3;

/** A thrower that stands holding the ball in the right hand from the start. */
const thrower: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStand.IParams> =
  {
    ...AutoMovieMotionHumanStance.stand,
    name: "handoffFixtureThrower",
    plan: (
      context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStand.IParams>,
    ): IAutoMovieMotionHumanActionPlan => ({
      ...AutoMovieMotionHumanStance.stand.plan(context),
      holds: [{ side: "right", prop: "ball", from: 0 }],
    }),
  };

/**
 * A two-hand catch laid over a stand that goes on after the catch ends hands
 * the caught ball on to the stand's carry of it: the arms leave the catch where
 * they hold the ball, not by fading back to the stand's hanging arms.
 *
 * Scenarios:
 *
 * 1. The ball is launched once and ends held by the receiver.
 * 2. From before the catch's fade to the end of the stand, each hand keeps its
 *    distance to the ball it holds within the contact verdicts' 10 mm.
 * 3. The verdict report over the catch's end and the carried stand is clean.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the hand-over and what each check pins.
 * @evidence contracts/development/testing.md#behavioral-verification Runs throwObject and an overlaid stageCatch through HumanPerformance and reads the ball's possessions, its displayed frame, the hands and the shipped verdicts.
 * @evidence contracts/development/testing.md#independent-expectations A held ball rides its hands, so their distance to it is fixed while it is held; the verdicts are the shipped report's.
 * @evidence contracts/development/testing.md#distinguishing-cases The catch's end falls inside its carrier, where a hold carried on and one faded back to the carrier's arms differ.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory performance of two polygon men and one ball.
 */
export function test_motion_throw_catch_overlay_hold_handoff(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const ready: HumanPerformance = new HumanPerformance({
    seed: "handoff-ready",
    performers: [
      {
        subject: "thrower",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("thrower").stand({ hold: 0.2, sway: 0 })
      .node,
  });
  const hand: IAutoMovieVector3 = HumanHand.frame(
    body,
    ready.bones("thrower", 0),
    "right",
    "grip",
  ).point;
  const ball: ReturnType<typeof createBall> = createBall({
    kind: "basketball",
  });
  const centre: IAutoMovieVector3 = ball.affordance("grip").frame.translation;
  const film: HumanPerformance = new HumanPerformance({
    seed: "handoff",
    laws: [thrower],
    performers: [
      {
        subject: "thrower",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
      {
        subject: "receiver",
        body,
        at: { x: 0, y: 0, z: 6 },
        yaw: 180,
        proficiency: { level: "trained" },
      },
    ],
    props: [
      HumanObject.prop("ball", ball, {
        position: Vector3.subtract(hand, centre),
        rotation: Quaternion.identity(),
      }),
    ],
    composition: AutoMovieComposition.parallel(
      HumanChain.subject("thrower")
        .registered(thrower.name, { hold: 0.2, sway: 0 })
        .throwObject(
          {
            prop: "ball",
            // Chest high in front of the receiver.
            target: {
              kind: "point",
              frame: "world",
              at: { x: 0, y: 1.25, z: 5.55 },
            },
          },
          "throw",
        )
        .stand({ hold: 1.5, sway: 0 }).node,
      HumanChain.subject("receiver")
        .stand({ hold: 3, sway: 0 })
        .over((upper) =>
          upper
            .registered("stageCatch", {
              partner: "throw",
              ball: "ball",
              hands: "two",
            })
            .sync({ of: "throw" }),
        ).node,
    ),
  });

  // 1. One launch, held by the receiver at the end.
  const caught: string[] = ballPossessions(film.play("ball"));
  TestValidator.predicate(
    `the ball is launched once and held by the receiver: ${caught.join(", ")}`,
    caught.filter((p: string): boolean => p.startsWith("launch")).length ===
      1 && caught.at(-1) === "hold:receiver:true",
  );

  // 2. Each hand keeps its place on the ball through the catch's end.
  const overlay: IAutoMovieMotionHumanSegment.IOverlay =
    film.overlays("receiver")[0]!;
  const carrier: IAutoMovieMotionHumanSegment = film.segments("receiver")[0]!;
  const gap = (side: "left" | "right", t: number): number => {
    const frame: IAutoMovieRigidTransform = film.prop("ball", t);
    return Vector3.distance(
      HumanHand.frame(body, film.bones("receiver", t), side, "grip").point,
      Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, centre),
      ),
    );
  };
  const from: number = overlay.end - BEFORE;
  let drift: number = 0;
  for (let t: number = from; t <= carrier.end; t += 1 / 120)
    for (const side of ["left", "right"] as const)
      drift = Math.max(drift, Math.abs(gap(side, t) - gap(side, from)));
  TestValidator.predicate(
    `the hands stay on the ball as the catch ends and the stand carries it (${(drift * 1000).toFixed(1)} mm)`,
    drift <= DRIFT,
  );

  // 3. The shipped verdicts over the catch's end and the carried stand.
  const report: IAutoMovieMotionHumanVerdicts.IReport = HumanVerdicts.of(
    film,
    24,
    { from, to: carrier.end },
  );
  TestValidator.predicate(
    `the hand-over passes the verdicts: ${report.clean ? "clean" : HumanVerdicts.describe(report)}`,
    report.clean,
  );
}
