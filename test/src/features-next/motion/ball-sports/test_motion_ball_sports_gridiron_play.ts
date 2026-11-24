import { createBall } from "@automovie/archetypes";
import { AutoMovieComposition } from "@automovie/engine";
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
import { TestValidator } from "@nestia/e2e";

import type { IBallStation } from "../../../features/internal/IBallStation";
import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { ballPossessions } from "../../../features/internal/ballPossessions";
import { ballStation } from "../../../features/internal/ballStation";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** The quarterback and receiver stations a take stages; absent ones stay out of the play. */
interface IStations {
  /** The quarterback's station on the snap. */
  quarterback?: IBallStation;

  /** The receiver's station on the pass. */
  receiver?: IBallStation;
}

/**
 * One American football is snapped, caught by the quarterback, passed and
 * caught by a receiver, or falls incomplete when no receiver is there.
 *
 * Scenarios:
 * 1. The center picks the ball up and snaps it back; the quarterback,
 *    placed on the snap's flight, catches it.
 * 2. The quarterback passes it downfield; a receiver on the pass's flight
 *    catches it. The play reads center, quarterback and receiver
 *    possessions with the two launches between them.
 * 3. With no receiver the same pass is incomplete: the ball's first
 *    contact after the pass is the ground and nobody holds it again.
 *
 * The shotgun quarterback stands about 5 yd (4.57 m) behind the center;
 * the pass lands about 12 m downfield and 6 m wide, a short out route.
 * Possession is credited only by the play's caught holds.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three plays, the formation distances and the credit rule.
 * @evidence contracts/development/testing.md#behavioral-verification Runs pickUp, gridironSnap, stageCatch and gridironPass through HumanPerformance and reads the ball's play log.
 * @evidence contracts/development/testing.md#independent-expectations Each catch station is read from the flight it receives; the custody order is the authored play.
 * @evidence contracts/development/testing.md#distinguishing-cases The same pass is completed with a receiver and incomplete without one.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory performances of up to three polygon men and one ball.
 */
export function test_motion_ball_sports_gridiron_play(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const ball: ReturnType<typeof createBall> = createBall({
    kind: "americanFootball",
  });
  const centre: IAutoMovieVector3 = ball.affordance("grip").frame.translation;
  const snapTo: IAutoMovieVector3 = { x: 0, y: 0.9, z: -4.57 };
  const passTo: IAutoMovieVector3 = { x: 6, y: 1.2, z: 12 };

  const take = (seed: string, stations: IStations): HumanPerformance => {
    const performers: IAutoMovieMotionHumanPerformance.IInput["performers"] = [
      {
        subject: "center",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ];
    const parts: IAutoMovieComposition[] = [
      HumanChain.subject("center")
        .pickUp({ prop: "ball", handle: "grip" })
        .registered(
          "gridironSnap",
          {
            prop: "ball",
            target: { kind: "point", frame: "world", at: snapTo },
          },
          "snap",
        ).node,
    ];
    if (stations.quarterback !== undefined) {
      performers.push({
        subject: "quarterback",
        body,
        at: stations.quarterback.at,
        yaw: stations.quarterback.yaw,
        proficiency: { level: "trained" },
      });
      parts.push(
        HumanChain.subject("quarterback")
          .registered("stageCatch", {
            partner: "snap",
            ball: "ball",
            hands: "two",
            intercept: stations.quarterback.intercept,
          })
          .sync({ of: "snap" })
          .registered(
            "gridironPass",
            {
              prop: "ball",
              target: { kind: "point", frame: "world", at: passTo },
            },
            "pass",
          )
          // The film runs on while the pass's result plays out.
          .stand({ hold: 2.5, sway: 0 }).node,
      );
    }
    if (stations.receiver !== undefined) {
      performers.push({
        subject: "receiver",
        body,
        at: stations.receiver.at,
        yaw: stations.receiver.yaw,
        proficiency: { level: "trained" },
      });
      parts.push(
        HumanChain.subject("receiver")
          .registered("stageCatch", {
            partner: "pass",
            ball: "ball",
            hands: "two",
            intercept: stations.receiver.intercept,
          })
          .sync({ of: "pass" }).node,
      );
    }
    return new HumanPerformance({
      seed,
      laws: [
        AutoMovieMotionHumanThrowCatch.HumanSportThrow.gridironSnap,
        AutoMovieMotionHumanThrowCatch.HumanSportThrow.gridironPass,
      ],
      performers,
      props: [
        HumanObject.prop("ball", ball, {
          at: { x: -0.25, y: 0.9, z: 0.35 },
          yaw: 0,
        }),
      ],
      composition: AutoMovieComposition.parallel(...parts),
    });
  };
  const launchOf = (
    film: HumanPerformance,
    subject: string,
  ): IAutoMovieMotionHumanBallPlay.ILaunch => {
    const found: IAutoMovieMotionHumanBallPlay.Event | undefined = film
      .play("ball")
      .events.find(
        (event: IAutoMovieMotionHumanBallPlay.Event): boolean =>
          event.kind === "launch" && event.subject === subject,
      );
    if (found?.kind !== "launch") throw new Error(`${subject} never launches`);
    return found;
  };

  const snapped: HumanPerformance = take("gridiron-snap", {});
  const quarterback: IBallStation = ballStation(
    snapped,
    "ball",
    launchOf(snapped, "center"),
    snapTo,
    centre,
  );
  const incomplete: HumanPerformance = take("gridiron-incomplete", {
    quarterback,
  });
  const receiver: IBallStation = ballStation(
    incomplete,
    "ball",
    launchOf(incomplete, "quarterback"),
    passTo,
    centre,
  );
  const complete: HumanPerformance = take("gridiron-complete", {
    quarterback,
    receiver,
  });
  TestValidator.equals(
    "one ball goes from the center through the quarterback to the receiver",
    ballPossessions(complete.play("ball")),
    [
      "hold:center:false",
      "launch:center",
      "hold:quarterback:true",
      "launch:quarterback",
      "hold:receiver:true",
    ],
  );

  const pass: IAutoMovieMotionHumanBallPlay.ILaunch = launchOf(
    incomplete,
    "quarterback",
  );
  const after: IAutoMovieMotionHumanBallPlay.Event[] = incomplete
    .play("ball")
    .events.filter(
      (event: IAutoMovieMotionHumanBallPlay.Event): boolean =>
        (event.kind === "hold" ? event.from : event.seconds) > pass.seconds,
    );
  TestValidator.predicate(
    "with no receiver the pass falls incomplete to the ground and nobody holds it again",
    after[0]?.kind === "contact" &&
      after[0].struck.kind === "ground" &&
      after.every(
        (event: IAutoMovieMotionHumanBallPlay.Event): boolean =>
          event.kind !== "hold",
      ),
  );

  // The takes pass the shipped verdicts a viewer would show.
  assertTakeClean("completed pass", complete);
  assertTakeClean("incomplete pass", incomplete);
}
