import { createBall } from "@automovie/archetypes";
import { AutoMovieComposition, Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieInteractionEvent,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropFlight,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";
import { qclose, vclose } from "../../../features/internal/predicates";

/**
 * A court ball picked up and passed by one actor remains the same prop as
 * another actor absorbs the pass. The catch needs the ball to arrive.
 *
 * Scenarios:
 * 1. Take a real ball from the court, chest-pass it to an actor and carry
 *    the same prop through the catch. A clear defender does not add an impact.
 * 2. Seek the displayed release, approach, catch and carry out of order.
 * 3. Refuse a requested catch while the ball is still beyond shoulder reach.
 *
 * The pass's authored aim supplies its arrival point and time. Read frame
 * and event parity with the existing ball-continuity test's 20 쨉m spatial
 * and 1 쨉s time tolerances. Neither tolerance claims accuracy of the
 * performers' natural timing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the held release, authored arrival, continuing grip, nearby miss, boundary reads and refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Uses the public basket prop, pickup, chest-pass and stageCatch in a three-actor performance. Reads displayed prop and wrist frames, launch and impact records, including a rejected requested interception.
 * @evidence contracts/development/testing.md#independent-expectations The authored aim and time fix the centre at arrival. Rigid carrying preserves the relative offset while the displayed catching hand changes position.
 * @evidence contracts/development/testing.md#distinguishing-cases Isolates a clean pass by including but keeping the defender clear. The too-early request uses the same ball and actors. The before and after reads distinguish release and successful capture at the real boundary.
 * @evidence contracts/development/testing.md#execution-ownership Runs portable in-memory public SDK compositions without a preview host.
 */
export function test_motion_throw_catch_ball_pass_custody(): void {
  const ballId: string = "court-pass-ball";
  const aim: IAutoMovieVector3 = { x: 0, y: 1.3, z: 3.45 };
  const flightTime: number = 0.42;
  const timeTolerance: number = 1e-6;
  const frameTolerance: number = 2e-5;
  const ball: IAutoMovieMotionHumanProp = HumanObject.prop(
    ballId,
    createBall({ kind: "basketball" }),
    { at: { x: 0, y: 0, z: 1.69 }, yaw: 0 },
  );
  const cast: readonly IAutoMovieMotionHumanPerformer[] = [
    {
      subject: "passer",
      body: motionHumanBody("f-average"),
      at: { x: 0, y: 0, z: 1.2 },
      yaw: 0,
      proficiency: { level: "trained" },
    },
    {
      subject: "receiver",
      body: motionHumanBody("m-average"),
      at: { x: 0, y: 0, z: 3.91 },
      yaw: 180,
      proficiency: { level: "trained" },
    },
    {
      subject: "defender",
      body: motionHumanBody("f-small"),
      at: { x: 1.5, y: 0, z: 2.6 },
      yaw: 180,
      proficiency: { level: "trained" },
    },
  ];
  const passer: IAutoMovieMotionHumanChain = HumanChain.subject("passer")
    .pickUp({ prop: ballId, handle: "grip", lift: 0.15 })
    .ballSport(
      { kind: "chestPass", prop: ballId, at: aim, flightSeconds: flightTime },
      "pass",
    );
  const contest: IAutoMovieMotionHumanChain = HumanChain.subject("defender")
    .stand({ hold: 2, sway: 0 })
    .ballSport({ kind: "highHandContest" });
  const take = (intercept: number): HumanPerformance =>
    new HumanPerformance({
      seed: "one-court-pass",
      performers: [...cast],
      props: [ball],
      composition: AutoMovieComposition.parallel(
        passer.node,
        contest.node,
        HumanChain.subject("receiver").registered("stageCatch", {
          partner: "pass",
          ball: ballId,
          hands: "one",
          intercept,
        }).node,
      ),
    });

  const performance: HumanPerformance = take(flightTime);
  const flights: readonly IAutoMovieMotionHumanPropFlight.IFlight[] =
    performance.flights(ballId);
  const flight: IAutoMovieMotionHumanPropFlight.IFlight = flights[0]!;
  const catchTime: number = flight.launch + flightTime;
  const finished: number = catchTime + 0.12;
  const centre = (time: number): IAutoMovieVector3 => {
    const frame: IAutoMovieRigidTransform = performance.prop(ballId, time);
    return Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, flight.published.sphere!.centre),
    );
  };
  TestValidator.predicate(
    "one released ball arrives and is taken by the receiver at the authored time",
    flights.length === 1 &&
      flight.prop === ballId &&
      flight.source.subject === "passer" &&
      nclose(flight.capturedAt ?? Infinity, catchTime, timeTolerance) &&
      nclose(flight.supersededAt ?? Infinity, catchTime, timeTolerance) &&
      vclose(
        centre(flight.launch - timeTolerance),
        centre(flight.launch),
        frameTolerance,
      ) &&
      vclose(centre(catchTime - timeTolerance), aim, frameTolerance) &&
      vclose(centre(catchTime), aim, frameTolerance) &&
      vclose(centre(catchTime + timeTolerance), aim, frameTolerance) &&
      performance
        .hits()
        .every(
          (hit: IAutoMovieInteractionEvent): boolean => hit.object !== ballId,
        ),
  );

  const hand = (time: number): IAutoMovieResolvedBone =>
    performance.bones("receiver", time).get("rightHand")!;
  const fromHand = (time: number): IAutoMovieVector3 =>
    Quaternion.rotateVector(
      Quaternion.inverse(hand(time).worldRotation),
      Vector3.subtract(centre(time), hand(time).worldPosition),
    );
  TestValidator.predicate(
    "the receiver moves the caught ball after closure",
    !vclose(centre(catchTime), centre(finished), frameTolerance) &&
      vclose(fromHand(catchTime), fromHand(finished), frameTolerance),
  );

  const times: readonly number[] = [
    flight.launch - timeTolerance,
    flight.launch,
    flight.launch + flightTime / 2,
    catchTime - timeTolerance,
    catchTime,
    catchTime + timeTolerance,
    finished,
  ];
  const forward: readonly IAutoMovieRigidTransform[] = times.map(
    (time: number): IAutoMovieRigidTransform => performance.prop(ballId, time),
  );
  TestValidator.predicate(
    "later and reversed reads preserve each displayed frame",
    [...times].reverse().every((time: number, index: number): boolean => {
      const first: IAutoMovieRigidTransform =
        forward[forward.length - 1 - index]!;
      const second: IAutoMovieRigidTransform = performance.prop(ballId, time);
      return (
        vclose(first.position, second.position, frameTolerance) &&
        qclose(first.rotation, second.rotation, frameTolerance)
      );
    }),
  );

  let failure: unknown;
  try {
    take(0.06).flights(ballId);
  } catch (error: unknown) {
    failure = error;
  }
  TestValidator.predicate(
    "the same receiver cannot take custody before arrival",
    failure instanceof HumanRefusal &&
      failure.kind === "reach" &&
      failure.axis === "partner",
  );
}
