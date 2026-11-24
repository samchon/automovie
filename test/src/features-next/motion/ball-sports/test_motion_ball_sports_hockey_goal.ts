import { createGoal, createPuck, createStick } from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBallPlay,
  IAutoMovieMotionHumanBody,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanThrowCatch,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * An ice hockey shot slides the same puck along the ice into the goal, and
 * a soft shot stops short of it.
 *
 * Scenarios:
 * 1. The side-on blade strikes the puck, which leaves along the ice, slows
 *    at its sliding friction and crosses the goal line wholly inside the
 *    mouth.
 * 2. The same stroke at half the speed stops on the ice before the line.
 *
 * IIHF rules: the goal opening is 1.83 m wide and 1.22 m high, and a goal
 * needs the whole puck over the line, so the gate lies one puck radius
 * beyond the line. The puck's ice friction is the archetype's, about 0.05:
 * at 0.49 m/s^2 a 3 m/s puck slides about 9 m and a 1.5 m/s puck about
 * 2.3 m, either side of the goal line 5.25 m out.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the shot, the soft shot, the IIHF goal and the sliding arithmetic.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the iceHockey stickBall stroke through HumanPerformance and reads the puck's play and its goal-line crossing.
 * @evidence contracts/development/testing.md#independent-expectations The goal is the IIHF's; the reach of each shot follows from v^2 / (2 mu g).
 * @evidence contracts/development/testing.md#distinguishing-cases The same stroke scores at 3 m/s and stops short at 1.5 m/s.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory performances of one polygon man, one stick, one puck and one goal.
 */
export function test_motion_ball_sports_hockey_goal(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const puck: ReturnType<typeof createPuck> = createPuck();
  const stick: ReturnType<typeof createStick> = createStick({
    kind: "iceHockey",
  });
  const goal: ReturnType<typeof createGoal> = createGoal({
    kind: "iceHockeyGoal",
  });
  const radius: number = puck.affordance("grip").aperture! / 2;
  const centre: IAutoMovieVector3 = puck.affordance("grip").frame.translation;

  // The established side-on crouch: the puck ahead, the blade beside it.
  const puckAt: IAutoMovieVector3 = { x: 0, y: 0, z: 0.75 };
  const stickFrame: IAutoMovieRigidTransform = {
    position: { x: -0.16, y: 0, z: 0.51 },
    rotation: Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, -35),
  };
  const line: number = puckAt.z + 5.25;
  const shoot = (speed: number): HumanPerformance =>
    new HumanPerformance({
      seed: `hockey-shot-${speed}`,
      performers: [
        {
          subject: "player",
          body,
          at: { x: 0.3, y: 0, z: 0.18 },
          yaw: -90,
          proficiency: { level: "trained" },
        },
      ],
      laws: [AutoMovieMotionHumanThrowCatch.stickBall],
      props: [
        HumanObject.prop("puck", puck, { at: puckAt, yaw: 0 }),
        HumanObject.prop("stick", stick, stickFrame),
        HumanObject.prop("goal", goal, {
          position: { x: 0, y: 0, z: line },
          rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 180),
        }),
      ],
      composition: HumanChain.subject("player")
        .crouch({ depth: "full", hold: 1 }, "low")
        .over((upper) =>
          upper
            .registered("stickBall", {
              kind: "iceHockey",
              stick: "stick",
              ball: "puck",
              speed,
              hand: "left",
              target: {
                kind: "point",
                frame: "world",
                at: { x: 0, y: 0.0125, z: 4 },
              },
            })
            .sync({ of: "low", event: "lowest" }),
        )
        // The film runs on while the puck slides.
        .stand({ hold: 3.5, sway: 0 }).node,
    });
  const mouth: IAutoMovieMotionHumanBallPlay.IRectangle = {
    kind: "rectangle",
    centre: { x: 0, y: 0.61, z: line + radius },
    normal: { x: 0, y: 0, z: 1 },
    up: { x: 0, y: 1, z: 0 },
    halfWidth: 1.83 / 2 - radius,
    halfHeight: 0.61,
  };
  const scored = (
    film: HumanPerformance,
  ): IAutoMovieMotionHumanBallPlay.ICrossing | undefined => {
    const shot: IAutoMovieMotionHumanBallPlay.Event | undefined = film
      .play("puck")
      .events.find(
        (event: IAutoMovieMotionHumanBallPlay.Event): boolean =>
          event.kind === "launch",
      );
    if (shot?.kind !== "launch")
      throw new Error("The blade never strikes the puck");
    return AutoMovieMotionHumanThrowCatch.HumanBallPlay.crossing(
      film,
      "puck",
      mouth,
      shot.seconds,
      film.duration,
      centre,
    );
  };

  const hard: HumanPerformance = shoot(3);
  TestValidator.predicate(
    "the shot slides along the ice and the whole puck crosses the goal line inside the mouth",
    scored(hard) !== undefined,
  );
  const soft: HumanPerformance = shoot(1.5);
  const rest: IAutoMovieVector3 = soft.prop("puck", soft.duration).position;
  TestValidator.predicate(
    "the soft shot stops on the ice short of the goal line",
    scored(soft) === undefined && rest.z < line && rest.y < 0.05,
  );

  // The takes pass the shipped verdicts a viewer would show.
  assertTakeClean("hockey goal", hard);
}
