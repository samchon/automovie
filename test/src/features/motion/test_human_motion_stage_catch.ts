import {
  AutoMovieComposition,
  Quaternion,
  Transform,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  IAutoMovieHumanoidSurfaces,
  IAutoMovieInteractionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropFlight,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanStand,
  IAutoMovieMotionHumanThrowObject,
  IAutoMovieMotionPropLaunch,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  HumanVerdicts,
  stageCatch,
  stand,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A centered foam ball moves from its staged launch to the catcher and is
 * then carried on the catcher's right hand without a position jump. The
 * catch owns only its tagged flight, so there is no later floor impact.
 *
 * Scenarios:
 * 1. The complete catch takes custody and carries the foam ball.
 * 2. A catch cut at preparation stops before custody.
 *
 * The catch plane is the catch contract's documented 0.6 arm lengths
 * ahead of the performer. The emitter sends the ball to that plane in
 * 0.6 s and authors vertical speed so it returns to its release height
 * there. Trajectory and boundary parity use the campaign's 1 µm position
 * bound. The palm meets the ball's radius within the campaign's 2 mm
 * held-prop alignment bound.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the opt-in capture, ballistic interception, spatial handoff, and geometric tolerances.
 * @evidence contracts/development/testing.md#behavioral-verification Registers the staged catch and release through public performance inputs, then reads the flight, contacts, ball frames and palm. A floating grip, lost capture, position jump or subsequent ghost impact fails.
 * @evidence contracts/development/testing.md#independent-expectations Computes intercept time from release time and forward travel, and height from constant gravity. The palm's distance comes from the authored radius and the carry invariant comes from rigid hand motion.
 * @evidence contracts/development/testing.md#distinguishing-cases Samples the end of the ballistic path, the first held position and later carried position. A no-contact flight cut by a tagged grip is distinct from the unended flights in the separate horizon spec.
 * @evidence contracts/development/testing.md#execution-ownership Creates two in-memory performances with one prepared body, an authored release and a complete or cut single-hand catch. Reads a fixed set of boundary and carrying samples without a host.
 */
export function test_human_motion_stage_catch(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const gripRadius: number = 0.075;
  const flightTime: number = 0.6;
  const speed: number = 2;
  const gravity: number = 9.80665; // Standard acceleration, third CGPM (1901).
  const point: IAutoMovieVector3 = { x: 0, y: 1.35, z: 0 };
  const launch: IAutoMovieMotionPropLaunch = {
    prop: "foam-ball",
    seconds: 0.25,
    point,
    velocity: { x: 0, y: 0.5 * gravity * flightTime, z: speed },
  };
  const expected: IAutoMovieVector3 = { ...point, z: flightTime * speed };
  const intercept: number = launch.seconds + flightTime;
  const arm: number = body.measure.upperArm + body.measure.forearm;
  const heldPoint: number = 0.6 * arm;
  const still: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const rotation: IAutoMovieQuaternion = Quaternion.identity();
  const ball: IAutoMovieMotionHumanProp = {
    subject: launch.prop,
    frame: { position: point, rotation },
    points: {},
    affordances: [
      {
        id: "grip",
        kind: "handle",
        symmetry: "round",
        frame: Transform.of(still, rotation),
        extent: null,
        aperture: 2 * gripRadius,
      },
    ],
  };
  const release: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStand.IParams> =
    {
      ...stand,
      name: "releaseFoamBall",
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStand.IParams>,
      ): IAutoMovieMotionHumanThrowObject.IPlan => ({
        ...stand.plan(context),
        launch: {
          point,
          target: expected,
          seconds: launch.seconds,
          velocity: launch.velocity,
        },
        launches: [launch],
      }),
    };
  /** Compose the same release with the full or shortened catch. */
  const take = (cut: boolean): HumanPerformance => {
    const catcher: IAutoMovieMotionHumanChain = HumanChain.subject("catcher").registered(
      "stageCatch",
      { from: "foam-release", ball: launch.prop, hands: "one" },
    );
    if (cut) catcher.until({ event: "prepare" });
    return new HumanPerformance({
      seed: "staged-foam-catch",
      laws: [release, stageCatch],
      props: [ball],
      performers: [
        {
          subject: "emitter",
          body,
          at: { x: 4, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        {
          subject: "catcher",
          body,
          at: { x: 0, y: 0, z: expected.z + heldPoint },
          yaw: 180,
          proficiency: { level: "trained" },
        },
      ],
      composition: AutoMovieComposition.parallel(
        HumanChain.subject("emitter").registered(
          "releaseFoamBall",
          { seconds: 2 },
          "foam-release",
        ).node,
        catcher.node,
      ),
    });
  };
  const performance: HumanPerformance = take(false);
  const tolerance: number = 1e-6;
  const flight: IAutoMovieMotionHumanPropFlight.IFlight =
    performance.flights(launch.prop)[0]!;
  const captured: number = flight.capturedAt ?? Infinity;
  const unended: string[] | undefined = HumanVerdicts.of(performance).unended;
  TestValidator.predicate(
    "the anchored launch is captured at the independent intercept",
    Math.abs(captured - intercept) <= tolerance &&
      flight.contact === undefined &&
      performance.hits().every(
        (hit: IAutoMovieInteractionEvent): boolean => hit.object !== launch.prop,
      ) &&
      unended?.every(
        (entry: string): boolean => !entry.startsWith(`${launch.prop}@`),
      ) === true,
  );

  const boundary: IAutoMovieVector3 = performance.prop(
    launch.prop,
    captured,
  ).position;
  const after: number = captured + Number.EPSILON * Math.max(1, captured);
  const received: IAutoMovieVector3 = performance.prop(
    launch.prop,
    after,
  ).position;
  TestValidator.predicate(
    "the ball reaches the authored point continuously across the grip",
    Vector3.length(Vector3.subtract(boundary, expected)) <= tolerance &&
      Vector3.length(Vector3.subtract(boundary, received)) <= tolerance,
  );

  const palm: IAutoMovieHumanoidSurfaces.IFrame = body.surfaces.regions.palmRight;
  const hand: IAutoMovieResolvedBone = performance
    .bones("catcher", after)
    .get(palm.bone)!;
  TestValidator.predicate(
    "the receiving palm meets the foam ball surface",
    Math.abs(
      Vector3.length(
        Vector3.subtract(
          received,
          resolveAutoMovieHumanoidSurfaces.place(palm, hand).point,
        ),
      ) - gripRadius,
    ) <= 0.002,
  );
  /** Express the centre in the hand bone's own frame to compare carry samples. */
  const local: (
    frame: IAutoMovieResolvedBone,
    centre: IAutoMovieVector3,
  ) => IAutoMovieVector3 = (
    frame: IAutoMovieResolvedBone,
    centre: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    Quaternion.rotateVector(
      Quaternion.inverse(frame.worldRotation),
      Vector3.subtract(centre, frame.worldPosition),
    );
  const later: number = captured + 0.15; // The base catch's giving span.
  const carried: IAutoMovieVector3 = performance.prop(launch.prop, later).position;
  const carryingHand: IAutoMovieResolvedBone = performance
    .bones("catcher", later)
    .get(palm.bone)!;
  TestValidator.predicate(
    "the moving hand keeps the ball's captured rigid offset",
    Vector3.length(Vector3.subtract(carried, received)) > tolerance &&
      Vector3.length(
        Vector3.subtract(local(hand, received), local(carryingHand, carried)),
      ) <= tolerance,
  );

  const cut: HumanPerformance = take(true);
  const cutCatch: IAutoMovieMotionHumanSegment | undefined =
    cut.segments("catcher")[0];
  const cutFlight: IAutoMovieMotionHumanPropFlight.IFlight | undefined =
    cut.flights(launch.prop)[0];
  TestValidator.predicate(
    "a catch cut before interception leaves the foam ball in flight",
    cutCatch !== undefined &&
      cutCatch.end < intercept &&
      cutFlight !== undefined &&
      cutFlight.capturedAt === undefined &&
      cutFlight.supersededAt === undefined &&
      cut.hits().some(
        (hit: IAutoMovieInteractionEvent): boolean => hit.object === launch.prop,
      ),
  );
}
