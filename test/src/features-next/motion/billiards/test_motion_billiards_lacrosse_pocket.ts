import { createBall, createStick } from "@automovie/archetypes";
import { Quaternion, Transform } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanStand,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStance,
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
 * A ball staged in a crosse pocket moves with the displayed pocket and
 * leaves from that moving prop when the pass reaches its decisive cue.
 *
 * Scenarios:
 * 1. Sample the named ball and displayed socket before release.
 * 2. Seek across the release boundary and confirm the same ball continues freely.
 * 3. A prior action's socket mount can supply the same custody, while a free ball at the identical point is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the mounted start, custody crossing and flight samples.
 * @evidence contracts/development/testing.md#behavioral-verification Observes the ball in a real crosse, its launch time and its displayed path after release.
 * @evidence contracts/development/testing.md#independent-expectations Composes the displayed stick with the archetype socket and compares that independently placed origin to the ball's frame. Compares distance after release with a conservative fraction of authored velocity.
 * @evidence contracts/development/testing.md#distinguishing-cases Tests carried, boundary and freely flying states. The mounted object will visibly lag or remain attached if the release contract fails.
 * @evidence contracts/development/testing.md#execution-ownership Builds a performance from a canonical body, real sport props and the public action row.
 */
export function test_motion_billiards_lacrosse_pocket(): void {
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const body = motionHumanBody("m-average");
  const crosse: ReturnType<typeof createStick> = createStick({
    kind: "lacrosse",
  });
  const initial: IAutoMovieRigidTransform = {
    position: { x: -0.13, y: 1.47, z: 0.3 },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, -148),
  };
  const free: IAutoMovieMotionHumanProp = HumanObject.prop(
    "ball",
    createBall({ kind: "lacrosse" }),
    {
      at: crosse.placed(
        "pocket",
        Transform.of(initial.position, initial.rotation),
      ).translation,
      yaw: 0,
    },
  );
  const seat: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStand.IParams> =
    {
      ...AutoMovieMotionHumanStance.stand,
      name: "seatCrosseBall",
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStand.IParams>,
      ): IAutoMovieMotionHumanActionPlan => ({
        ...AutoMovieMotionHumanStance.stand.plan(context),
        mounts: [{ prop: "ball", onto: "crosse", point: "pocket", from: 0.5 }],
      }),
    };
  const play = (placement: "initial" | "action" | "free"): HumanPerformance => {
    const player: ReturnType<typeof HumanChain.subject> =
      HumanChain.subject("player");
    return new HumanPerformance({
      seed: "exercise-crosse-pass",
      laws: [seat, AutoMovieMotionHumanThrowCatch.stickBall],
      performers: [
        {
          subject: "player",
          body,
          at: origin,
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      props: [
        HumanObject.prop("crosse", crosse, initial),
        placement === "initial"
          ? {
              ...free,
              mounted: {
                prop: "crosse",
                point: "pocket",
                offset: { position: origin, rotation: Quaternion.identity() },
              },
            }
          : free,
      ],
      composition: (placement === "action"
        ? player.registered("seatCrosseBall", { hold: 0.4 })
        : player
      ).registered("stickBall", {
        kind: "lacrossePass",
        stick: "crosse",
        ball: "ball",
        speed: 5,
        target: { kind: "point", frame: "world", at: { x: 0, y: 1.55, z: 6 } },
      }).node,
    });
  };
  const performance: HumanPerformance = play("initial");

  const segment: IAutoMovieMotionHumanSegment =
    performance.segments("player")[0]!;
  const stroke: number =
    segment.start +
    segment.plan.events.find((event) => event.name === "stroke")!.share *
      segment.plan.duration;
  const before: number = stroke - 1e-5;
  const tool: IAutoMovieRigidTransform = performance.prop("crosse", before);
  const pocket: IAutoMovieVector3 = crosse.placed(
    "pocket",
    Transform.of(tool.position, tool.rotation),
  ).translation;
  const seated: IAutoMovieVector3 = performance.prop("ball", before).position;
  const launched: IAutoMovieVector3 = performance.prop(
    "ball",
    stroke + 1e-5,
  ).position;
  TestValidator.predicate(
    "mount follows the displayed pocket up to the pass",
    vclose(pocket, seated, 1e-6),
  );
  TestValidator.predicate(
    "the point is continuous through release",
    vclose(seated, launched, 0.0002),
  );
  const flights = performance.flights("ball");
  TestValidator.equals(
    "the same mounted ball has one flight",
    flights.length,
    1,
  );
  TestValidator.predicate(
    "flight takes over at the stroke cue",
    nclose(flights[0]!.launch, stroke, 1e-6),
  );
  TestValidator.predicate(
    "the released ball moves independently along the pass lane",
    performance.prop("ball", stroke + 0.04).position.z > seated.z + 0.1,
  );
  TestValidator.predicate(
    "an action-authored mount also releases from the crosse",
    play("action").flights("ball").length === 1,
  );
  let refusal: unknown;
  try {
    play("free").flights("ball");
  } catch (error: unknown) {
    refusal = error;
  }
  TestValidator.predicate(
    "spatial coincidence cannot replace pocket custody",
    refusal instanceof HumanRefusal &&
      refusal.kind === "affordance" &&
      refusal.axis === "ball",
  );
}
