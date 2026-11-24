import {
  createBall,
  createLacrosseCrosse,
  createWheelchair,
} from "@automovie/archetypes";
import { AutoMovieComposition, Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBallPlay,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanStand,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStance,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { ballPossessions } from "../../../features/internal/ballPossessions";
import { motionGraspedHandle } from "../../../features/internal/motionGraspedHandle";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** A law that stands holding the named props in the named hands from the start. */
const holding = (
  name: string,
  holds: readonly IHold[],
): IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStand.IParams> => ({
  ...AutoMovieMotionHumanStance.stand,
  name,
  plan: (
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStand.IParams>,
  ): IAutoMovieMotionHumanActionPlan => ({
    ...AutoMovieMotionHumanStance.stand.plan(context),
    holds: holds.map((hold: IHold) => ({ ...hold, from: 0 })),
  }),
});

/** One prop held from the start. */
interface IHold {
  /** The holding hand. */
  side: "left" | "right";

  /** The prop. */
  prop: string;
}

/**
 * Catches the campaign drafts from shipped laws: a lacrosse catch into the
 * crosse's pocket (#3896) and a catch by a player seated in a wheelchair
 * (#3898), each from a standing thrower's pass.
 *
 * Scenarios:
 * 1. #3896: the thrower passes; the receiver, holding the crosse, catches the
 *    ball into its pocket (`stageCatch` with the crosse as its glove).
 * 2. #3898: the thrower passes to a player sitting in a wheelchair, who
 *    catches with both hands from the seat.
 * 3. Each take's ball is launched once and held caught by the receiver, and
 *    passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each catch, the sub-issue it drafts and what each take asserts.
 * @evidence contracts/development/testing.md#behavioral-verification Runs throwObject, stageCatch and sit through HumanPerformance and reads the ball's possessions and the shipped verdicts.
 * @evidence contracts/development/testing.md#independent-expectations The possessions follow from the plays: the thrower's hold, its launch and the receiver's caught hold.
 * @evidence contracts/development/testing.md#distinguishing-cases A standing catch into an implement's pocket and a seated two-hand catch.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory performances of two polygon men, one ball and the crosse or the wheelchair.
 */
export function test_motion_throw_catch_campaign_catches(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const failed: string[] = [];

  // The thrower holds the ball in the right hand from the start.
  const ready: HumanPerformance = new HumanPerformance({
    seed: "catch-ready",
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
  const take = (
    label: string,
    kind: "lacrosse" | "basketball",
    receiver: IAutoMovieMotionHumanPerformance.IInput["performers"][number],
    props: readonly IAutoMovieMotionHumanProp[],
    catcher: ReturnType<typeof HumanChain.subject>,
    aim: IAutoMovieVector3,
    laws: NonNullable<IAutoMovieMotionHumanPerformance.IInput["laws"]>,
  ): void => {
    try {
      const ball: ReturnType<typeof createBall> = createBall({ kind });
      const centre: IAutoMovieVector3 =
        ball.affordance("grip").frame.translation;
      const thrower: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStand.IParams> =
        holding("catchFixtureThrower", [{ side: "right", prop: "ball" }]);
      const film: HumanPerformance = new HumanPerformance({
        seed: label,
        laws: [thrower, ...laws],
        performers: [
          {
            subject: "thrower",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
          receiver,
        ],
        props: [
          HumanObject.prop("ball", ball, {
            position: Vector3.subtract(hand, centre),
            rotation: Quaternion.identity(),
          }),
          ...props,
        ],
        composition: AutoMovieComposition.parallel(
          HumanChain.subject("thrower")
            .registered(thrower.name, { hold: 0.2, sway: 0 })
            .throwObject(
              {
                prop: "ball",
                target: { kind: "point", frame: "world", at: aim },
              },
              "throw",
            )
            .stand({ hold: 1.5, sway: 0 }).node,
          catcher.node,
        ),
      });
      const play: IAutoMovieMotionHumanBallPlay = film.play("ball");
      const caught: string[] = ballPossessions(play);
      TestValidator.predicate(
        `${label} launches once and is caught by the receiver: ${caught.join(", ")}`,
        caught.filter((p: string): boolean => p.startsWith("launch")).length ===
          1 && caught.at(-1) === `hold:${receiver.subject}:true`,
      );
      assertTakeClean(label, film);
    } catch (error: unknown) {
      failed.push(
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  // 1. #3896: a lacrosse catch into the pocket of the crosse worn on the
  // receiver's catching hand.
  const receiverAt: IAutoMovieVector3 = { x: 0, y: 0, z: 8 };
  const crosse: ReturnType<typeof createLacrosseCrosse> =
    createLacrosseCrosse();
  // A catching top hand closes high on the shaft, at the grip's end nearest
  // the head, so the pocket stands a short lever from the palm.
  const span: IAutoMovieAffordance = crosse.affordance("grip");
  const pocket: IAutoMovieVector3 =
    crosse.affordance("pocket").frame.translation;
  const along: IAutoMovieVector3 = Quaternion.rotateVector(
    span.frame.rotation,
    { x: 1, y: 0, z: 0 },
  );
  const top: IAutoMovieAffordance["frame"] = {
    ...span.frame,
    translation: Vector3.add(
      span.frame.translation,
      Vector3.scale(
        along,
        (Math.sign(
          Vector3.dot(along, Vector3.subtract(pocket, span.frame.translation)),
        ) *
          (span.length ?? 0)) /
          2,
      ),
    ),
  };
  take(
    "#3896 lacrosse pocket catch",
    "lacrosse",
    {
      subject: "receiver",
      body,
      at: receiverAt,
      yaw: 180,
      proficiency: { level: "trained" },
    },
    [
      {
        ...HumanObject.prop("crosse", crosse, {
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
        }),
        worn: {
          subject: "receiver",
          bone: "rightHand",
          // The crosse held at its top as a grasp holds a handle, the shaft
          // across the palm and the head out past the index finger
          // (`motionGraspedHandle`).
          offset: motionGraspedHandle(body, "right", top, pocket),
        },
      },
    ],
    HumanChain.subject("receiver")
      .stand({ hold: 0.2, sway: 0 })
      .registered("stageCatch", {
        partner: "throw",
        ball: "ball",
        hands: "one",
        hand: "right",
        glove: "crosse",
      })
      .sync({ of: "throw" }),
    // On the receiver's right (+X as they face -Z), the crosse's side.
    { x: 0.5, y: 1.8, z: receiverAt.z - 0.4 },
    [],
  );
  // 2. #3898: a two-hand catch by a player seated in a wheelchair.
  const chair: ReturnType<typeof createWheelchair> = createWheelchair();
  const chairAt: IAutoMovieVector3 = { x: 0, y: 0, z: 6 };
  const seat: IAutoMovieVector3 = Vector3.add(
    chairAt,
    Quaternion.rotateVector(
      Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 180),
      chair.affordance("seat").frame.translation,
    ),
  );
  take(
    "#3898 wheelchair catch",
    "basketball",
    {
      subject: "seated",
      body,
      at: { x: seat.x, y: 0, z: seat.z + 0.3 },
      yaw: 180,
      proficiency: { level: "trained" },
    },
    [
      HumanObject.prop("chair", chair, {
        position: chairAt,
        rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 180),
      }),
    ],
    // The catch is laid over the held sit, so the player catches seated.
    HumanChain.subject("seated")
      .sit({ seat: { at: seat, yaw: 180 }, hold: 3 })
      .over((upper) =>
        upper
          .registered("stageCatch", {
            partner: "throw",
            ball: "ball",
            hands: "two",
          })
          .sync({ of: "throw" }),
      ),
    { x: seat.x, y: seat.y + 0.75, z: seat.z - 0.45 },
    [],
  );

  TestValidator.predicate(
    `every catch is caught and passes the verdicts: ${failed.join(" || ")}`,
    failed.length === 0,
  );
}
