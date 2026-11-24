import { createBall, createRacket } from "@automovie/archetypes";
import { AutoMovieComposition, Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieComposition,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBallPlay,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanChainCore,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanStand,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
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
import {
  AutoMovieMotionHumanHeld,
  HumanHand,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { vclose } from "../../../features/internal/vclose";

/** The two players; `a` serves from the -Z end, `b` receives at +Z. */
type Player = "a" | "b";

/** One forehand of the point after its hitter's walk to the ball. */
interface IShot {
  /** The hitter. */
  hitter: Player;

  /** The aim on the floor, world metres. */
  toward: IAutoMovieVector3;

  /** Departure speed, m/s. */
  speed: number;

  /** Where the hitter stands, the facing in degrees and the film second of impact; read from the previous shot's flight. */
  station?: IStation;
}

/** A hitter's place and time for one forehand. */
interface IStation {
  /** Floor position, world metres. */
  at: IAutoMovieVector3;

  /** Facing, degrees about +Y from +Z. */
  yaw: number;

  /** Film second of impact. */
  seconds: number;
}

/**
 * A tennis point: an underhand serve, two returns and a third return that
 * either lands in and is not returned, or flies long, all with one ball
 * that bounces on the court between strokes.
 *
 * Scenarios:
 * 1. The server tosses the ball from the left hand and strikes it with a
 *    forehand into the diagonal service box.
 * 2. Each later forehand is staged where the previous shot, after its
 *    bounce, comes down through the forehand's contact height; the hitter
 *    runs there from the relax of their own last stroke, which cuts it, so
 *    the run ends before the forehand must start, and strikes at that
 *    instant. The take that measures a station has no shot yet for the
 *    player waiting on the one after it, so that player recovers behind
 *    their baseline's centre: left standing at their old station, they
 *    stood in the measured shot's path and the ball rebounded off their
 *    chest, which no flight continues (a displayed person certifies no
 *    departure from a resolved contact).
 * 3. Every shot passes over the net's centre tape between the singles
 *    sidelines and first lands inside its opponent's
 *    singles court, and every racket face meets the ball's surface at its
 *    launch while the hitter's feet stay planted.
 * 4. The completed point's last return lands in and bounces twice unreturned;
 *    the faulted point's last return first lands beyond the baseline.
 * 5. Frames read forward and backward agree.
 *
 * ITF Rules of Tennis: the court is 23.77 m long, the singles court 8.23 m
 * wide, the service line 6.40 m from the net, and the net 0.914 m high at
 * its centre; an underhand serve is legal when struck before the ball
 * reaches the ground. The tennis ball's restitution and felt friction are
 * the archetype's. Shot speeds follow drag-free arithmetic: at the
 * forehand's 18 degree loft, 15 m/s from 1.3 m lands about 17 m away and
 * 22 m/s about 32 m away, past the far baseline.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the point, the staging rule, the ITF geometry and how the shot speeds were chosen.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the toss, tennisForehandReturn and walks through HumanPerformance and reads the ball's play, gate crossings, displayed racket faces and feet.
 * @evidence contracts/development/testing.md#independent-expectations Court lines and net height are the ITF's; each station is read from the actual previous flight.
 * @evidence contracts/development/testing.md#distinguishing-cases The same rally ends in a winner or a long fault depending on the last speed; a net fault or a short ball would fail the landing checks.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory performances of two polygon men, two rackets and one ball; the net is a gate, not a collider.
 */
export function test_motion_swing_tennis_point(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const ball: ReturnType<typeof createBall> = createBall({ kind: "tennis" });
  const racket: ReturnType<typeof createRacket> = createRacket({
    kind: "tennis",
  });
  const centre: IAutoMovieVector3 = ball.affordance("grip").frame.translation;
  const radius: number = ball.affordance("grip").aperture! / 2;
  const impact: number = 0.55;

  // The toss ends into a stand only from its relax, about 1.07 s after its
  // release, so it rises long enough for the serve's forehand to start then.
  const tossSeconds: number = 1.7;

  // The forehand meets the ball out to the racket side and ahead, as the
  // shipped feed-and-return scene stages it, scaled to this body.
  const scale: number = body.measure.stature / 1.75;
  const reach: IAutoMovieVector3 = {
    x: -0.81 * scale,
    y: 1.28 * scale,
    z: 0.55 * scale,
  };
  // A hitter stands at the forehand's own address for the ball, facing the
  // shot, the racket read in the hand as the hold keeps it: hung from the
  // quiet stance's right grip with its face turned up, as the takes hang it
  // (`PrecisionStrokeForms.address`).
  const quiet: ReturnType<HumanPerformance["bones"]> = new HumanPerformance({
    seed: "tennis-quiet",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a").stand({ hold: 0.2, sway: 0 }).node,
  }).bones("a", 0);
  const hung: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 1, y: 0, z: 0 },
    90,
  );
  const held: IAutoMovieMotionHumanHeld.IHeld =
    AutoMovieMotionHumanHeld.grasped(
      body,
      "right",
      "racket",
      {
        position: Vector3.subtract(
          HumanHand.frame(body, quiet, "right", "grip").point,
          Quaternion.rotateVector(
            hung,
            racket.affordance("grip").frame.translation,
          ),
        ),
        rotation: hung,
      },
      racket.affordances ?? [],
      {
        point: quiet.get("rightHand")!.worldPosition,
        rotation: quiet.get("rightHand")!.worldRotation,
      },
    );
  const place = (point: IAutoMovieVector3, yaw: number): IAutoMovieVector3 =>
    AutoMovieMotionHumanSwing.PrecisionStrokeForms.address({
      body,
      row: "tennisForehandReturn",
      side: "right",
      yaw,
      ball: point,
      radius,
      toward: Vector3.add(
        point,
        Quaternion.rotateVector(
          Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yaw),
          { x: 0, y: 0, z: 10 },
        ),
      ),
      held,
    });
  const face = (from: IAutoMovieVector3, to: IAutoMovieVector3): number =>
    (Math.atan2(to.x - from.x, to.z - from.z) * 180) / Math.PI;

  // The server stands behind the -Z baseline right of centre, facing +Z.
  const serverAt: IAutoMovieVector3 = { x: -1, y: 0, z: -12.2 };
  const receiverAt: IAutoMovieVector3 = { x: 2.5, y: 0, z: 12.2 };
  const toss: IAutoMovieVector3 = Vector3.add(serverAt, {
    ...Quaternion.rotateVector(
      Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 0),
      reach,
    ),
    y: reach.y,
  });
  const holding = (
    player: Player,
  ): IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStand.IParams> => ({
    ...AutoMovieMotionHumanStance.stand,
    name: `tennisHold-${player}`,
    plan: (
      context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStand.IParams>,
    ): IAutoMovieMotionHumanActionPlan => ({
      ...AutoMovieMotionHumanStance.stand.plan(context),
      holds: [
        { side: "right", prop: `racket-${player}`, from: 0 },
        ...(player === "a"
          ? [{ side: "left" as const, prop: "ball", from: 0 }]
          : []),
      ],
    }),
  });

  // A player waiting for a shot not yet staged recovers behind the centre of
  // their own baseline, facing the net, as a player recovers between strokes.
  const home = (player: Player): IAutoMovieVector3 => ({
    x: 0,
    y: 0,
    z: player === "a" ? -12.2 : 12.2,
  });
  const recover = (
    chain: IAutoMovieMotionHumanChain,
    player: Player,
  ): IAutoMovieMotionHumanChain =>
    chain
      .run({ to: home(player), pace: "run", face: player === "a" ? 0 : 180 })
      .stand({ hold: 2.5, sway: 0 });

  const film = (
    shots: readonly IShot[],
    measuring: boolean,
  ): HumanPerformance => {
    const chains: Record<Player, IAutoMovieMotionHumanChain> = {
      a: HumanChain.subject("a")
        .registered(`tennisHold-a`, { hold: 0.3, sway: 0 })
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
        // The toss ends into a moment's stand, which the serve then cuts.
        .until({ event: "relax" })
        .stand({ hold: 0.05, sway: 0 }),
      b: HumanChain.subject("b").registered(`tennisHold-b`, {
        hold: 0.3,
        sway: 0,
      }),
    };
    // The serve and the first return ride the players' own chains. Each
    // later shot is its own branch, composed after the shot it answers, so
    // the scheduler places that shot's flight before this one reads it: the
    // hitter's own last stroke is cut at its relax and the hitter runs from
    // there to the station, so the run ends before the stroke must start.
    // In a measuring take the player who hit the shot before the last one
    // waits for a shot not staged yet; standing at their old station they
    // would stand in the last shot's path, so they recover to their baseline.
    const branches: IAutoMovieComposition[] = [];
    const waiting: number = measuring ? shots.length - 2 : -1;
    const ended: Record<Player, boolean> = { a: false, b: false };
    shots.forEach((shot: IShot, index: number): void => {
      if (shot.station === undefined) return;
      const stroke = (
        chain: IAutoMovieMotionHumanChain,
      ): IAutoMovieMotionHumanChain => {
        const struck: IAutoMovieMotionHumanChain = chain.registered(
          "tennisForehandReturn",
          {
            tool: `racket-${shot.hitter}`,
            ball: "ball",
            target: { kind: "point", frame: "world", at: shot.toward },
            impact,
            speed: shot.speed,
          },
          `shot${index}`,
        );
        return index + 2 < shots.length
          ? struck.until({ event: "relax" })
          : struck;
      };
      const settle = (
        chain: IAutoMovieMotionHumanChain,
      ): IAutoMovieMotionHumanChain => {
        if (index !== waiting) return chain;
        ended[shot.hitter] = true;
        return recover(chain, shot.hitter);
      };
      if (index === 0) {
        chains.a = settle(
          stroke(chains.a).sync({
            of: "toss",
            event: "stroke",
            offset: tossSeconds - impact,
          }),
        );
        return;
      }
      const answer: IAutoMovieMotionHumanChainCore.ISync = {
        of: `shot${index - 1}`,
        event: "stroke",
        offset: shot.station.seconds - launchOf(shots, index - 1) - impact,
      };
      if (index === 1) {
        chains.b = settle(stroke(chains.b).sync(answer));
        return;
      }
      ended[shot.hitter] = true;
      const run: IAutoMovieMotionHumanChain = HumanChain.subject(shot.hitter)
        .run({ to: shot.station.at, pace: "run", face: shot.station.yaw })
        .sync({ of: `shot${index - 2}`, event: "relax" })
        .stand({ hold: 0.05, sway: 0 });
      const struck: IAutoMovieMotionHumanChain = stroke(run).sync(answer);
      branches.push(
        (index === shots.length - 1
          ? struck.stand({ hold: 2.5, sway: 0 })
          : settle(struck)
        ).node,
      );
    });
    const hand = (
      player: Player,
      at: IAutoMovieVector3,
      yaw: number,
    ): IAutoMovieMotionHumanHand.IFrame =>
      HumanHand.frame(
        body,
        new HumanPerformance({
          seed: `tennis-ready-${player}`,
          performers: [
            {
              subject: player,
              body,
              at,
              yaw,
              proficiency: { level: "trained" },
            },
          ],
          composition: HumanChain.subject(player).stand({
            hold: 0.2,
            sway: 0,
          }).node,
        }).bones(player, 0),
        "right",
        "grip",
      );
    const racketAt = (
      player: Player,
      at: IAutoMovieVector3,
      yaw: number,
    ): IAutoMovieRigidTransform => {
      const grip: IAutoMovieVector3 =
        racket.affordance("grip").frame.translation;
      const rotation: IAutoMovieQuaternion = Quaternion.multiply(
        Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yaw),
        Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
      );
      return {
        position: Vector3.subtract(
          hand(player, at, yaw).point,
          Quaternion.rotateVector(rotation, grip),
        ),
        rotation,
      };
    };
    const left: IAutoMovieVector3 = HumanHand.frame(
      body,
      new HumanPerformance({
        seed: "tennis-ready-ball",
        performers: [
          {
            subject: "a",
            body,
            at: serverAt,
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a").stand({ hold: 0.2, sway: 0 }).node,
      }).bones("a", 0),
      "left",
      "grip",
    ).point;
    return new HumanPerformance({
      seed: `tennis-point-${shots.length}-${shots.at(-1)!.speed}`,
      laws: [
        holding("a"),
        holding("b"),
        AutoMovieMotionHumanSwing.HumanPrecisionSport.tennisForehandReturn,
      ],
      performers: [
        {
          subject: "a",
          body,
          at: serverAt,
          yaw: 0,
          proficiency: { level: "trained" },
        },
        {
          subject: "b",
          body,
          at: shots[1]?.station?.at ?? receiverAt,
          yaw: shots[1]?.station?.yaw ?? 180,
          proficiency: { level: "trained" },
        },
      ],
      props: [
        HumanObject.prop("ball", ball, {
          position: Vector3.subtract(left, centre),
          rotation: Quaternion.identity(),
        }),
        HumanObject.prop("racket-a", racket, racketAt("a", serverAt, 0)),
        HumanObject.prop(
          "racket-b",
          racket,
          racketAt(
            "b",
            shots[1]?.station?.at ?? receiverAt,
            shots[1]?.station?.yaw ?? 180,
          ),
        ),
      ],
      composition: AutoMovieComposition.parallel(
        (ended.a ? chains.a : chains.a.stand({ hold: 2.5, sway: 0 })).node,
        (ended.b ? chains.b : chains.b.stand({ hold: 2.5, sway: 0 })).node,
        ...branches,
      ),
    });
  };
  const launches: number[] = [];
  const launchOf = (_shots: readonly IShot[], index: number): number =>
    launches[index]!;

  // Build the rally shot by shot: each take's flight places the next hitter.
  // The three shots before the last are shared; each last speed then ends
  // its own take.
  const shots: IShot[] = [
    { hitter: "a", toward: { x: 2, y: 0, z: 4.5 }, speed: 15 },
    { hitter: "b", toward: { x: -1, y: 0, z: -5 }, speed: 15 },
    { hitter: "a", toward: { x: 1, y: 0, z: 5 }, speed: 15 },
    { hitter: "b", toward: { x: 0, y: 0, z: -5 }, speed: 15 },
  ];
  shots[0]!.station = { at: serverAt, yaw: 0, seconds: 0 };
  let take: HumanPerformance = film(shots.slice(0, 1), true);
  for (let index: number = 0; index + 1 < shots.length; ++index) {
    const play: IAutoMovieMotionHumanBallPlay = take.play("ball");
    const shot: IAutoMovieMotionHumanBallPlay.ILaunch = play.events.filter(
      (
        event: IAutoMovieMotionHumanBallPlay.Event,
      ): event is IAutoMovieMotionHumanBallPlay.ILaunch =>
        event.kind === "launch" && event.action === "tennisForehandReturn",
    )[index]!;
    launches[index] = shot.seconds;
    const bounce: IAutoMovieMotionHumanBallPlay.Event | undefined =
      play.events.find(
        (event: IAutoMovieMotionHumanBallPlay.Event): boolean =>
          event.kind === "contact" &&
          event.seconds > shot.seconds &&
          event.struck.kind === "ground",
      );
    if (bounce?.kind !== "contact")
      throw new Error(`shot ${index} never lands`);
    const down: IAutoMovieMotionHumanBallPlay.ICrossing | undefined =
      AutoMovieMotionHumanThrowCatch.HumanBallPlay.crossing(
        take,
        "ball",
        {
          kind: "rectangle",
          centre: { x: 0, y: reach.y, z: 0 },
          normal: { x: 0, y: -1, z: 0 },
          up: { x: 0, y: 0, z: 1 },
          halfWidth: 40,
          halfHeight: 40,
        },
        bounce.seconds,
        take.duration,
        centre,
      );
    if (down === undefined) throw new Error(`shot ${index} never comes down`);
    const next: IShot = shots[index + 1]!;
    const yaw: number = face(down.point, next.toward);
    next.station = { at: place(down.point, yaw), yaw, seconds: down.seconds };
    if (index + 2 < shots.length) take = film(shots.slice(0, index + 2), true);
  }
  const rally = (last: number): HumanPerformance => {
    const ending: IShot[] = [
      ...shots.slice(0, -1),
      { ...shots.at(-1)!, speed: last },
    ];
    const film4: HumanPerformance = film(ending, false);
    launches[ending.length - 1] = film4
      .play("ball")
      .events.filter(
        (
          event: IAutoMovieMotionHumanBallPlay.Event,
        ): event is IAutoMovieMotionHumanBallPlay.ILaunch =>
          event.kind === "launch" && event.action === "tennisForehandReturn",
      )[ending.length - 1]!.seconds;
    return film4;
  };
  const singles = (point: IAutoMovieVector3, side: number): boolean =>
    Math.abs(point.x) <= 8.23 / 2 &&
    point.z * side > 0 &&
    Math.abs(point.z) <= 23.77 / 2;
  const landings = (
    take: HumanPerformance,
  ): IAutoMovieMotionHumanBallPlay.IContact[] => {
    const events: IAutoMovieMotionHumanBallPlay.Event[] =
      take.play("ball").events;
    return launches.map(
      (seconds: number): IAutoMovieMotionHumanBallPlay.IContact => {
        const first: IAutoMovieMotionHumanBallPlay.Event | undefined =
          events.find(
            (event: IAutoMovieMotionHumanBallPlay.Event): boolean =>
              event.kind === "contact" && event.seconds > seconds,
          );
        if (first?.kind !== "contact") throw new Error("a shot never lands");
        return first;
      },
    );
  };

  const won: HumanPerformance = rally(15);

  // The net is not a collider here: its 5 mm panels would slow every sweep.
  // Each shot instead must pass the net plane above the 0.914 m centre tape
  // and between the singles sidelines.
  TestValidator.predicate(
    "every shot clears the net between the singles sidelines",
    launches.every((seconds: number, index: number): boolean => {
      const side: number = index % 2 === 0 ? 1 : -1;
      return (
        AutoMovieMotionHumanThrowCatch.HumanBallPlay.crossing(
          won,
          "ball",
          {
            kind: "rectangle",
            centre: { x: 0, y: 0.914 + radius + 2, z: 0 },
            normal: { x: 0, y: 0, z: side },
            up: { x: 0, y: 1, z: 0 },
            halfWidth: 8.23 / 2,
            halfHeight: 2,
          },
          seconds,
          launches[index + 1] ?? won.duration,
          centre,
        ) !== undefined
      );
    }),
  );
  const wonLandings: IAutoMovieMotionHumanBallPlay.IContact[] = landings(won);
  TestValidator.predicate(
    "the serve lands in the diagonal service box and every return in the opponent's singles court",
    wonLandings.every(
      (
        contact: IAutoMovieMotionHumanBallPlay.IContact,
        index: number,
      ): boolean =>
        contact.struck.kind === "ground" &&
        singles(contact.point, index % 2 === 0 ? 1 : -1) &&
        (index !== 0 || (contact.point.z <= 6.4 && contact.point.x >= 0)),
    ),
  );
  TestValidator.predicate(
    "each racket face meets the ball surface at its launch with the hitter's feet planted",
    launches.every((seconds: number, index: number): boolean => {
      const player: Player = index % 2 === 0 ? "a" : "b";
      const frame: IAutoMovieRigidTransform = won.prop(
        `racket-${player}`,
        seconds,
      );
      const facePoint: IAutoMovieVector3 = Vector3.add(
        frame.position,
        Quaternion.rotateVector(
          frame.rotation,
          racket.affordance("face").frame.translation,
        ),
      );
      // The ball's centre is its grip offset turned by its frame: the toss
      // leaves it turned, so the bare offset would lift the centre a
      // diameter off the face.
      const ballFrame: IAutoMovieRigidTransform = won.prop("ball", seconds);
      const ballCentre: IAutoMovieVector3 = Vector3.add(
        ballFrame.position,
        Quaternion.rotateVector(ballFrame.rotation, centre),
      );
      const foot = (time: number): IAutoMovieVector3 =>
        won.bones(player, time).get("leftFoot")!.worldPosition;
      return (
        Math.abs(Vector3.distance(facePoint, ballCentre) - radius) <=
          Math.min(0.012, 0.2 * radius) &&
        Vector3.distance(foot(seconds - 0.05), foot(seconds + 0.05)) <= 0.005
      );
    }),
  );
  const last: number = launches.at(-1)!;
  const after: IAutoMovieMotionHumanBallPlay.Event[] = won
    .play("ball")
    .events.filter(
      (event: IAutoMovieMotionHumanBallPlay.Event): boolean =>
        event.kind === "contact" && event.seconds > last,
    );
  TestValidator.predicate(
    "the completed point's last shot lands in and bounces again unreturned",
    after.length >= 2 &&
      after[0]!.kind === "contact" &&
      after[0]!.struck.kind === "ground" &&
      singles(after[0]!.point, -1) &&
      after[1]!.kind === "contact" &&
      after[1]!.struck.kind === "ground" &&
      !won
        .play("ball")
        .events.some(
          (event: IAutoMovieMotionHumanBallPlay.Event): boolean =>
            event.kind === "launch" && event.seconds > last,
        ),
  );
  const times: number[] = [0, 1, 2, 3, 4, 5].map(
    (k: number): number => last + 0.2 * k,
  );
  const forward: IAutoMovieVector3[] = times.map(
    (s: number): IAutoMovieVector3 => won.prop("ball", s).position,
  );
  const backward: IAutoMovieVector3[] = [...times]
    .reverse()
    .map((s: number): IAutoMovieVector3 => won.prop("ball", s).position)
    .reverse();
  TestValidator.predicate(
    "the ball reads the same frames forward and backward",
    forward.every((p: IAutoMovieVector3, k: number): boolean =>
      vclose(p, backward[k]!, 1e-9),
    ),
  );

  const long: HumanPerformance = rally(22);
  const fault: IAutoMovieMotionHumanBallPlay.IContact = landings(long).at(-1)!;
  TestValidator.predicate(
    "the faulted point's last shot first lands beyond the far baseline",
    fault.struck.kind === "ground" && fault.point.z < -23.77 / 2,
  );

  // The takes pass the shipped verdicts a viewer would show.
  assertTakeClean("tennis point", won);
}
