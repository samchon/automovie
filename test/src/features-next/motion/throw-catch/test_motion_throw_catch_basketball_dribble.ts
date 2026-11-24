import { createBall, createBasketballHoop } from "@automovie/archetypes";
import { AutoMovieComposition, Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBallPlay,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanThrowCatch,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { ballPossessions } from "../../../features/internal/ballPossessions";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * A basketball player dribbles the same ball twice off the floor, gathers
 * it from each bounce and shoots it through the ring; a gather timed
 * before the bounce is refused.
 *
 * Scenarios:
 * 1. Each dribble pushes the ball down; it meets the floor once and is
 *    caught back in the dribbling hand as its rebound rises to 0.1 m below
 *    the release, the push sized so the rebound returns to the hand.
 * 2. The play reads hold, dribble, caught hold, dribble, caught hold and the
 *    shot, by the one player, and each dribble's only contact is the floor.
 * 3. The gathered ball goes through the ring.
 * 4. A catch placed before the ball reaches the floor is refused.
 *
 * The basketball rebounds at the FIBA drop reference's restitution and
 * slides as rubber on concrete, the archetype's data. The catch instant is
 * read from the rebound's own crossing of the release height.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the dribble cycle, its catch rule, the shot and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Runs dribbleRelease, stageCatch and setShot through HumanPerformance and reads the ball's play and its ring crossing.
 * @evidence contracts/development/testing.md#independent-expectations Each catch is placed from the actual rebound; the ring geometry is FIBA's.
 * @evidence contracts/development/testing.md#distinguishing-cases A catch on the rebound is admitted; one before the bounce is refused.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory performances of one polygon man, one ball and one hoop.
 */
export function test_motion_throw_catch_basketball_dribble(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const ball: ReturnType<typeof createBall> = createBall({
    kind: "basketball",
  });
  const hoop: ReturnType<typeof createBasketballHoop> = createBasketballHoop({
    ring: 0.45,
    thickness: 0.013,
  });
  const hoopAt: IAutoMovieVector3 = { x: 0, y: 0, z: -0.85 };
  const rim: IAutoMovieAffordance = hoop.affordance("rim");
  const inner: number = 0.45 / 2;
  const ring: IAutoMovieVector3 = Vector3.add(hoopAt, {
    ...rim.frame.translation,
    z: rim.frame.translation.z - inner - rim.aperture! / 2,
  });
  const centre: IAutoMovieVector3 = ball.affordance("grip").frame.translation;
  const radius: number = ball.affordance("grip").aperture! / 2;
  const at: IAutoMovieVector3 = { x: 0, y: 0, z: 4 };

  // Build the chain dribble by dribble: each take's rebound times its catch.
  const take = (
    catches: readonly number[],
    shoot: boolean,
  ): HumanPerformance => {
    // A feeder's chest pass puts the ball in the guard's hands, as the
    // possession fixture does.
    const feed: IAutoMovieMotionHumanChain = HumanChain.subject("feeder")
      .pickUp({ prop: "ball", handle: "grip", lift: 0.15 })
      .ballSport(
        {
          kind: "chestPass",
          prop: "ball",
          at: { x: 0, y: 1.3, z: 3.45 },
          flightSeconds: 0.42,
        },
        "feed",
      );
    let chain: IAutoMovieMotionHumanChain = HumanChain.subject("guard")
      .registered("stageCatch", {
        partner: "feed",
        ball: "ball",
        hands: "two",
        intercept: 0.42,
      })
      .sync({ of: "feed" });
    for (let index: number = 0; index <= catches.length && index < 2; ++index) {
      chain = chain.ballSport(
        { kind: "dribbleRelease", hand: "right", prop: "ball" },
        `dribble${index}`,
      );
      if (index < catches.length)
        chain = chain
          .registered("stageCatch", {
            partner: `dribble${index}`,
            ball: "ball",
            hands: "one",
            hand: "right",
            intercept: catches[index]!,
          })
          .sync({ of: `dribble${index}` });
    }
    if (shoot)
      chain = chain
        .ballSport(
          { kind: "setShot", prop: "ball", at: ring, flightSeconds: 1.12 },
          "shot",
        )
        // The film runs on while the shot flies to the ring.
        .stand({ hold: 1.2, sway: 0 });
    return new HumanPerformance({
      seed: `basketball-dribble-${catches.length}-${shoot}`,
      performers: [
        {
          subject: "feeder",
          body,
          at: { x: 0, y: 0, z: 1.2 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        {
          subject: "guard",
          body,
          at,
          yaw: 180,
          proficiency: { level: "trained" },
        },
      ],
      props: [
        HumanObject.prop("ball", ball, {
          position: { x: 0, y: 0, z: 1.69 },
          rotation: Quaternion.identity(),
        }),
        HumanObject.prop("hoop", hoop, {
          position: hoopAt,
          rotation: Quaternion.identity(),
        }),
      ],
      composition: AutoMovieComposition.parallel(
        feed.node,
        chain.stand({ hold: 2, sway: 0 }).node,
      ),
    });
  };
  const rise = (film: HumanPerformance, index: number): number => {
    const play: IAutoMovieMotionHumanBallPlay = film.play("ball");
    const launch: IAutoMovieMotionHumanBallPlay.ILaunch = play.events.filter(
      (
        event: IAutoMovieMotionHumanBallPlay.Event,
      ): event is IAutoMovieMotionHumanBallPlay.ILaunch =>
        event.kind === "launch",
    )[index + 1]!;
    const bounce: IAutoMovieMotionHumanBallPlay.Event | undefined =
      play.events.find(
        (event: IAutoMovieMotionHumanBallPlay.Event): boolean =>
          event.kind === "contact" && event.seconds > launch.seconds,
      );
    if (bounce?.kind !== "contact")
      throw new Error(`dribble ${index} never bounces`);
    const up: IAutoMovieMotionHumanBallPlay.ICrossing | undefined =
      AutoMovieMotionHumanThrowCatch.HumanBallPlay.crossing(
        film,
        "ball",
        {
          kind: "rectangle",
          centre: { ...launch.point, y: launch.point.y - 0.1 },
          normal: { x: 0, y: 1, z: 0 },
          up: { x: 0, y: 0, z: 1 },
          halfWidth: 1,
          halfHeight: 1,
        },
        bounce.seconds,
        film.duration,
        centre,
      );
    if (up === undefined)
      throw new Error(`dribble ${index} never rises back to the hand`);
    return up.seconds - launch.seconds;
  };

  const first: number = rise(take([], false), 0);
  const second: number = rise(take([first], false), 1);
  const film: HumanPerformance = take([first, second], true);
  const play: IAutoMovieMotionHumanBallPlay = film.play("ball");
  TestValidator.equals(
    `the guard dribbles twice, gathering each bounce, then shoots: ${ballPossessions(play).join(", ")}`,
    ballPossessions(play),
    [
      "hold:feeder:false",
      "launch:feeder",
      "hold:guard:true",
      "launch:guard",
      "hold:guard:true",
      "launch:guard",
      "hold:guard:true",
      "launch:guard",
    ],
  );
  const launches: number[] = play.events
    .filter(
      (event: IAutoMovieMotionHumanBallPlay.Event): boolean =>
        event.kind === "launch",
    )
    .map((event: IAutoMovieMotionHumanBallPlay.Event): number =>
      event.kind === "launch" ? event.seconds : 0,
    );
  TestValidator.predicate(
    "each dribble's only contact before its gather is one floor bounce",
    [0, 1].every((index: number): boolean => {
      const contacts: IAutoMovieMotionHumanBallPlay.Event[] =
        play.events.filter(
          (event: IAutoMovieMotionHumanBallPlay.Event): boolean =>
            event.kind === "contact" &&
            event.seconds > launches[index + 1]! &&
            event.seconds < launches[index + 2]!,
        );
      return (
        contacts.length === 1 &&
        contacts[0]!.kind === "contact" &&
        contacts[0]!.struck.kind === "ground"
      );
    }),
  );
  TestValidator.predicate(
    "the gathered ball goes through the ring",
    AutoMovieMotionHumanThrowCatch.HumanBallPlay.crossing(
      film,
      "ball",
      {
        kind: "disc",
        centre: ring,
        normal: { x: 0, y: -1, z: 0 },
        radius: inner - radius,
      },
      launches[3]!,
      film.duration,
      centre,
    ) !== undefined,
  );

  let refusal: unknown;
  try {
    take([first / 4], false).play("ball");
  } catch (error: unknown) {
    refusal = error;
  }
  TestValidator.predicate(
    "a gather timed before the bounce is refused",
    refusal instanceof HumanRefusal && refusal.kind === "reach",
  );

  // The takes pass the shipped verdicts a viewer would show.
  assertTakeClean("dribbled possession", film);
}
