import { createBall } from "@automovie/archetypes";
import { AutoMovieComposition, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieComposition,
  IAutoMovieMotionHumanBallPlay,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
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

/** The receivers a take stages, in play order; absent ones stay out. */
interface IStations {
  /** The lineout jumper on the throw. */
  jumper?: IBallStation;

  /** The scrum-half on the jumper's pass. */
  half?: IBallStation;

  /** The fly-half on the scrum-half's pass. */
  fly?: IBallStation;
}

/**
 * A rugby lineout: the hooker throws in along the line of touch, the
 * jumper catches between the 5 m and 15 m lines and passes back to the
 * scrum-half, who passes on to the fly-half in open play.
 *
 * Scenarios:
 * 1. The throw travels along the line of touch, square to the touchline,
 *    and the jumper takes it standing between the 5 m and 15 m lines.
 * 2. The jumper's and the scrum-half's passes each travel backward toward
 *    their own goal line at release, and each receiver catches the same
 *    ball.
 * 3. The play reads hooker, jumper, scrum-half and fly-half possessions
 *    with three launches between them.
 * 4. The fly-half breaks upfield with the ball past a defender standing
 *    off the line, keeping the hips 0.35 m apart, two hip half-widths of
 *    the standard body: an avoided contact.
 *
 * World Rugby Laws: the lineout forms between the 5 m and 15 m lines and
 * the throw goes straight along the line of touch (Law 18); a pass must
 * not travel forward, toward the opposition's dead-ball line (Law 11).
 * The touchline here is x = 0 with the field at +x and the attack toward
 * +z. A straight throw is held to 1 m of drift along z over 7 m.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the set piece, the Laws' positions and directions, the frame and the straightness bound.
 * @evidence contracts/development/testing.md#behavioral-verification Runs pickUp, ballSport throwIn, stageCatch and rugbyPass through HumanPerformance and reads the ball's play log and launch velocities.
 * @evidence contracts/development/testing.md#independent-expectations Role positions and pass directions are the Laws'; each catch station is read from the flight it receives.
 * @evidence contracts/development/testing.md#distinguishing-cases A forward release would fail the backward-pass check; a jumper outside the lineout would fail the role-position check.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory performances of up to four polygon men and one ball.
 */
export function test_motion_ball_sports_rugby_play(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const ball: ReturnType<typeof createBall> = createBall({ kind: "rugby" });
  const centre: IAutoMovieVector3 = ball.affordance("grip").frame.translation;
  const throwTo: IAutoMovieVector3 = { x: 7, y: 1.8, z: 0 };
  const halfTo: IAutoMovieVector3 = { x: 8, y: 1, z: -3.5 };
  const flyTo: IAutoMovieVector3 = { x: 13, y: 1, z: -6 };
  const breakTo: IAutoMovieVector3 = { x: 13.5, y: 0, z: 0 };
  const defenderAt: IAutoMovieVector3 = { x: 12, y: 0, z: -2.5 };

  const take = (seed: string, stations: IStations): HumanPerformance => {
    const performers: IAutoMovieMotionHumanPerformance.IInput["performers"] = [
      {
        subject: "hooker",
        body,
        at: { x: -0.4, y: 0, z: 0 },
        yaw: 90,
        proficiency: { level: "trained" },
      },
    ];
    const parts: IAutoMovieComposition[] = [
      HumanChain.subject("hooker")
        .pickUp({ prop: "ball", handle: "grip" })
        .ballSport(
          { kind: "throwIn", prop: "ball", at: throwTo, flightSeconds: 0.9 },
          "lineout",
        )
        // The film runs on while the throw travels.
        .stand({ hold: 2, sway: 0 }).node,
    ];
    const receive = (
      subject: string,
      station: IBallStation | undefined,
      from: string,
      next: IAutoMovieVector3 | undefined,
      anchor: string,
    ): void => {
      if (station === undefined) return;
      performers.push({
        subject,
        body,
        at: station.at,
        yaw: station.yaw,
        proficiency: { level: "trained" },
      });
      const caught: IAutoMovieMotionHumanChain = HumanChain.subject(subject)
        .registered("stageCatch", {
          partner: from,
          ball: "ball",
          hands: "two",
          intercept: station.intercept,
        })
        .sync({ of: from });
      parts.push(
        (next === undefined
          ? caught.run({ to: breakTo, pace: "run" })
          : caught
              .registered(
                "rugbyPass",
                {
                  prop: "ball",
                  target: { kind: "point", frame: "world", at: next },
                },
                anchor,
              )
              // The film runs on while the pass travels.
              .stand({ hold: 2, sway: 0 })
        ).node,
      );
    };
    receive("jumper", stations.jumper, "lineout", halfTo, "jumperPass");
    receive("half", stations.half, "jumperPass", flyTo, "halfPass");
    receive("fly", stations.fly, "halfPass", undefined, "flyHold");

    // The fly-half's break runs past a defender standing off its line.
    if (stations.fly !== undefined) {
      performers.push({
        subject: "defender",
        body,
        at: defenderAt,
        yaw: 180,
        proficiency: { level: "trained" },
      });
      parts.push(
        HumanChain.subject("defender").stand({ hold: 6, sway: 0 }).node,
      );
    }
    return new HumanPerformance({
      seed,
      laws: [
        AutoMovieMotionHumanThrowCatch.HumanSportThrow.rugbyPass,
      ],
      performers,
      props: [
        HumanObject.prop("ball", ball, {
          at: { x: 0.1, y: 0.9, z: 0.25 },
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

  const thrown: HumanPerformance = take("lineout-throw", {});
  const jumper: IBallStation = ballStation(
    thrown,
    "ball",
    launchOf(thrown, "hooker"),
    throwTo,
    centre,
  );
  const fed: HumanPerformance = take("lineout-jumper", { jumper });
  const half: IBallStation = ballStation(
    fed,
    "ball",
    launchOf(fed, "jumper"),
    halfTo,
    centre,
  );
  const spun: HumanPerformance = take("lineout-half", { jumper, half });
  const fly: IBallStation = ballStation(
    spun,
    "ball",
    launchOf(spun, "half"),
    flyTo,
    centre,
  );
  const film: HumanPerformance = take("lineout-open-play", {
    jumper,
    half,
    fly,
  });

  const lineout: IAutoMovieMotionHumanBallPlay.ILaunch = launchOf(
    film,
    "hooker",
  );
  TestValidator.predicate(
    "the throw is straight along the line of touch and the jumper stands inside the lineout",
    Math.abs(jumper.crossing.point.z - lineout.point.z) <= 1 &&
      jumper.at.x >= 5 &&
      jumper.at.x <= 15,
  );
  TestValidator.predicate(
    "every pass leaves backward toward the passer's own goal line",
    ["jumper", "half"].every(
      (subject: string): boolean => launchOf(film, subject).velocity.z < 0,
    ),
  );
  TestValidator.equals(
    "one ball goes from the hooker through the jumper and scrum-half to the fly-half",
    ballPossessions(film.play("ball")),
    [
      "hold:hooker:false",
      "launch:hooker",
      "hold:jumper:true",
      "launch:jumper",
      "hold:half:true",
      "launch:half",
      "hold:fly:true",
    ],
  );
  const carrier: IAutoMovieMotionHumanBallPlay.Event | undefined = film
    .play("ball")
    .events.at(-1);
  TestValidator.predicate(
    "the fly-half carries the ball on the break past the defender without contact",
    carrier?.kind === "hold" &&
      carrier.subject === "fly" &&
      carrier.to >= film.duration - 1e-6 &&
      [0.5, 0.6, 0.7, 0.8, 0.9, 1].every(
        (share: number): boolean =>
          Vector3.distance(
            film.bones("fly", share * film.duration).get("hips")!.worldPosition,
            film.bones("defender", share * film.duration).get("hips")!
              .worldPosition,
          ) >= 0.35,
      ),
  );

  // The takes pass the shipped verdicts a viewer would show.
  assertTakeClean("lineout into open play", film);
}
