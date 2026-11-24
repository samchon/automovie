import { createBall } from "@automovie/archetypes";
import {
  AutoMovieComposition,
  AutoMovieGravity,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  IAutoMovieComposition,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropFlight,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanThrowCatch,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";
import { vclose } from "../../../features/internal/vclose";

/**
 * A defender's deliberate deflection takes the same court ball over at the
 * touch, sends it back by the ball's own restitution, and a receiver
 * recovers it.
 *
 * Scenarios:
 * 1. A chest pass reaches a defender's `stageDeflect` at its authored
 *    arrival. The pass ends at the defender's launch with no contact of its
 *    own; the ball's centre is continuous through the touch; the deflected
 *    velocity is the ball's restitution times the reversed incoming velocity
 *    (a head-on normal impact on a palm held through the touch).
 * 2. A receiver placed on the deflected flight, a quarter second out, takes the
 *    same ball with `stageCatch`, and the deflected flight ends at that catch.
 * 3. A deflection asked before the ball arrives refuses on `reach`.
 *
 * The incoming velocity is read off the displayed ball before the touch, and
 * the recovery point integrates standard gravity from the published
 * deflection, independent of the law's own sampling. Frame parity uses the
 * ball-continuity spec's 20 쨉m and 1 쨉s tolerances.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three plays, the rebound rule and its premise, and the tolerances.
 * @evidence contracts/development/testing.md#behavioral-verification Runs pickUp, chestPass, stageDeflect and stageCatch through HumanPerformance and reads flights, published launches and displayed ball frames; a deflection that bounces off the hand, restarts the ball or loses it before the catch fails.
 * @evidence contracts/development/testing.md#independent-expectations The rebound is the stated normal-impact relation with the prop's own restitution; the recovery point is ballistic from the published launch; the incoming velocity is measured on the displayed ball.
 * @evidence contracts/development/testing.md#distinguishing-cases A deflection at arrival, its recovery, and an early deflection that must refuse. The pass-custody spec owns the clean pass; the incoming-stroke spec owns a held instrument's handback.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances of three polygon men and one ball.
 */
export function test_motion_throw_catch_ball_deflection(): void {
  const ballId: string = "deflect-ball";
  const aim: IAutoMovieVector3 = { x: 0, y: 1.3, z: 3.45 };
  const flightTime: number = 0.42;
  const back: number = 0.25;
  const timeTolerance: number = 1e-6;
  const frameTolerance: number = 2e-5;
  const ball: IAutoMovieMotionHumanProp = HumanObject.prop(
    ballId,
    createBall({ kind: "basketball" }),
    { at: { x: 0, y: 0, z: 1.69 }, yaw: 0 },
  );
  const restitution: number = ball.body!.restitution!;
  const passer: IAutoMovieMotionHumanPerformer = {
    subject: "passer",
    body: motionHumanBody("f-average"),
    at: { x: 0, y: 0, z: 1.2 },
    yaw: 0,
    proficiency: { level: "trained" },
  };
  const defender: IAutoMovieMotionHumanPerformer = {
    subject: "defender",
    body: motionHumanBody("m-average"),
    at: { x: 0, y: 0, z: 3.91 },
    yaw: 180,
    proficiency: { level: "trained" },
  };
  const pass: IAutoMovieComposition = HumanChain.subject("passer")
    .pickUp({ prop: ballId, handle: "grip", lift: 0.15 })
    .ballSport(
      { kind: "chestPass", prop: ballId, at: aim, flightSeconds: flightTime },
      "pass",
    ).node;
  const deflect = (intercept: number): IAutoMovieComposition =>
    HumanChain.subject("defender").registered(
      "stageDeflect",
      { partner: "pass", ball: ballId, hands: "one", intercept },
      "deflect",
    ).node;
  const film = (
    intercept: number,
    receiver?: IAutoMovieMotionHumanPerformer,
  ): HumanPerformance =>
    new HumanPerformance({
      seed: "ball-deflection",
      laws: [
        AutoMovieMotionHumanThrowCatch.stageDeflect,
      ],
      performers: [
        passer,
        defender,
        ...(receiver === undefined ? [] : [receiver]),
      ],
      props: [ball],
      composition: AutoMovieComposition.parallel(
        pass,
        deflect(intercept),
        ...(receiver === undefined
          ? []
          : [
              HumanChain.subject("receiver").registered("stageCatch", {
                partner: "deflect",
                ball: ballId,
                hands: "two",
                intercept: back,
              }).node,
            ]),
      ),
    });

  // 1. The deflection.
  const deflected: HumanPerformance = film(flightTime);
  const flights: readonly IAutoMovieMotionHumanPropFlight.IFlight[] =
    deflected.flights(ballId);
  const incoming: IAutoMovieMotionHumanPropFlight.IFlight | undefined =
    flights[0];
  const outgoing: IAutoMovieMotionHumanPropFlight.IFlight | undefined =
    flights[1];
  if (incoming === undefined || outgoing === undefined)
    throw new Error("The pass is not deflected");
  const centre = (
    performance: HumanPerformance,
    t: number,
  ): IAutoMovieVector3 => {
    const frame: IAutoMovieRigidTransform = performance.prop(ballId, t);
    return Vector3.add(
      frame.position,
      Quaternion.rotateVector(
        frame.rotation,
        outgoing.published.sphere!.centre,
      ),
    );
  };
  const touch: number = outgoing.launch;
  const h: number = 1e-3;
  const before: IAutoMovieVector3 = Vector3.scale(
    Vector3.subtract(centre(deflected, touch), centre(deflected, touch - h)),
    1 / h,
  );
  TestValidator.predicate(
    "the pass ends at the defender's launch with no contact of its own",
    flights.length === 2 &&
      incoming.source.subject === "passer" &&
      outgoing.source.subject === "defender" &&
      incoming.contact === undefined &&
      nclose(incoming.supersededAt ?? Infinity, touch, timeTolerance) &&
      nclose(touch, incoming.launch + flightTime, 2e-3),
  );
  TestValidator.predicate(
    "the ball's centre is continuous through the touch",
    vclose(
      centre(deflected, touch - timeTolerance),
      centre(deflected, touch),
      frameTolerance,
    ) &&
      vclose(
        centre(deflected, touch),
        centre(deflected, touch + timeTolerance),
        frameTolerance,
      ),
  );
  // The finite difference over 1 ms differs from the touch velocity by the
  // gravity term g h / 2 (5 mm/s), well under the 2 cm/s bound.
  TestValidator.predicate(
    "the deflected velocity is the ball's restitution times the reversed incoming velocity",
    vclose(
      outgoing.published.velocity,
      Vector3.scale(before, -restitution),
      0.02,
    ),
  );

  // 2. The recovery.
  const start: IAutoMovieVector3 = centre(deflected, touch);
  const v: IAutoMovieVector3 = outgoing.published.velocity;
  const g: number = AutoMovieGravity.STANDARD;
  const recovered: IAutoMovieVector3 = {
    x: start.x + v.x * back,
    y: start.y + v.y * back - (g * back * back) / 2,
    z: start.z + v.z * back,
  };
  const away: IAutoMovieVector3 = Vector3.normalize({ ...v, y: 0 });
  const receiver: IAutoMovieMotionHumanPerformer = {
    subject: "receiver",
    body: motionHumanBody("m-average"),
    at: { ...Vector3.add(recovered, Vector3.scale(away, 0.46)), y: 0 },
    yaw: (Math.atan2(-away.x, -away.z) * 180) / Math.PI,
    proficiency: { level: "trained" },
  };
  const play: HumanPerformance = film(flightTime, receiver);
  const recoveredFlight: IAutoMovieMotionHumanPropFlight.IFlight | undefined =
    play.flights(ballId)[1];
  TestValidator.predicate(
    "the receiver takes the same deflected ball a quarter second on",
    play.flights(ballId).length === 2 &&
      recoveredFlight?.source.subject === "defender" &&
      nclose(
        recoveredFlight.capturedAt ?? Infinity,
        recoveredFlight.launch + back,
        timeTolerance,
      ) &&
      vclose(
        centre(play, recoveredFlight.launch + back),
        recovered,
        frameTolerance,
      ),
  );

  // 3. Too early.
  let failure: unknown;
  try {
    film(0.06).flights(ballId);
  } catch (error: unknown) {
    failure = error;
  }
  TestValidator.predicate(
    "a deflection asked before the ball arrives refuses",
    failure instanceof HumanRefusal && failure.kind === "reach",
  );
}
