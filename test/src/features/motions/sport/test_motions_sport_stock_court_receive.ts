import {
  AutoMovieArchetypeBasketballHoop,
  AutoMovieArchetypeSphericalBall,
} from "@automovie/archetypes";
import {
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanProp,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanChain,
  AutoMovieMotionHumanPerformance,
  AutoMovieMotionHumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";
import { qclose } from "../../internal/qclose";
import { vclose } from "../../internal/vclose";

/**
 * A short stock chest pass gives a two-handed receiver physical ball custody.
 *
 * Scenarios:
 *
 * 1. A staged receive takes the live flight at its 0.4 s interception.
 * 2. Both grips close on the ball and retain it through the following stand.
 * 3. The independent defender's declaration order leaves the flight and sampled
 *    ball frames unchanged.
 * 4. The receiver uses that custody for a set shot. The ball crosses the hoop's
 *    open bore on its way down and bounces on the floor afterwards.
 * 5. A sliding defender's raised hand deflects the native pass in either
 *    declaration order. The receiver cannot take custody along the old path.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the physical receive, hold, independent order and scored flight cases.
 * @evidence contracts/development/testing.md#behavioral-verification Resolves public performances from the same stock ball, bodies and chains. Reads native flight, custody and frame records, then checks the stock hoop and floor in the shot's own branch.
 * @evidence contracts/development/testing.md#independent-expectations The authored 0.4 s intercept fixes custody relative to release. The independent defender stays clear of the ball's route. The hoop's dimensions and the ball's own physical sphere give the usable aperture independently of the shot's displayed location.
 */
export async function test_motions_sport_stock_court_receive(): Promise<void> {
  const body = await humanFixtureBody("m-average");
  const model = AutoMovieArchetypeSphericalBall.create({
    id: "ball",
    kind: "basketball",
  });
  const ball: IAutoMovieMotionHumanProp = {
    subject: "ball",
    frame: {
      position: { x: -0.26, y: 0.96 - model.dimensions.diameter! / 2, z: 0.42 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
    points: {},
    affordances: model.affordances,
    shapes: model.shapes(),
    body: model.body,
  };
  const cast = (
    subject: string,
    x: number,
    z: number,
    yaw: number,
  ): IAutoMovieMotionHumanPerformer => ({
    subject,
    body,
    at: { x, y: 0, z },
    yaw,
    proficiency: { level: "elite" },
  });
  const performers: IAutoMovieMotionHumanPerformer[] = [
    cast("passer", 0, 0, 0),
    cast("receiver", 0, 1.57, 180),
    cast("defender", 2, 0, 0),
  ];
  const pass = AutoMovieMotionHumanChain.subject("passer")
    .pickUp({ prop: "ball", handle: "grip", lift: 0 }, "pickup")
    .stand({ hold: 0.25 }, "gather")
    .ballSport(
      {
        kind: "chestPass",
        prop: "ball",
        at: { x: 0, y: 1.33, z: 1.14 },
        flightSeconds: 0.4,
      },
      "pass",
    )
    .stand({ hold: 0.1 });
  const receive = AutoMovieMotionHumanChain.subject("receiver")
    .stageCatch(
      { partner: "pass", ball: "ball", hands: "two", intercept: 0.4 },
      "receipt",
    )
    .stand({ hold: 0.1 });
  const defend = AutoMovieMotionHumanChain.subject("defender")
    .stand({ hold: 0.1 })
    .walk(
      {
        to: { x: 2.5, y: 0, z: 0.8 },
        facing: { toward: { x: 0, y: 0, z: 2.8 } },
        manner: { pace: 1.34 },
      },
      "slide",
    );

  const samples: IAutoMovieRigidTransform[][] = [];
  for (const parts of [
    [defend, receive],
    [receive, defend],
  ]) {
    const take: AutoMovieMotionHumanPerformance =
      new AutoMovieMotionHumanPerformance({
        seed: "court-witness",
        performers,
        props: [ball],
        composition: pass.with(...parts).node,
      });
    const flights = take.flights("ball");
    TestValidator.equals("one native ball flight", flights.length, 1);
    const flight = flights[0]!;
    const catchSegment = take.segments("receiver")[0]!;
    const at = (name: string): number =>
      catchSegment.start +
      catchSegment.plan.events.find((event) => event.name === name)!.share *
        catchSegment.plan.duration;
    const contact: number = at("contact");
    const secured: number = at("secured");
    TestValidator.predicate(
      "the native flight reaches the planned interception and takes custody",
      nclose(contact - flight.launch, 0.4, 1e-10) &&
        flight.capturedAt === contact &&
        flight.contact === undefined &&
        secured > contact,
    );
    const holds = catchSegment.plan.holds ?? [];
    TestValidator.predicate(
      "both hands reserve this same realized ball flight",
      holds.length === 2 &&
        holds[0]!.side !== holds[1]!.side &&
        holds.every(
          ({ prop, capture }) =>
            prop === "ball" && capture?.launch === flight.published,
        ),
    );
    const custody = take
      .play("ball")
      .events.find(
        (event) => event.kind === "hold" && event.subject === "receiver",
      );
    TestValidator.predicate(
      "the caught ball stays with the receiver through the following stand",
      custody?.kind === "hold" &&
        custody.caught &&
        custody.hands.length === 2 &&
        nclose(custody.from, contact, 1e-10) &&
        custody.to >= take.duration - 1e-10,
    );
    samples.push(
      [flight.launch, contact - 0.01, contact, secured, take.duration].map(
        (seconds: number): IAutoMovieRigidTransform =>
          take.prop("ball", seconds),
      ),
    );
  }
  TestValidator.predicate(
    "declaring the independent defender earlier preserves the observed ball frames",
    samples[0]!.every(
      (frame: IAutoMovieRigidTransform, index: number): boolean => {
        const other: IAutoMovieRigidTransform = samples[1]![index]!;
        return (
          vclose(frame.position, other.position, 1e-10) &&
          qclose(frame.rotation, other.rotation, 1e-10)
        );
      },
    ),
  );

  const blocker = AutoMovieMotionHumanChain.subject("defender")
    .walk(
      {
        to: { x: 0.25, y: 0, z: 1.02 },
        pace: "fast",
        facing: { yaw: 180 },
        manner: { pace: 1.36 },
      },
      "slide",
    )
    .ballSport(
      {
        kind: "highHandContest",
        at: { x: 0, y: 1.85, z: 0.2 },
        manner: { pace: 1.2 },
      },
      "contest",
    )
    .stand({ hold: 0.5 }, "recover");
  const observing = AutoMovieMotionHumanChain.subject("receiver").stand(
    { hold: 3 },
    "target",
  );
  const crowded = [
    ...performers.slice(0, 2),
    cast("defender", 0.75, 1.02, 180),
  ];
  const blockedTake = (
    receiver: typeof observing,
    receiverFirst: boolean,
  ): AutoMovieMotionHumanPerformance =>
    new AutoMovieMotionHumanPerformance({
      seed: "court-witness",
      performers: crowded,
      props: [ball],
      composition: pass.with(
        ...(receiverFirst ? [receiver, blocker] : [blocker, receiver]),
      ).node,
    });

  const blocked = blockedTake(observing, false);
  const reordered = blockedTake(observing, true);
  const strike = blocked.flights("ball")[0]!;
  const secondStrike = reordered.flights("ball")[0]!;
  const struck = strike.contact?.struck;
  TestValidator.predicate(
    "the slide into the contest puts the defender's hand on the pass",
    struck?.kind === "person" &&
      struck.subject === "defender" &&
      struck.bone === "leftRingDistal" &&
      strike.end < strike.launch + 0.4,
  );
  TestValidator.equals(
    "declaration order preserves the actual release and deflection",
    [secondStrike.launch, secondStrike.end, secondStrike.contact?.struck],
    [strike.launch, strike.end, strike.contact?.struck],
  );
  for (const seconds of [0.1, 0.2, 0.3])
    TestValidator.predicate(
      "the sampled deflected route keeps its film position in either declaration order",
      vclose(
        blocked.prop("ball", strike.launch + seconds).position,
        reordered.prop("ball", strike.launch + seconds).position,
        1e-10,
      ),
    );
  for (const receiverFirst of [false, true])
    assert.throws(
      () => blockedTake(receive, receiverFirst),
      (error) =>
        error instanceof AutoMovieMotionHumanRefusal &&
        error.performer === "receiver" &&
        error.act === "stageCatch",
    );

  const hoop = AutoMovieArchetypeBasketballHoop.create({
    id: "hoop",
    ring: 0.45,
    height: 3.05,
  });
  const hoopPosition: IAutoMovieVector3 = { x: 0, y: 0, z: -1.5 };
  const rim: IAutoMovieVector3 = {
    x: 0,
    y: hoop.dimensions.height! - hoop.dimensions.bar! / 2,
    z: hoopPosition.z + hoop.dimensions.offset! + hoop.dimensions.ring! / 2,
  };
  const hoopProp: IAutoMovieMotionHumanProp = {
    subject: "hoop",
    frame: {
      position: hoopPosition,
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
    points: {},
    fixed: true,
    shapes: hoop.shapes(),
    affordances: hoop.affordances,
    body: hoop.body,
  };
  const shooting = receive
    .ballSport(
      {
        kind: "setShot",
        prop: "ball",
        at: rim,
        flightSeconds: 1.05,
      },
      "shot",
    )
    .stand({ hold: 1.3 });
  const scored = new AutoMovieMotionHumanPerformance({
    seed: "court-witness",
    performers: performers.slice(0, 2),
    props: [ball, hoopProp],
    composition: pass.with(shooting).node,
  });
  const flights = scored.flights("ball");
  TestValidator.equals(
    "pass and shot are two native flights",
    flights.length,
    2,
  );
  const shot = flights[1]!;
  const span = scored
    .play("ball")
    .events.find(
      (event) => event.kind === "hold" && event.subject === "receiver",
    );
  TestValidator.predicate(
    "the receiver holds the caught ball until releasing the shot",
    span?.kind === "hold" &&
      span.caught &&
      span.hands.length === 2 &&
      nclose(span.from, flights[0]!.capturedAt!, 1e-10) &&
      nclose(span.to, shot.launch, 1e-10),
  );
  const sphere = shot.published.sphere!;
  const centreAt = (seconds: number): IAutoMovieVector3 => {
    const frame: IAutoMovieRigidTransform = scored.prop("ball", seconds);
    return AutoMovieEngineVector3.add(
      frame.position,
      AutoMovieEngineQuaternion.rotateVector(frame.rotation, sphere.centre),
    );
  };
  const crossing: number = shot.launch + 1.05;
  const middle: IAutoMovieVector3 = centreAt(crossing);
  const clearance: number = hoop.dimensions.ring! / 2 - sphere.radius;
  TestValidator.predicate(
    "the ball descends through the open ring before its first bounce",
    centreAt(crossing - 0.01).y > rim.y &&
      centreAt(crossing + 0.01).y < rim.y &&
      nclose(middle.y, rim.y, 1e-10) &&
      Math.hypot(middle.x - rim.x, middle.z - rim.z) < clearance &&
      shot.end > crossing &&
      shot.contact?.struck.kind === "ground" &&
      shot.contact.outcome === "bounce",
  );
}
