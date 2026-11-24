import { createBall } from "@automovie/archetypes";
import { AutoMovieComposition, Quaternion, Transform } from "@automovie/engine";
import type {
  IAutoMovieInteractionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropFlight,
  IAutoMovieMotionHumanStand,
  IAutoMovieMotionPropLaunch,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStance,
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
 * A staged sphere keeps its noncentral model origin through launch, floor
 * rebound and hand custody on the same film clock.
 *
 * Scenarios:
 * 1. An aimed launch produces the exact incoming path and ball-surface floor impact.
 * 2. The planned one-hand catch takes custody from the outgoing rebound,
 *    with a continuous displayed centre and one recorded ball impact.
 * 3. A low bounce uses the same launch radius to choose rolling on the floor.
 * 4. The public chest pass refuses to take custody of a distant free ball.
 *
 * The inputs describe a 10 cm radius sphere with its origin on the floor
 * side of the model, a drag-free flight, no tangential impulse and a 0.75
 * normal speed ratio. The launch supplies its sole collision shape.
 * Intercept and floor times are independently derived
 * from standard gravity and the fixture's velocities. Timing tolerance is
 * 1 쨉s, and contact continuity uses 20 쨉m to allow the corresponding
 * travelling distance and the offset re-seating tolerance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Specifies the geometry, timing, two scenarios, independent physical model and tolerances.
 * @evidence contracts/development/testing.md#behavioral-verification Places an anchored release and the real stageCatch through the public performance, then checks actual prop frames, custody and the physical hit.
 * @evidence contracts/development/testing.md#independent-expectations Uses authored radius, normal speed ratio and constant-gravity solutions to derive contact, rebound, intercept and frame bounds.
 * @evidence contracts/development/testing.md#distinguishing-cases The first impact occurs at the sphere surface, while stageCatch takes the same launch after the floor rebound without publishing a second impact or resetting the ball.
 * @evidence contracts/development/testing.md#execution-ownership Builds one two-actor film with one movable prop, one release, one catch and no hosts. Queries the release, contact and interception boundaries.
 */
export function test_motion_throw_catch_ball_continuity(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const subject: string = "court-ball";
  const radius: number = 0.1;
  const height: number = 1.5;
  const releaseSeconds: number = 0.25;
  const gravity: number = 9.80665;
  const downward: number = 4;
  const forward: number = 2.1;
  const restitution: number = 0.75;
  const normalSpeed: number = Math.sqrt(
    downward ** 2 + 2 * gravity * (height - radius),
  );
  const toFloor: number = (normalSpeed - downward) / gravity;
  const afterBounce: number = 0.35;
  const intercept: number = toFloor + afterBounce;
  const atCatch: IAutoMovieVector3 = {
    x: 0,
    y:
      radius +
      restitution * normalSpeed * afterBounce -
      (gravity * afterBounce ** 2) / 2,
    z: forward * intercept,
  };
  const centre: IAutoMovieVector3 = { x: 0, y: radius, z: 0 };
  const origin: IAutoMovieVector3 = { x: 0, y: height - radius, z: 0 };
  const rotation: IAutoMovieQuaternion = Quaternion.identity();
  const calibration: number = 0.1;
  const launch: IAutoMovieMotionPropLaunch = {
    prop: subject,
    point: origin,
    seconds: releaseSeconds,
    velocity: { x: 0, y: 0, z: 0 },
    sphere: { radius, centre, tangentialFriction: 0 },
    aim: {
      seconds: calibration,
      point: {
        x: 0,
        y: height - downward * calibration - (gravity * calibration ** 2) / 2,
        z: forward * calibration,
      },
    },
  };
  const ball: IAutoMovieMotionHumanProp = {
    subject,
    frame: { position: origin, rotation },
    points: {},
    body: { mass: 0.6, centerOfMass: centre, restitution },
    affordances: [
      {
        id: "grip",
        kind: "handle",
        symmetry: "round",
        frame: Transform.of(centre, rotation),
        extent: null,
        aperture: 2 * radius,
      },
    ],
  };
  const release: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStand.IParams> =
    {
      ...AutoMovieMotionHumanStance.stand,
      name: "releaseCourtBall",
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStand.IParams>,
      ): IAutoMovieMotionHumanActionPlan => ({
        ...AutoMovieMotionHumanStance.stand.plan(context),
        launches: [launch],
      }),
    };
  const performance: HumanPerformance = new HumanPerformance({
    seed: "exercise-ball-bounce-and-capture",
    laws: [release],
    props: [ball],
    performers: [
      {
        subject: "passer",
        body,
        at: { x: 4, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
      {
        subject: "receiver",
        body,
        at: { x: 0, y: 0, z: atCatch.z + 0.46 },
        yaw: 180,
        proficiency: { level: "trained" },
      },
    ],
    composition: AutoMovieComposition.parallel(
      HumanChain.subject("passer").registered(
        "releaseCourtBall",
        { hold: 2 },
        "bounce",
      ).node,
      HumanChain.subject("receiver").registered("stageCatch", {
        partner: "bounce",
        ball: subject,
        hands: "one",
        intercept,
      }).node,
    ),
  });

  const flights: readonly IAutoMovieMotionHumanPropFlight.IFlight[] =
    performance.flights(subject);
  const flight: IAutoMovieMotionHumanPropFlight.IFlight = flights[0]!;
  const floor: number = releaseSeconds + toFloor;
  const captured: number = releaseSeconds + intercept;
  const timeTolerance: number = 1e-6;
  const positionTolerance: number = 2e-5;
  TestValidator.predicate(
    "the displayed release and incoming path retain the bottom origin",
    vclose(
      performance.prop(subject, releaseSeconds).position,
      origin,
      positionTolerance,
    ) &&
      vclose(
        performance.prop(subject, releaseSeconds + calibration).position,
        {
          x: 0,
          y:
            height -
            downward * calibration -
            (gravity * calibration ** 2) / 2 -
            radius,
          z: forward * calibration,
        },
        positionTolerance,
      ),
  );
  TestValidator.predicate(
    "one anchored flight reaches the sphere surface and hands the same ball off",
    flights.length === 1 &&
      flight.published === launch &&
      nclose(flight.end, floor, timeTolerance) &&
      nclose(flight.capturedAt ?? Infinity, captured, timeTolerance),
  );
  const hits: readonly IAutoMovieInteractionEvent[] = performance
    .hits()
    .filter(
      (event: IAutoMovieInteractionEvent): boolean => event.object === subject,
    );
  TestValidator.predicate(
    "the one floor impact preserves forward speed and reverses the expected normal share",
    hits.length === 1 &&
      hits[0]?.point?.y === 0 &&
      nclose(
        hits[0]?.velocity?.y ?? Infinity,
        -normalSpeed,
        positionTolerance,
      ) &&
      nclose(
        hits[0]?.exit?.y ?? Infinity,
        restitution * normalSpeed,
        positionTolerance,
      ) &&
      nclose(hits[0]?.exit?.z ?? Infinity, forward, positionTolerance),
  );
  TestValidator.predicate(
    "the displayed origin touches the floor and remains continuous at the catch",
    nclose(performance.prop(subject, floor).position.y, 0, positionTolerance) &&
      vclose(
        performance.prop(subject, captured).position,
        { ...atCatch, y: atCatch.y - radius },
        positionTolerance,
      ) &&
      vclose(
        performance.prop(subject, captured + timeTolerance).position,
        performance.prop(subject, captured).position,
        positionTolerance,
      ),
  );

  const drop: number = 0.03;
  const rolling: number = 0.05;
  const lowLaunch: IAutoMovieMotionPropLaunch = {
    prop: subject,
    point: { x: 0, y: drop, z: 0 },
    seconds: releaseSeconds,
    sphere: launch.sphere!,
    velocity: { x: 0, y: 0, z: forward },
  };
  const rollRelease: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStand.IParams> =
    {
      ...release,
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStand.IParams>,
      ): IAutoMovieMotionHumanActionPlan => ({
        ...AutoMovieMotionHumanStance.stand.plan(context),
        launches: [lowLaunch],
      }),
    };
  const roll: HumanPerformance = new HumanPerformance({
    seed: "exercise-sphere-roll",
    laws: [rollRelease],
    props: [{ ...ball, body: { ...ball.body!, contact: { rolling } } }],
    performers: [
      {
        subject: "passer",
        body,
        at: { x: 4, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("passer").registered(rollRelease.name, {
      hold: 1,
    }).node,
  });
  const lowFloor: number = Math.sqrt((2 * drop) / gravity);
  const rollSeconds: number = 0.2;
  const rolled: IAutoMovieVector3 = roll.prop(
    subject,
    releaseSeconds + lowFloor + rollSeconds,
  ).position;
  TestValidator.predicate(
    "a subradius bounce rolls along the floor using the explicit sphere",
    roll.flights(subject)[0]?.legs?.[0]?.segment.kind === "roll" &&
      vclose(
        rolled,
        {
          x: 0,
          y: 0,
          z:
            forward * (lowFloor + rollSeconds) -
            0.5 * rolling * gravity * rollSeconds ** 2,
        },
        positionTolerance,
      ),
  );

  let freeBallRefusal: unknown;
  try {
    const withoutPossession: HumanPerformance = new HumanPerformance({
      seed: "exercise-court-release-without-possession",
      performers: [
        {
          subject: "player",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      props: [
        HumanObject.prop(subject, createBall({ kind: "basketball" }), {
          at: { x: 3, y: 0, z: 0 },
          yaw: 0,
        }),
      ],
      composition: HumanChain.subject("player").ballSport({
        kind: "chestPass",
        prop: subject,
        at: { x: 0, y: 1.3, z: 3 },
      }).node,
    });
    withoutPossession.flights(subject);
  } catch (error: unknown) {
    freeBallRefusal = error;
  }
  TestValidator.predicate(
    "a court release cannot invent a grip on a free ball",
    freeBallRefusal instanceof HumanRefusal &&
      freeBallRefusal.kind === "affordance" &&
      freeBallRefusal.axis === "prop",
  );
}
