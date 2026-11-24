import { createBall, createGoal } from "@automovie/archetypes";
import { AutoMovieComposition, Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBallPlay,
  IAutoMovieMotionHumanBody,
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
import { nclose } from "../../../features/internal/nclose";

/** One basketball possession's outcome: a shot through the ring, a shot short of it, or a refused gather. */
type PossessionCase = "made" | "short" | "refused";

/**
 * One basketball travels from a floor pickup through a chest pass, a staged
 * catch and a set shot, and the ball's play credits the basket.
 *
 * Scenarios:
 * 1. The passer picks the ball up and passes; the receiver catches the same
 *    flight and shoots at the ring centre. The play reads hold, launch,
 *    caught hold and launch in that order and by those performers, and the
 *    ball centre passes down through the ring's inner circle without
 *    touching the hoop first.
 * 2. The same possession shot 0.6 m short of the ring never crosses the
 *    ring, and its first contact after the shot is the hoop or the floor.
 * 3. A receiver standing 1.2 m off the pass line refuses the gather.
 *
 * FIBA 2.4: the ring's inner diameter is 450 to 459 mm and its top 3.05 m
 * above the floor; this fixture fixes 450 mm. A credited basket needs the
 * whole ball through the ring, so the gate radius is the inner radius less
 * the ball's own. A drag-free shot aimed at the ring centre reaches it at
 * its authored flight time; 1 ms allows the bisection and launch
 * quantization.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three possessions, the FIBA geometry, the gate and the timing tolerance.
 * @evidence contracts/development/testing.md#behavioral-verification Runs pickUp, chestPass, stageCatch and setShot through HumanPerformance and reads HumanPerformance.play and HumanBallPlay.crossing on the displayed ball.
 * @evidence contracts/development/testing.md#independent-expectations The ring geometry is FIBA's; the crossing time is the authored drag-free flight time; the event order is the authored possession.
 * @evidence contracts/development/testing.md#distinguishing-cases A made shot crosses the gate, a short one does not, and a misplaced receiver refuses; all three share the same pass.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory performances of two polygon men, one ball and one hoop.
 */
export function test_motion_throw_catch_basketball_possession(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const ball: ReturnType<typeof createBall> = createBall({
    kind: "basketball",
  });
  const hoop: ReturnType<typeof createGoal> = createGoal({
    kind: "basketballHoop",
    ring: 0.45,
    thickness: 0.013,
  });
  const hoopAt: IAutoMovieVector3 = { x: 0, y: 0, z: -0.85 };
  const rim: IAutoMovieAffordance = hoop.affordance("rim");
  const bar: number = rim.aperture!;
  const inner: number = 0.45 / 2;

  // The rim affordance is the ring's front on its bar's centreline.
  const ring: IAutoMovieVector3 = Vector3.add(hoopAt, {
    ...rim.frame.translation,
    z: rim.frame.translation.z - inner - bar / 2,
  });
  const centre: IAutoMovieVector3 = ball.affordance("grip").frame.translation;
  const radius: number = ball.affordance("grip").aperture! / 2;
  const flightSeconds: number = 1.12;

  const take = (outcome: PossessionCase): HumanPerformance =>
    new HumanPerformance({
      seed: `basketball-possession-${outcome}`,
      performers: [
        {
          subject: "guard",
          body,
          at: { x: 0, y: 0, z: 1.2 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        {
          subject: "forward",
          body,
          at: { x: outcome === "refused" ? 1.2 : 0, y: 0, z: 4 },
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
        HumanChain.subject("guard")
          .pickUp({ prop: "ball", handle: "grip", lift: 0.15 })
          .ballSport(
            {
              kind: "chestPass",
              prop: "ball",
              at: { x: 0, y: 1.3, z: 3.45 },
              flightSeconds: 0.42,
            },
            "pass",
          ).node,
        HumanChain.subject("forward")
          .registered("stageCatch", {
            partner: "pass",
            ball: "ball",
            hands: "two",
            intercept: 0.42,
          })
          .sync({ of: "pass" })
          .ballSport(
            {
              kind: "setShot",
              prop: "ball",
              at: outcome === "short" ? { ...ring, z: ring.z + 0.6 } : ring,
              flightSeconds,
            },
            "shot",
          )
          // The film runs on while the shot's result plays out.
          .stand({ hold: 2, sway: 0 }).node,
      ),
    });

  const gate: IAutoMovieMotionHumanBallPlay.IDisc = {
    kind: "disc",
    centre: ring,
    normal: { x: 0, y: -1, z: 0 },
    radius: inner - radius,
  };
  const shot = (
    film: HumanPerformance,
    play: IAutoMovieMotionHumanBallPlay,
  ): IAutoMovieMotionHumanBallPlay.ILaunch => {
    const launches: IAutoMovieMotionHumanBallPlay.ILaunch[] =
      play.events.filter(
        (
          event: IAutoMovieMotionHumanBallPlay.Event,
        ): event is IAutoMovieMotionHumanBallPlay.ILaunch =>
          event.kind === "launch",
      );
    if (launches.length !== 2 || film.duration <= launches[1]!.seconds)
      throw new Error("The possession needs a pass and a shot");
    return launches[1]!;
  };

  const made: HumanPerformance = take("made");
  const play: IAutoMovieMotionHumanBallPlay = made.play("ball");
  const order: string[] = ballPossessions(play);

  TestValidator.equals(
    "one ball passes from the guard's pickup to the forward's caught shot",
    order,
    ["hold:guard:false", "launch:guard", "hold:forward:true", "launch:forward"],
  );
  const madeShot: IAutoMovieMotionHumanBallPlay.ILaunch = shot(made, play);
  const through: IAutoMovieMotionHumanBallPlay.ICrossing | undefined =
    AutoMovieMotionHumanThrowCatch.HumanBallPlay.crossing(
      made,
      "ball",
      gate,
      madeShot.seconds,
      made.duration,
      centre,
    );
  TestValidator.predicate(
    "the aimed shot drops through the ring at its flight time without touching the hoop first",
    through !== undefined &&
      nclose(through.seconds, madeShot.seconds + flightSeconds, 1e-3) &&
      !play.events.some(
        (event: IAutoMovieMotionHumanBallPlay.Event): boolean =>
          event.kind === "contact" &&
          event.seconds < through.seconds &&
          event.seconds > madeShot.seconds,
      ),
  );

  const short: HumanPerformance = take("short");
  const shortPlay: IAutoMovieMotionHumanBallPlay = short.play("ball");
  const shortShot: IAutoMovieMotionHumanBallPlay.ILaunch = shot(
    short,
    shortPlay,
  );
  const landed: IAutoMovieMotionHumanBallPlay.Event | undefined =
    shortPlay.events.find(
      (event: IAutoMovieMotionHumanBallPlay.Event): boolean =>
        event.kind === "contact" && event.seconds > shortShot.seconds,
    );
  TestValidator.predicate(
    "the short shot never passes the ring and first meets the hoop or the floor",
    AutoMovieMotionHumanThrowCatch.HumanBallPlay.crossing(
      short,
      "ball",
      gate,
      shortShot.seconds,
      short.duration,
      centre,
    ) === undefined &&
      landed?.kind === "contact" &&
      (landed.struck.kind === "ground" ||
        (landed.struck.kind === "prop" && landed.struck.subject === "hoop")),
  );

  let refusal: unknown;
  try {
    take("refused").play("ball");
  } catch (error: unknown) {
    refusal = error;
  }
  TestValidator.predicate(
    "a receiver off the pass line refuses the gather",
    refusal instanceof HumanRefusal && refusal.kind === "reach",
  );

  // The takes pass the shipped verdicts a viewer would show.
  assertTakeClean("made possession", made);
  assertTakeClean("short possession", short);
}
