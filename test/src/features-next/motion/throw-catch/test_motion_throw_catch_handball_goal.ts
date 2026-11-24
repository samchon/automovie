import { createBall, createGoal } from "@automovie/archetypes";
import { AutoMovieComposition, Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
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

/** One staged keeper: where they stand and when their hands close. */
interface IKeeper {
  /** Floor position, world metres. */
  at: IAutoMovieVector3;

  /** Seconds after the throw at which the keeper's hands close. */
  intercept: number;
}

/**
 * A handball player picks the ball up beyond the 9 m line and throws it
 * into the goal, or into the hands of a keeper standing on its path, from
 * outside the goal area.
 *
 * Scenarios:
 * 1. The throw's ball crosses the goal line wholly inside the 3 m by 2 m
 *    mouth at its authored flight time.
 * 2. A keeper on the throw's path, 0.5 m off the line, catches the same
 *    ball; it never crosses the line.
 * 3. At release both of the thrower's soles are outside the goal area.
 *
 * IHF Rules of the Game, Rule 1: the goal is 3 m wide and 2 m high inside;
 * the goal area line is drawn 6 m from the goal line by quarter circles of
 * 6 m radius about each post's back inner corner joined by a 3 m line
 * parallel to the goal line. A goal needs the whole ball over the line
 * (Rule 9), so the gate lies one radius beyond the line and shrinks by the
 * radius. A drag-free aimed throw reaches its aim at its flight time; 1 ms
 * allows bisection and launch quantization.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three checks, the IHF geometry and the tolerances.
 * @evidence contracts/development/testing.md#behavioral-verification Runs pickUp, ballSport handballThrow and stageCatch through HumanPerformance and reads the ball's play, its goal-line crossing and the displayed sole sockets.
 * @evidence contracts/development/testing.md#independent-expectations Goal and area geometry are IHF's; crossing time is the authored flight time; the keeper's intercept is read from the throw's own flight.
 * @evidence contracts/development/testing.md#distinguishing-cases The same throw scores against an empty goal and is held by a keeper on its line.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory performances of two polygon men, one ball and one goal.
 */
export function test_motion_throw_catch_handball_goal(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const ball: ReturnType<typeof createBall> = createBall({ kind: "handball" });
  const goal: ReturnType<typeof createGoal> = createGoal({
    kind: "handballGoal",
  });
  const centre: IAutoMovieVector3 = ball.affordance("grip").frame.translation;
  const radius: number = ball.affordance("grip").aperture! / 2;
  const line: number = 10;
  const aim: IAutoMovieVector3 = { x: 0.9, y: 1.4, z: line };
  const flightSeconds: number = 0.6;

  const take = (keeper?: IKeeper): HumanPerformance => {
    const performers: IAutoMovieMotionHumanPerformance.IInput["performers"] = [
      {
        subject: "back",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ];
    const parts: IAutoMovieComposition[] = [
      HumanChain.subject("back")
        .pickUp({ prop: "ball", handle: "grip", lift: 0.15 })
        .ballSport(
          {
            kind: "handballThrow",
            prop: "ball",
            at: aim,
            flightSeconds,
          },
          "throw",
        )
        // The film runs on while the throw's result plays out.
        .stand({ hold: 2, sway: 0 }).node,
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
          .registered("stageCatch", {
            partner: "throw",
            ball: "ball",
            hands: "two",
            intercept: keeper.intercept,
          })
          .sync({ of: "throw" }).node,
      );
    }
    return new HumanPerformance({
      seed: keeper === undefined ? "handball-goal" : "handball-save",
      performers,
      props: [
        HumanObject.prop("ball", ball, { at: { x: 0, y: 0, z: 0.49 }, yaw: 0 }),
        HumanObject.prop("goal", goal, {
          position: { x: 0, y: 0, z: line },
          rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 180),
        }),
      ],
      composition: AutoMovieComposition.parallel(...parts),
    });
  };
  const mouth: IAutoMovieMotionHumanBallPlay.IRectangle = {
    kind: "rectangle",
    centre: { x: 0, y: 1, z: line + radius },
    normal: { x: 0, y: 0, z: 1 },
    up: { x: 0, y: 1, z: 0 },
    halfWidth: 1.5 - radius,
    halfHeight: 1 - radius,
  };
  const thrown = (
    film: HumanPerformance,
  ): IAutoMovieMotionHumanBallPlay.ILaunch => {
    const launch: IAutoMovieMotionHumanBallPlay.Event | undefined = film
      .play("ball")
      .events.find(
        (event: IAutoMovieMotionHumanBallPlay.Event): boolean =>
          event.kind === "launch",
      );
    if (launch?.kind !== "launch") throw new Error("The back never throws");
    return launch;
  };

  const open: HumanPerformance = take();
  const shot: IAutoMovieMotionHumanBallPlay.ILaunch = thrown(open);
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
    "the throw crosses the goal line wholly inside the mouth at its flight time",
    // A drag-free flight keeps its line-ward speed, so the gate one radius
    // beyond the aimed line point is reached r / v_z after the aim time.
    scored !== undefined &&
      nclose(
        scored.seconds,
        shot.seconds + flightSeconds + radius / shot.velocity.z,
        1e-3,
      ),
  );

  // The goal area: within 6 m of a post's inner corner, or of the 3 m line
  // between them, measured on the floor from the goal line.
  const inArea = (point: IAutoMovieVector3): boolean => {
    const depth: number = line - point.z;
    const across: number = Math.max(0, Math.abs(point.x) - 1.5);
    return depth >= 0 && Math.hypot(across, depth) < 6;
  };
  const outside: boolean = (["left", "right"] as const).every(
    (side: AutoMovieHumanSide): boolean =>
      HumanFoot.sockets(body, open.bones("back", shot.seconds), side).every(
        (site: ReturnType<typeof HumanFoot.sockets>[number]): boolean =>
          !inArea(site.point),
      ),
  );
  TestValidator.predicate(
    "both soles are outside the goal area at release",
    outside,
  );

  const keeperPlane: IAutoMovieMotionHumanBallPlay.IRectangle = {
    ...mouth,
    centre: { ...mouth.centre, z: line - 0.5 },
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
  if (reach === undefined)
    throw new Error("The throw never reaches the keeper");
  const saved: HumanPerformance = take({
    at: { x: reach.point.x, y: 0, z: reach.point.z + 0.46 },
    intercept: reach.seconds - shot.seconds,
  });
  const play: IAutoMovieMotionHumanBallPlay = saved.play("ball");
  TestValidator.equals(
    "the same ball goes from the back's hands into the keeper's",
    ballPossessions(play),
    ["hold:back:false", "launch:back", "hold:keeper:true"],
  );
  TestValidator.predicate(
    "the keeper's catch keeps the ball out of the goal",
    AutoMovieMotionHumanThrowCatch.HumanBallPlay.crossing(
      saved,
      "ball",
      mouth,
      shot.seconds,
      saved.duration,
      centre,
    ) === undefined,
  );

  // The takes pass the shipped verdicts a viewer would show.
  assertTakeClean("handball goal", open);
  assertTakeClean("handball save", saved);
}
