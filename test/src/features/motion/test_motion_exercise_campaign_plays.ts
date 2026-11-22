import { createBall } from "@automovie/archetypes";
import { AutoMovieComposition } from "@automovie/engine";
import type {
  IAutoMovieComposition,
  IAutoMovieMotionHumanBallPlay,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanObject, HumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../internal/assertTakeClean";
import { motionHumanBody } from "../internal/motionHumanBody";

/** One player's play composed from shipped laws. */
interface IPlay {
  /** What the play is and the sub-issue it drafts. */
  name: string;

  /** The ball kind, when the play uses one. */
  ball?: Parameters<typeof createBall>[0]["kind"];

  /** The players: the first plays the ball. */
  players: readonly IPlayer[];

  /** How many launches the ball's play must show. */
  launches: number;
}

/** One player of a play. */
interface IPlayer {
  /** The subject. */
  subject: string;

  /** Where they stand, world metres. */
  at: IAutoMovieVector3;

  /** Their facing, degrees about +Y. */
  yaw: number;

  /** Their composition. */
  compose: (
    chain: ReturnType<typeof HumanChain.subject>,
  ) => IAutoMovieComposition;
}

/**
 * The campaign's plays composed from shipped laws: each is a take a scene
 * can author with the chain alone, and each passes the shipped verdicts.
 *
 * Scenarios:
 * 1. #3880: a jump stop lands on both feet after a run; a layup shoots in
 *    the air over a jump.
 * 2. #3883: a jump attack spikes over a jump; a block raises both hands over
 *    a jump.
 * 3. #3893: a jump throw releases over a jump.
 * 4. #3882: a first touch kicks the ball softly along the ground and a cross
 *    lifts it.
 * 5. #3881 and #3897: a shooter's set shot is contested by a defender's high
 *    hands at the shooter's side (the box-out and the contested contact are
 *    the two players' stances against each other).
 * 6. Every take shows its ball launched as many times as it is played and
 *    passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each play, the sub-issue it drafts and what each take asserts.
 * @evidence contracts/development/testing.md#behavioral-verification Runs each composition through HumanPerformance and reads the ball's play and the shipped verdicts.
 * @evidence contracts/development/testing.md#independent-expectations The launch counts follow from the plays: one per release or kick, none for a block or a stop.
 * @evidence contracts/development/testing.md#distinguishing-cases Plays in the air, on the ground and against a defender are each composed.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory performances of polygon men and one ball each.
 */
export function test_motion_exercise_campaign_plays(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const ring: IAutoMovieVector3 = { x: 0, y: 3.05, z: 1.6 };
  const plays: readonly IPlay[] = [
    {
      name: "#3880 jump stop",
      players: [
        {
          subject: "a",
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          compose: (chain) =>
            chain
              .run({ to: { x: 0, y: 0, z: 3 }, pace: "jog" })
              .jump({ to: { x: 0, y: 0, z: 3.6 } })
              .stand({ seconds: 0.5, sway: 0 }).node,
        },
      ],
      launches: 0,
    },
    {
      name: "#3880 layup",
      ball: "basketball",
      players: [
        {
          subject: "a",
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          compose: (chain) =>
            chain
              .pickUp({ prop: "ball", handle: "grip", lift: 0.9 })
              .jump({ to: { x: 0, y: 0, z: 0.6 } })
              .over((upper) =>
                upper.ballSport({
                  kind: "setShot",
                  prop: "ball",
                  at: ring,
                  flightSeconds: 0.6,
                }),
              )
              .stand({ seconds: 1, sway: 0 }).node,
        },
      ],
      launches: 1,
    },
    {
      name: "#3883 jump attack",
      ball: "volleyball",
      players: [
        {
          subject: "a",
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          compose: (chain) =>
            chain
              .pickUp({ prop: "ball", handle: "grip", lift: 0.9 })
              .jump({ to: { x: 0, y: 0, z: 0.4 } })
              .over((upper) =>
                upper.ballSport({
                  kind: "volleyballSpike",
                  prop: "ball",
                  at: { x: 0, y: 0, z: 8 },
                }),
              )
              .stand({ seconds: 1, sway: 0 }).node,
        },
      ],
      launches: 1,
    },
    {
      name: "#3883 block",
      players: [
        {
          subject: "a",
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          compose: (chain) =>
            chain
              .jump({ to: { x: 0, y: 0, z: 0 } })
              .over((upper) => upper.ballSport({ kind: "volleyballBlock" }))
              .stand({ seconds: 0.5, sway: 0 }).node,
        },
      ],
      launches: 0,
    },
    {
      name: "#3893 jump throw",
      ball: "handball",
      players: [
        {
          subject: "a",
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          compose: (chain) =>
            chain
              .pickUp({ prop: "ball", handle: "grip", lift: 0.15 })
              .jump({ to: { x: 0, y: 0, z: 0.5 } })
              .over((upper) =>
                upper.ballSport({
                  kind: "handballThrow",
                  prop: "ball",
                  at: { x: 0.9, y: 1.4, z: 9 },
                  flightSeconds: 0.6,
                }),
              )
              .stand({ seconds: 1, sway: 0 }).node,
        },
      ],
      launches: 1,
    },
    {
      name: "#3882 first touch and cross",
      ball: "football",
      players: [
        {
          subject: "a",
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          compose: (chain) =>
            chain
              .kickBall({
                ball: "ball",
                toward: {
                  kind: "point",
                  frame: "world",
                  at: { x: 0, y: 0, z: 2 },
                },
                speed: 1.5,
                lift: 0,
              })
              .stand({ seconds: 1.5, sway: 0 }).node,
        },
      ],
      launches: 1,
    },
    {
      name: "#3881 #3897 contested set shot",
      ball: "basketball",
      players: [
        {
          subject: "a",
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          compose: (chain) =>
            chain
              .pickUp({ prop: "ball", handle: "grip", lift: 0.9 })
              .ballSport(
                { kind: "setShot", prop: "ball", at: ring, flightSeconds: 1 },
                "shot",
              )
              .stand({ seconds: 1, sway: 0 }).node,
        },
        {
          subject: "b",
          at: { x: 0.9, y: 0, z: 0.7 },
          yaw: 180,
          compose: (chain) =>
            chain
              .ballSport({ kind: "highHandContest" })
              .sync({ of: "shot" })
              .stand({ seconds: 1, sway: 0 }).node,
        },
      ],
      launches: 1,
    },
  ];
  // Every play is read, and the plays that fail are named together.
  const failed: string[] = [];
  for (const play of plays) {
    try {
      played(play);
    } catch (error: unknown) {
      failed.push(
        `${play.name}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  TestValidator.predicate(
    `every play composes, launches its ball and passes the verdicts: ${failed.join(" || ")}`,
    failed.length === 0,
  );

  function played(play: IPlay): void {
    const performers: IAutoMovieMotionHumanPerformance.IInput["performers"] =
      play.players.map(
        (
          player: IPlayer,
        ): IAutoMovieMotionHumanPerformance.IInput["performers"][number] => ({
          subject: player.subject,
          body,
          at: player.at,
          yaw: player.yaw,
          proficiency: { level: "trained" },
        }),
      );
    const take: HumanPerformance = new HumanPerformance({
      seed: play.name,
      performers,
      props:
        play.ball === undefined
          ? []
          : [
              HumanObject.prop("ball", createBall({ kind: play.ball }), {
                at: { x: 0.25, y: 0, z: 0.45 },
                yaw: 0,
              }),
            ],
      composition: AutoMovieComposition.parallel(
        ...play.players.map(
          (player: IPlayer): IAutoMovieComposition =>
            player.compose(HumanChain.subject(player.subject)),
        ),
      ),
    });
    if (play.ball !== undefined) {
      const ball: IAutoMovieMotionHumanBallPlay = take.play("ball");
      TestValidator.predicate(
        `${play.name} launches its ball ${play.launches} time(s)`,
        ball.events.filter(
          (event: IAutoMovieMotionHumanBallPlay.Event): boolean =>
            event.kind === "launch",
        ).length === play.launches,
      );
    }
    assertTakeClean(play.name, take);
  }
}
