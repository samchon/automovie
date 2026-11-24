import { createBall, createGoal } from "@automovie/archetypes";
import { AutoMovieComposition, Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieComposition,
  IAutoMovieMotionHumanBallPlay,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanThrowCatch,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { ballPossessions } from "../../../features/internal/ballPossessions";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";

/** One staged keeper: where they stand and when they take the shot. */
interface IKeeper {
  /** Floor position, world metres. */
  at: IAutoMovieVector3;

  /** Seconds after the kick at which the keeper's hands meet the ball. */
  intercept: number;

  /** Whether the keeper's hands catch the ball or parry it back out. */
  save: KeeperSave;
}

/** How a keeper stops the shot: held in the hands, or parried back by the ball's own rebound. */
type KeeperSave = "stageCatch" | "stageDeflect";

/**
 * A penalty kick sends one football from the spot through the goal mouth,
 * and the same kick taken by a keeper standing on its path is caught.
 *
 * Scenarios:
 * 1. The striker kicks from the spot; the support foot stays planted at
 *    contact and the ball crosses the goal line wholly inside the mouth.
 * 2. A keeper placed on the shot's flight, 0.6 m off the line, catches the
 *    same ball at the instant its path reaches the keeper's plane; the
 *    ball never crosses the line.
 * 3. The same keeper parries it instead, sending it back out by the ball's
 *    FIFA rebound, and it never crosses the line.
 *
 * IFAB Laws of the Game: the penalty mark is 11 m from the goal line (Law
 * 1) and the goal is 7.32 m between the posts with the crossbar's lower
 * edge 2.44 m up; a goal needs the whole ball over the line between the
 * posts and under the bar (Law 10). The gate is therefore set one ball
 * radius beyond the line and shrunk by the radius on each side. The 5 mm
 * plant bound is the kick fixture's support tolerance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two plays, the Laws' geometry and the bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Runs kickRight, stageCatch and stageDeflect through HumanPerformance and reads the ball's play, its goal-line crossing and the displayed support foot.
 * @evidence contracts/development/testing.md#independent-expectations Goal and spot distances are the Laws'; the keeper's intercept is read from the shot's own flight.
 * @evidence contracts/development/testing.md#distinguishing-cases The same kick scores against an empty goal, is held by a keeper on its line, and is parried back by the same keeper.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory performances of two polygon men, one ball and one goal.
 */
export function test_motion_throw_catch_football_goal(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const ball: ReturnType<typeof createBall> = createBall({ kind: "football" });
  const centre: IAutoMovieVector3 = ball.affordance("grip").frame.translation;
  const radius: number = ball.affordance("grip").aperture! / 2;

  // The ball rests 0.15 m beyond the right toe, as the kick fixture places it.
  const foot: IAutoMovieVector3 = body.rest.get("rightFoot")!;
  const toe: number = foot.z + HumanFoot.offset(body, "right", "toe").z;
  const spot: IAutoMovieVector3 = { x: foot.x, y: 0, z: toe + 0.15 + radius };
  const line: number = spot.z + 11;
  const goal: ReturnType<typeof createGoal> = createGoal({
    kind: "footballGoal",
  });

  const take = (keeper?: IKeeper): HumanPerformance => {
    const parts: IAutoMovieComposition[] = [
      HumanChain.subject("striker")
        .registered("kickRight", { ball: "ball", speed: 20, lift: 5 }, "shot")
        // The film runs on while the shot's result plays out.
        .stand({ hold: 2, sway: 0 }).node,
    ];
    const performers: IAutoMovieMotionHumanPerformance.IInput["performers"] = [
      {
        subject: "striker",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ];
    if (keeper !== undefined) {
      performers.push({
        subject: "keeper",
        body,
        at: keeper.at,
        yaw: 180,
        proficiency: { level: "trained" },
      });
      parts.push(
        HumanChain.subject("keeper")
          .registered(keeper.save, {
            partner: "shot",
            ball: "ball",
            hands: "two",
            intercept: keeper.intercept,
          })
          .sync({ of: "shot" }).node,
      );
    }
    return new HumanPerformance({
      seed: keeper === undefined ? "penalty-goal" : `penalty-${keeper.save}`,
      laws: [
        AutoMovieMotionHumanThrowCatch.HumanSportThrow.kickRight,
        AutoMovieMotionHumanThrowCatch.stageDeflect,
      ],
      performers,
      props: [
        HumanObject.prop("ball", ball, { at: spot, yaw: 0 }),
        HumanObject.prop("goal", goal, {
          position: { x: spot.x, y: 0, z: line },
          rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 180),
        }),
      ],
      composition: AutoMovieComposition.parallel(...parts),
    });
  };
  const mouth: IAutoMovieMotionHumanBallPlay.IRectangle = {
    kind: "rectangle",
    centre: { x: spot.x, y: 1.22, z: line + radius },
    normal: { x: 0, y: 0, z: 1 },
    up: { x: 0, y: 1, z: 0 },
    halfWidth: 3.66 - radius,
    halfHeight: 1.22 - radius,
  };
  const kicked = (
    film: HumanPerformance,
  ): IAutoMovieMotionHumanBallPlay.ILaunch => {
    const launch: IAutoMovieMotionHumanBallPlay.Event | undefined = film
      .play("ball")
      .events.find(
        (event: IAutoMovieMotionHumanBallPlay.Event): boolean =>
          event.kind === "launch",
      );
    if (launch?.kind !== "launch") throw new Error("The striker never kicks");
    return launch;
  };

  const open: HumanPerformance = take();
  const shot: IAutoMovieMotionHumanBallPlay.ILaunch = kicked(open);
  const plantBefore: IAutoMovieVector3 = open
    .bones("striker", shot.seconds - 0.05)
    .get("leftFoot")!.worldPosition;
  const plantAt: IAutoMovieVector3 = open
    .bones("striker", shot.seconds)
    .get("leftFoot")!.worldPosition;
  const scored: IAutoMovieMotionHumanBallPlay.ICrossing | undefined =
    AutoMovieMotionHumanThrowCatch.HumanBallPlay.crossing(
      open,
      "ball",
      mouth,
      shot.seconds,
      open.duration,
      centre,
    );
  TestValidator.predicate(
    "the support foot holds at contact and the whole ball crosses the line inside the mouth",
    Vector3.distance(plantBefore, plantAt) <= 0.005 && scored !== undefined,
  );

  // The keeper's plane is 0.6 m off the line; the keeper stands 0.46 m
  // behind the point the ball crosses it, as the staged-catch fixture does.
  const keeperPlane: IAutoMovieMotionHumanBallPlay.IRectangle = {
    ...mouth,
    centre: { ...mouth.centre, z: line - 0.6 },
    halfWidth: 10,
    halfHeight: 10,
  };
  const reach: IAutoMovieMotionHumanBallPlay.ICrossing | undefined =
    AutoMovieMotionHumanThrowCatch.HumanBallPlay.crossing(
      open,
      "ball",
      keeperPlane,
      shot.seconds,
      open.duration,
      centre,
    );
  if (reach === undefined) throw new Error("The shot never reaches the keeper");
  const saved: HumanPerformance = take({
    at: { x: reach.point.x, y: 0, z: reach.point.z + 0.46 },
    intercept: reach.seconds - shot.seconds,
    save: "stageCatch",
  });
  const play: IAutoMovieMotionHumanBallPlay = saved.play("ball");
  const held: IAutoMovieMotionHumanBallPlay.Event | undefined =
    play.events.find(
      (event: IAutoMovieMotionHumanBallPlay.Event): boolean =>
        event.kind === "hold" && event.subject === "keeper",
    );
  TestValidator.equals(
    "the same ball goes from the striker's kick into the keeper's hands",
    ballPossessions(play),
    ["launch:striker", "hold:keeper:true"],
  );
  TestValidator.predicate(
    "the keeper's hands close on the flight at its crossing and the ball never crosses the line",
    held?.kind === "hold" &&
      nclose(held.from, reach.seconds, 1e-3) &&
      AutoMovieMotionHumanThrowCatch.HumanBallPlay.crossing(
        saved,
        "ball",
        mouth,
        shot.seconds,
        saved.duration,
        centre,
      ) === undefined,
  );

  // 3. The same keeper parries instead: the hands send the ball back out by
  // its FIFA rebound, and it never crosses the line.
  const parried: HumanPerformance = take({
    at: { x: reach.point.x, y: 0, z: reach.point.z + 0.46 },
    intercept: reach.seconds - shot.seconds,
    save: "stageDeflect",
  });
  TestValidator.equals(
    "the keeper parries the same ball back out",
    ballPossessions(parried.play("ball")),
    ["launch:striker", "launch:keeper"],
  );
  TestValidator.predicate(
    "the parried ball never crosses the line",
    AutoMovieMotionHumanThrowCatch.HumanBallPlay.crossing(
      parried,
      "ball",
      mouth,
      shot.seconds,
      parried.duration,
      centre,
    ) === undefined,
  );

  // The takes pass the shipped verdicts a viewer would show.
  assertTakeClean("penalty goal", open);
  assertTakeClean("penalty catch", saved);
  assertTakeClean("penalty parry", parried);
}
