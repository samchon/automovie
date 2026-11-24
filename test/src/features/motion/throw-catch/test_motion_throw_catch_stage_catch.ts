import {
  AutoMovieComposition,
  Quaternion,
  Transform,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  IAutoMovieComposition,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieInteractionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
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
  AutoMovieMotionHumanStance,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  HumanVerdicts,
  compileHumanPerformanceContinuation,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../internal/motionHumanBody";
import { throwsError } from "../../internal/throwsError";

/**
 * A centered foam ball moves from its staged launch to the catcher and is then
 * carried on the catcher's right hand without a position jump. The catch owns
 * only its tagged flight, so there is no later floor impact.
 *
 * Scenarios:
 *
 * 1. The complete catch takes custody and carries the foam ball.
 * 2. A catch cut at preparation stops before custody.
 * 3. A relaunch placed after the catch replaces its tagged flight before closure.
 * 4. A branch saved during flight preserves the capture and replaces a later
 *    stand.
 * 5. A suffix cannot use an anchor offset or an opaque callback.
 *
 * The catch plane is the catch contract's documented 0.6 arm lengths ahead of
 * the performer's entry pelvis. The emitter sends the ball to that plane in 0.6
 * s and authors vertical speed so it returns to its release height there.
 * Trajectory and boundary parity use the campaign's 1 쨉m position bound. The
 * palm meets the ball's radius within the campaign's 2 mm held-prop alignment
 * bound.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the opt-in capture, ballistic interception, spatial handoff, and geometric tolerances.
 * @evidence contracts/development/testing.md#behavioral-verification Registers the staged catch and release through public performance inputs, then reads the flight, contacts, ball frames and palm. A floating grip, lost capture, position jump or subsequent ghost impact fails.
 * @evidence contracts/development/testing.md#independent-expectations Computes intercept time from release time and forward travel, and height from constant gravity. The palm's distance comes from the authored radius and the carry invariant comes from rigid hand motion.
 * @evidence contracts/development/testing.md#distinguishing-cases Samples the end of the ballistic path, the first held position and later carried position. A no-contact flight cut by a tagged grip is distinct from the unended flights in the separate horizon spec. A subsequently placed launch checks final custody independently of the provisional law check.
 * @evidence contracts/development/testing.md#execution-ownership Creates three in-memory performances with one prepared body, a release and a single-hand catch, and a later-placed relaunch for the refusal case. Reads boundary and carrying samples and uses one frame interval for the body portion of the film-wide flight verdict.
 */
export function test_motion_throw_catch_stage_catch(): void {
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
  const initialRoot: IAutoMovieVector3 =
    AutoMovieMotionHumanStance.stand.posture(body, still, 180).root;
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
      ...AutoMovieMotionHumanStance.stand,
      name: "releaseFoamBall",
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStand.IParams>,
      ): IAutoMovieMotionHumanThrowObject.IPlan => {
        const published: IAutoMovieMotionPropLaunch =
          context.subject === "redirector"
            ? { ...launch, seconds: launch.seconds + flightTime / 2 }
            : launch;
        return {
          ...AutoMovieMotionHumanStance.stand.plan(context),
          launch: {
            point: published.point,
            target: expected,
            seconds: published.seconds,
            velocity: published.velocity,
          },
          launches: [published],
        };
      },
    };
  /**
   * Compose the release and catch, optionally placing a second launch
   * afterward.
   */
  const input = (
    cut: boolean,
    redirect: boolean = false,
  ): IAutoMovieMotionHumanPerformance.IInput => {
    const catcher: IAutoMovieMotionHumanChain = HumanChain.subject(
      "catcher",
    ).registered("stageCatch", {
      partner: "foam-release",
      ball: launch.prop,
      hands: "one",
    });
    return {
      seed: "staged-foam-catch",
      laws: [release],
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
          at: {
            x: -initialRoot.x,
            y: 0,
            z: expected.z + heldPoint - initialRoot.z,
          },
          yaw: 180,
          proficiency: { level: "trained" },
        },
        ...(redirect
          ? [
              {
                subject: "redirector",
                body,
                at: { x: -4, y: 0, z: 0 },
                yaw: 0,
                proficiency: { level: "trained" as const },
              },
            ]
          : []),
      ],
      composition: AutoMovieComposition.parallel(
        HumanChain.subject("emitter").registered(
          "releaseFoamBall",
          { hold: 2 },
          "foam-release",
        ).node,
        (cut ? catcher.until({ event: "prepare" }) : catcher).node,
        ...(redirect
          ? [
              HumanChain.subject("redirector").registered("releaseFoamBall", {
                hold: 2,
              }).node,
            ]
          : []),
      ),
    };
  };
  /** Resolve one independent test take. */
  const take = (cut: boolean, redirect: boolean = false): HumanPerformance =>
    new HumanPerformance(input(cut, redirect));
  const performance: HumanPerformance = take(false);
  const tolerance: number = 1e-6;
  const flight: IAutoMovieMotionHumanPropFlight.IFlight = performance.flights(
    launch.prop,
  )[0]!;
  const captured: number = flight.capturedAt ?? Infinity;
  // Flight verdicts use the whole film. Body findings are outside this spec.
  const framesPerSecond: number = 24;
  const unended: string[] | undefined = HumanVerdicts(
    performance,
    framesPerSecond,
    {
      from: performance.duration - 1 / framesPerSecond,
      to: performance.duration,
    },
  ).unended;
  TestValidator.predicate(
    "the anchored launch is captured at the independent intercept",
    Math.abs(captured - intercept) <= tolerance &&
      flight.contact === undefined &&
      performance
        .hits()
        .every(
          (hit: IAutoMovieInteractionEvent): boolean =>
            hit.object !== launch.prop,
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

  const palm: IAutoMovieHumanoidSurfaces.IFrame =
    body.surfaces.regions.palmRight;
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
  const carried: IAutoMovieVector3 = performance.prop(
    launch.prop,
    later,
  ).position;
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

  const source: IAutoMovieMotionHumanPerformance.IInput = input(false);
  source.composition = AutoMovieComposition.sequence(
    source.composition,
    HumanChain.subject("catcher").stand({ hold: 2, sway: 0 }),
  );
  const saved: number = launch.seconds + flightTime / 2;
  const variant: IAutoMovieComposition = HumanChain.subject("catcher").stand({
    hold: 2,
    sway: 0.04,
  }).node;
  const {
    source: original,
    branch,
    branchStart,
  } = compileHumanPerformanceContinuation(source, saved, 1, variant);
  const branchFlight: IAutoMovieMotionHumanPropFlight.IFlight = branch.flights(
    launch.prop,
  )[0]!;
  const variantSecond: number = branchStart + 1;
  TestValidator.predicate(
    "the saved flight and its later capture reach the same hand before a distinct replacement",
    branchStart === 2 &&
      branchStart < original.duration &&
      original.segments("catcher").at(-1)?.params !==
        branch.segments("catcher").at(-1)?.params &&
      Math.abs((branchFlight.capturedAt ?? Infinity) - intercept) <=
        tolerance &&
      [saved, later, branchStart].every(
        (at: number): boolean =>
          Vector3.length(
            Vector3.subtract(
              original.prop(launch.prop, at).position,
              branch.prop(launch.prop, at).position,
            ),
          ) <= tolerance &&
          Vector3.length(
            Vector3.subtract(
              original.bones("catcher", at).get(palm.bone)!.worldPosition,
              branch.bones("catcher", at).get(palm.bone)!.worldPosition,
            ),
          ) <= tolerance,
      ) &&
      Vector3.length(
        Vector3.subtract(
          original.bones("catcher", variantSecond).get(palm.bone)!
            .worldPosition,
          branch.bones("catcher", variantSecond).get(palm.bone)!.worldPosition,
        ),
      ) > tolerance,
  );

  TestValidator.predicate(
    "a suffix cannot schedule backward or supply an opaque callback",
    throwsError(
      (): unknown =>
        compileHumanPerformanceContinuation(source, saved, 1, {
          kind: "at",
          anchor: "foam-release",
          offset: -0.1,
          part: variant,
        }),
      "cannot use anchor-relative placement",
    ) &&
      throwsError(
        (): unknown =>
          compileHumanPerformanceContinuation(source, saved, 1, {
            kind: "intent",
            intent: {
              subject: "catcher",
              capability: "stand",
              parameters: { sway: (): number => 0.04 },
            },
          }),
        "requires portable action data",
      ),
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
      cut
        .hits()
        .some(
          (hit: IAutoMovieInteractionEvent): boolean =>
            hit.object === launch.prop,
        ),
  );

  let redirected: unknown;
  try {
    take(false, true).flights(launch.prop);
  } catch (error) {
    redirected = error;
  }
  TestValidator.predicate(
    "a relaunch placed after planning invalidates the staged capture",
    redirected instanceof HumanRefusal &&
      redirected.axis === "ball" &&
      redirected.reason.startsWith(
        "the final flight misses the staged interception",
      ),
  );
}
