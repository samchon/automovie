import { createBall, createVolleyballNet } from "@automovie/archetypes";
import { AutoMovieComposition, Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBallPlay,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanStand,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStance,
  AutoMovieMotionHumanSwing,
  AutoMovieMotionHumanThrowCatch,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { ballPossessions } from "../../../features/internal/ballPossessions";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** A volleyball contact row the rally uses. */
type Row = "volleyballServe" | "volleyballDig" | "volleyballSet";

/** One contact of the rally. */
interface ITouch {
  /** The performer who plays the ball. */
  player: string;

  /** The contact row. */
  row: Row;

  /** The aim on the floor or in the air, world metres. */
  toward: IAutoMovieVector3;

  /** Departure speed, m/s. */
  speed: number;

  /** Where the player stands and when the hand meets the ball; read from the previous contact's flight. */
  station?: IStation;
}

/** A player's place and time for one contact. */
interface IStation {
  /** Floor position, world metres. */
  at: IAutoMovieVector3;

  /** Facing, degrees about +Y from +Z. */
  yaw: number;

  /** Film second of the contact. */
  seconds: number;
}

/**
 * A volleyball rally on one ball: a serve over the net, the reception dig,
 * the set, an attack over the net, and either the attack landing in the
 * serving side's court or that side's defender digging it.
 *
 * Scenarios:
 * 1. The server tosses the ball from the left hand and serves it with the
 *    palm over the net into the receiving court.
 * 2. Each later contact is staged where the previous flight comes down
 *    through that contact's hand height; the player walks there and the
 *    hand meets the ball at that instant.
 * 3. Every ball sent across crosses the net plane above the tape and
 *    between the antennae, and every contact is by a different hand than
 *    the one before it on that side.
 * 4. Undefended, the attack first lands inside the serving side's court;
 *    defended, the serving side's digger plays it before it lands.
 *
 * FIVB Official Volleyball Rules: the court is 18 m by 9 m, the men's net
 * 2.43 m high with antennae 9 m apart (Rules 1.1, 2.1, 2.4); a ball crossing
 * the net must pass over it between the antennae (Rule 10.1). The attack is
 * played from a standing reach as a high push over the net, since the
 * bare-hand row has no jump.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the rally, the staging rule, the FIVB geometry and the standing attack.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the toss, volleyballServe, volleyballDig, volleyballSet and walks through HumanPerformance and reads the ball's play and net crossings.
 * @evidence contracts/development/testing.md#independent-expectations Court, net and antenna geometry are the FIVB's; each station is read from the actual previous flight.
 * @evidence contracts/development/testing.md#distinguishing-cases The same rally ends with the attack landing undefended or dug by the defender.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory performances of up to five polygon men, one ball and one net.
 */
export function test_motion_throw_catch_volleyball_rally(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const ball: ReturnType<typeof createBall> = createBall({
    kind: "volleyball",
  });
  const net: ReturnType<typeof createVolleyballNet> = createVolleyballNet();
  const centre: IAutoMovieVector3 = ball.affordance("grip").frame.translation;
  const scale: number = body.measure.stature / 1.75;
  const tossSeconds: number = 1.7;

  // Where each contact meets the ball's centre in the player's own frame:
  // overhead for serve and set, in front of the hips for a dig.
  const reach: Record<Row, IAutoMovieVector3> = {
    volleyballServe: { x: -0.2 * scale, y: 1.95 * scale, z: 0.36 * scale },
    volleyballSet: { x: -0.2 * scale, y: 1.95 * scale, z: 0.36 * scale },
    volleyballDig: { x: -0.15 * scale, y: 0.9 * scale, z: 0.5 * scale },
  };
  const turn = (yaw: number, v: IAutoMovieVector3): IAutoMovieVector3 =>
    Quaternion.rotateVector(
      Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yaw),
      v,
    );
  const face = (from: IAutoMovieVector3, to: IAutoMovieVector3): number =>
    (Math.atan2(to.x - from.x, to.z - from.z) * 180) / Math.PI;
  const server: IAutoMovieVector3 = { x: -2, y: 0, z: -9.6 };
  const toss: IAutoMovieVector3 = Vector3.add(server, reach.volleyballServe);
  const starts: Record<string, IAutoMovieVector3> = {
    server,
    receiver: { x: 2, y: 0, z: 6 },
    setter: { x: 0.5, y: 0, z: 1.5 },
    attacker: { x: -2, y: 0, z: 2.5 },
    digger: { x: 1, y: 0, z: -6 },
  };
  const holding: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStand.IParams> =
    {
      ...AutoMovieMotionHumanStance.stand,
      name: "volleyballHold",
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStand.IParams>,
      ): IAutoMovieMotionHumanActionPlan => ({
        ...AutoMovieMotionHumanStance.stand.plan(context),
        holds: [{ side: "left", prop: "ball", from: 0 }],
      }),
    };
  const left: IAutoMovieVector3 = HumanHand.frame(
    body,
    new HumanPerformance({
      seed: "volleyball-ready",
      performers: [
        {
          subject: "server",
          body,
          at: server,
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("server").stand({ hold: 0.2, sway: 0 })
        .node,
    }).bones("server", 0),
    "left",
    "grip",
  ).point;
  const launchSeconds: number[] = [];

  const film = (touches: readonly ITouch[], seed: string): HumanPerformance => {
    const players: string[] = Object.keys(starts).filter(
      (player: string): boolean =>
        player === "server" ||
        touches.some((touch: ITouch): boolean => touch.player === player),
    );
    const chains: Record<string, IAutoMovieMotionHumanChain> = {};
    for (const player of players)
      chains[player] =
        player === "server"
          ? HumanChain.subject("server")
              .registered(holding.name, { hold: 0.3, sway: 0 })
              .ballSport(
                {
                  kind: "handballThrow",
                  hand: "left",
                  prop: "ball",
                  at: toss,
                  flightSeconds: tossSeconds,
                },
                "toss",
              )
              .until({ event: "relax" })
              .stand({ hold: 0.05, sway: 0 })
          : HumanChain.subject(player).stand({ hold: 0.2, sway: 0 });
    touches.forEach((touch: ITouch, index: number): void => {
      if (touch.station === undefined) return;
      // Each player touches the ball once, from where the player starts.
      const moved: IAutoMovieMotionHumanChain = chains[touch.player]!;

      const impact: number = touch.row === "volleyballServe" ? 0.5 : 0.4;
      chains[touch.player] = moved
        .registered(
          touch.row,
          {
            ball: "ball",
            target: { kind: "point", frame: "world", at: touch.toward },
            speed: touch.speed,
            impact,
          },
          `touch${index}`,
        )
        .sync(
          index === 0
            ? { of: "toss", event: "stroke", offset: tossSeconds - impact }
            : {
                of: `touch${index - 1}`,
                event: "stroke",
                offset:
                  touch.station.seconds - launchSeconds[index - 1]! - impact,
              },
        );
    });
    return new HumanPerformance({
      seed,
      laws: [
        holding,
        AutoMovieMotionHumanSwing.HumanPrecisionSport.volleyballServe,
        AutoMovieMotionHumanSwing.HumanPrecisionSport.volleyballDig,
        AutoMovieMotionHumanSwing.HumanPrecisionSport.volleyballSet,
      ],
      performers: players.map(
        (
          player: string,
        ): IAutoMovieMotionHumanPerformance.IInput["performers"][number] => {
          const station: IStation | undefined = touches.find(
            (touch: ITouch): boolean => touch.player === player,
          )?.station;
          const start: IAutoMovieVector3 = starts[player]!;
          return {
            subject: player,
            body,
            at: station?.at ?? start,
            yaw: station?.yaw ?? (start.z < 0 ? 0 : 180),
            proficiency: { level: "trained" },
          };
        },
      ),
      props: [
        HumanObject.prop("ball", ball, {
          position: Vector3.subtract(left, centre),
          rotation: Quaternion.identity(),
        }),
        HumanObject.prop("net", net, {
          position: { x: 0, y: 0, z: 0 },
          rotation: Quaternion.identity(),
        }),
      ],
      composition: AutoMovieComposition.parallel(
        ...players.map(
          (player: string) =>
            chains[player]!.stand({ hold: 2.5, sway: 0 }).node,
        ),
      ),
    });
  };

  // Build contact by contact: each take's flight places the next player.
  const rally = (touches: ITouch[], seed: string): HumanPerformance => {
    touches[0]!.station = { at: server, yaw: 0, seconds: 0 };
    launchSeconds.length = 0;
    let take: HumanPerformance = film(touches.slice(0, 1), `${seed}-0`);
    for (let index: number = 0; index < touches.length; ++index) {
      const launch: IAutoMovieMotionHumanBallPlay.ILaunch = take
        .play("ball")
        .events.filter(
          (
            event: IAutoMovieMotionHumanBallPlay.Event,
          ): event is IAutoMovieMotionHumanBallPlay.ILaunch =>
            event.kind === "launch" && event.action.startsWith("volleyball"),
        )[index]!;
      launchSeconds[index] = launch.seconds;
      if (index + 1 === touches.length) return take;
      const next: ITouch = touches[index + 1]!;
      const down: IAutoMovieMotionHumanBallPlay.ICrossing | undefined =
        AutoMovieMotionHumanThrowCatch.HumanBallPlay.crossing(
          take,
          "ball",
          {
            kind: "rectangle",
            centre: { x: 0, y: reach[next.row].y, z: 0 },
            normal: { x: 0, y: -1, z: 0 },
            up: { x: 0, y: 0, z: 1 },
            halfWidth: 30,
            halfHeight: 30,
          },
          launch.seconds + 0.05,
          take.duration,
          centre,
        );
      if (down === undefined)
        throw new Error(`touch ${index} never comes down`);
      const yaw: number = face(down.point, next.toward);
      const offset: IAutoMovieVector3 = turn(yaw, reach[next.row]);
      next.station = {
        at: { x: down.point.x - offset.x, y: 0, z: down.point.z - offset.z },
        yaw,
        seconds: down.seconds,
      };
      take = film(touches.slice(0, index + 2), `${seed}-${index + 1}`);
    }
    return take;
  };
  const attack: ITouch[] = [
    {
      player: "server",
      row: "volleyballServe",
      toward: { x: 2, y: 0, z: 6 },
      speed: 14,
    },
    {
      player: "receiver",
      row: "volleyballDig",
      toward: { x: 0.5, y: 3, z: 1.5 },
      speed: 7,
    },
    {
      player: "setter",
      row: "volleyballSet",
      toward: { x: -2, y: 3, z: 1.5 },
      speed: 6,
    },
    {
      player: "attacker",
      row: "volleyballSet",
      toward: { x: 1, y: 0, z: -6 },
      speed: 9,
    },
  ];

  // The net plane above the tape and between the antennae.
  const over = (side: number): IAutoMovieMotionHumanBallPlay.IRectangle => ({
    kind: "rectangle",
    centre: { x: 0, y: 2.43 + 2, z: 0 },
    normal: { x: 0, y: 0, z: side },
    up: { x: 0, y: 1, z: 0 },
    halfWidth: 4.5,
    halfHeight: 2,
  });
  const open: HumanPerformance = rally(
    attack.map((t: ITouch) => ({ ...t })),
    "volleyball-open",
  );
  const play: IAutoMovieMotionHumanBallPlay = open.play("ball");
  TestValidator.equals(
    "one ball goes from the server across to the receiver, setter and attacker",
    ballPossessions(play).filter((label: string): boolean =>
      label.startsWith("launch"),
    ),
    [
      "launch:server",
      "launch:server",
      "launch:receiver",
      "launch:setter",
      "launch:attacker",
    ],
  );
  TestValidator.predicate(
    "the serve and the attack each cross the net above the tape between the antennae",
    AutoMovieMotionHumanThrowCatch.HumanBallPlay.crossing(
      open,
      "ball",
      over(1),
      launchSeconds[0]!,
      launchSeconds[1]!,
      centre,
    ) !== undefined &&
      AutoMovieMotionHumanThrowCatch.HumanBallPlay.crossing(
        open,
        "ball",
        over(-1),
        launchSeconds[3]!,
        open.duration,
        centre,
      ) !== undefined,
  );
  const landing: IAutoMovieMotionHumanBallPlay.Event | undefined =
    play.events.find(
      (event: IAutoMovieMotionHumanBallPlay.Event): boolean =>
        event.kind === "contact" && event.seconds > launchSeconds[3]!,
    );
  TestValidator.predicate(
    "the undefended attack first lands inside the serving side's court",
    landing?.kind === "contact" &&
      landing.struck.kind === "ground" &&
      Math.abs(landing.point.x) <= 4.5 &&
      landing.point.z < 0 &&
      landing.point.z >= -9,
  );

  const saved: HumanPerformance = rally(
    [
      ...attack.map((t: ITouch) => ({ ...t })),
      {
        player: "digger",
        row: "volleyballDig",
        toward: { x: 0, y: 3, z: -2 },
        speed: 7,
      },
    ],
    "volleyball-saved",
  );
  TestValidator.predicate(
    "defended, the serving side's digger plays the attack before anything but the digger's hand touches it",
    ballPossessions(saved.play("ball")).at(-1) === "launch:digger" &&
      !saved
        .play("ball")
        .events.some(
          (event: IAutoMovieMotionHumanBallPlay.Event): boolean =>
            event.kind === "contact" &&
            event.seconds > launchSeconds[3]! &&
            event.seconds < launchSeconds[4]! &&
            !(
              event.struck.kind === "person" &&
              event.struck.subject === "digger"
            ),
        ),
  );

  // The takes pass the shipped verdicts a viewer would show.
  assertTakeClean("volleyball rally", open);
  assertTakeClean("defended rally", saved);
}
