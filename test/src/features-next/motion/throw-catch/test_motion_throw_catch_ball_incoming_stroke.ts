import { createBall, createClub } from "@automovie/archetypes";
import { AutoMovieComposition, Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieComposition,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPropFlight,
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
import { HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";

/** One staged take: the pitch's aim, the batter's chain and the seed. */
interface ITake {
  /** World point the pitch is aimed at, metres. */
  aim: IAutoMovieVector3;

  /** The batter's actions. */
  batter: IAutoMovieComposition;

  /** Seed. */
  seed: string;

  /** Seconds the pitcher stands after the pitch, which ends the film. */
  follow: number;
}

/**
 * A stroke on a live incoming ball takes it over from the pitch at the
 * strike, and the pitch's sweep no longer reads the striker's bat through
 * the stroke's own fit.
 *
 * Scenarios:
 * 1. A pitch from the rule-book 18.44 m meets a batter's swing timed to its
 *    plate crossing. The pitch flight ends at the batter's launch with no
 *    contact of its own, and the bat's strike point is on the ball's surface
 *    at that launch. The whole take resolves within the one-minute bound of
 *    a focused spec; before the handback it stalled past three minutes.
 * 2. A pitch aimed at the strike point of a bat held still, with no swing,
 *    meets that bat: outside a later launch's fitted approach a held prop
 *    stays a collider.
 *
 * MLB Official Baseball Rules 2.01 put the pitcher's plate 60 ft 6 in
 * (18.44 m) from home. The stroke's 12 mm contact allowance, capped at a
 * fifth of the ball's radius as the precision-contact spec reads it, bounds
 * the bat-to-surface distance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both takes, the rule distance, the contact allowance and the run-time bound with its basis.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public pitch, baseballHit and fixture holds through HumanPerformance and reads flights, their contacts and handbacks, and displayed bat and ball frames. A sweep that reads the striker's bat through the stroke stalls the first take past the bound; one that drops held props everywhere misses the second take's contact.
 * @evidence contracts/development/testing.md#independent-expectations The plate distance is the rule book's. Contact is the bat's strike affordance against the ball's own radius. The swing is timed from the pitch-only take's plate crossing, found by bisection on the displayed ball.
 * @evidence contracts/development/testing.md#distinguishing-cases The same held bat is handed back while the batter swings, and remains a collider while the batter stands. Ball continuity and staged-catch specs own catches and rebounds.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory performances of two polygon men, one ball and one bat.
 */
export function test_motion_throw_catch_ball_incoming_stroke(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const identity: IAutoMovieQuaternion = Quaternion.identity();
  const ball: ReturnType<typeof createBall> = createBall({ kind: "baseball" });
  const bat: ReturnType<typeof createClub> = createClub({ kind: "bat" });
  const centre: IAutoMovieVector3 = ball.affordance("grip").frame.translation;
  const radius: number = ball.affordance("grip").aperture! / 2;
  const distance: number = 18.44;
  const impact: number = 0.56;
  const bound: number = 60_000;

  // The bat in the batter's right grip of the ready pose, barrel 4 degrees down.
  const ready: HumanPerformance = new HumanPerformance({
    seed: "incoming-ready",
    performers: [
      {
        subject: "batter",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("batter").stand({ hold: 0.2, sway: 0 })
      .node,
  });
  const hand: IAutoMovieVector3 = HumanHand.frame(
    body,
    ready.bones("batter", 0),
    "right",
    "grip",
  ).point;
  const grip: IAutoMovieVector3 = bat.affordance("grip").frame.translation;
  const barrel: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 0, z: 1 },
    -94,
  );
  const batAt: IAutoMovieRigidTransform = {
    position: Vector3.subtract(hand, Quaternion.rotateVector(barrel, grip)),
    rotation: barrel,
  };
  const strikeAt = (frame: IAutoMovieRigidTransform): IAutoMovieVector3 =>
    Vector3.add(
      frame.position,
      Quaternion.rotateVector(
        frame.rotation,
        bat.affordance("strike").frame.translation,
      ),
    );
  const working: IAutoMovieVector3 = Quaternion.rotateVector(
    barrel,
    Vector3.subtract(bat.affordance("strike").frame.translation, grip),
  );
  const contact: IAutoMovieVector3 = {
    x: 0.6 * hand.x + working.x,
    y: 1.03,
    z: 0.28,
  };

  const holding = (
    name: string,
    prop: string,
  ): IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStand.IParams> => ({
    ...AutoMovieMotionHumanStance.stand,
    name,
    plan: (
      context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStand.IParams>,
    ): IAutoMovieMotionHumanActionPlan => ({
      ...AutoMovieMotionHumanStance.stand.plan(context),
      holds: [{ side: "right", prop, from: 0 }],
    }),
  });
  const holdBall: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStand.IParams> =
    holding("incomingFixtureBall", "ball");
  const holdBat: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStand.IParams> =
    holding("incomingFixtureBat", "bat");

  const pitcherAt: IAutoMovieVector3 = { x: 0, y: 0, z: distance };
  const pitcherReady: HumanPerformance = new HumanPerformance({
    seed: "incoming-pitcher",
    performers: [
      {
        subject: "pitcher",
        body,
        at: pitcherAt,
        yaw: 180,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("pitcher").stand({ hold: 0.2, sway: 0 })
      .node,
  });
  const palm: IAutoMovieVector3 = HumanHand.frame(
    body,
    pitcherReady.bones("pitcher", 0),
    "right",
    "grip",
  ).point;
  const film = (take: ITake): HumanPerformance =>
    new HumanPerformance({
      seed: take.seed,
      laws: [
        holdBall,
        holdBat,
        AutoMovieMotionHumanThrowCatch.HumanSportThrow.pitch,
        AutoMovieMotionHumanSwing.HumanPrecisionSport.baseballHit,
      ],
      performers: [
        {
          subject: "pitcher",
          body,
          at: pitcherAt,
          yaw: 180,
          proficiency: { level: "trained" },
        },
        {
          subject: "batter",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      props: [
        HumanObject.prop("ball", ball, {
          position: Vector3.subtract(palm, centre),
          rotation: identity,
        }),
        HumanObject.prop("bat", bat, batAt),
      ],
      composition: AutoMovieComposition.parallel(
        HumanChain.subject("pitcher")
          .registered(holdBall.name, { hold: 0.4, sway: 0 })
          .registered(
            "pitch",
            {
              prop: "ball",
              target: { kind: "point", frame: "world", at: take.aim },
            },
            "pitch",
          )
          .stand({ hold: take.follow, sway: 0 }).node,
        take.batter,
      ),
    });
  const standing: IAutoMovieComposition = HumanChain.subject(
    "batter",
  ).registered(holdBat.name, { hold: 0.4, sway: 0 }).node;
  const ballCentre = (
    take: HumanPerformance,
    seconds: number,
  ): IAutoMovieVector3 => {
    const frame: IAutoMovieRigidTransform = take.prop("ball", seconds);
    return Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, centre),
    );
  };

  // The pitch-only take's plate crossing times the swing.
  const pitchOnly: HumanPerformance = film({
    aim: contact,
    batter: standing,
    seed: "incoming-pitch",
    follow: 1,
  });
  const release: number = pitchOnly.instant({ of: "pitch", event: "release" });
  let early: number = release;
  let late: number = release + 1.5;
  for (let i: number = 0; i < 50; ++i) {
    const mid: number = (early + late) / 2;
    if (ballCentre(pitchOnly, mid).z > contact.z) early = mid;
    else late = mid;
  }
  const lead: number = late - release;

  // 1. The swung pitch is handed back to the bat at the strike.
  const started: number = performance.now();
  const hit: HumanPerformance = film({
    aim: contact,
    batter: HumanChain.subject("batter")
      .registered(holdBat.name, { hold: 0.4, sway: 0 })
      .registered(
        "baseballHit",
        {
          tool: "bat",
          ball: "ball",
          speed: 40,
          impact,
          target: {
            kind: "point",
            frame: "world",
            at: { x: contact.x, y: 0, z: 40 },
          },
        },
        "hit",
      )
      .sync({ of: "pitch", event: "release", offset: lead - impact }).node,
    seed: "incoming-hit",
    follow: lead + 0.3,
  });
  const flights: readonly IAutoMovieMotionHumanPropFlight.IFlight[] =
    hit.flights("ball");
  const elapsed: number = performance.now() - started;
  const pitched: IAutoMovieMotionHumanPropFlight.IFlight | undefined =
    flights[0];
  const batted: IAutoMovieMotionHumanPropFlight.IFlight | undefined =
    flights[1];
  TestValidator.predicate(
    "the pitch ends at the batter's launch without a contact of its own",
    flights.length === 2 &&
      pitched?.source.subject === "pitcher" &&
      batted?.source.subject === "batter" &&
      pitched.contact === undefined &&
      (pitched.legs ?? []).length === 0 &&
      pitched.supersededAt === batted.launch,
  );
  TestValidator.predicate(
    "the bat's strike point is on the pitched ball's surface at the batter's launch",
    batted !== undefined &&
      nclose(batted.launch, release + lead, 2e-3) &&
      Math.abs(
        Vector3.distance(
          strikeAt(hit.prop("bat", batted.launch)),
          ballCentre(hit, batted.launch),
        ) - radius,
      ) <= Math.min(0.012, 0.2 * radius),
  );
  TestValidator.predicate(
    `the stroke on the incoming ball resolves within ${bound / 1000} s (took ${(elapsed / 1000).toFixed(1)} s)`,
    elapsed <= bound,
  );

  // 2. A bat held still stays a collider for the pitch aimed at it.
  const struck: HumanPerformance = film({
    aim: strikeAt(batAt),
    batter: standing,
    seed: "incoming-held-bat",
    follow: 1,
  });
  const meeting: IAutoMovieMotionHumanPropFlight.IContact | undefined =
    struck.flights("ball")[0]?.contact;
  TestValidator.predicate(
    "a pitch at a bat held still, with no later launch, meets that bat",
    meeting?.struck.kind === "prop" && meeting.struck.subject === "bat",
  );
}
