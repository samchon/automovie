import {
  createBall,
  createBowlingLane,
  createBowlingPin,
  createCricketWicket,
  createCueTable,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanStand,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStance,
  AutoMovieMotionHumanThrowCatch,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";

/**
 * Precision deliveries release their held sphere and aim at individually placeable equipment.
 *
 * Scenarios:
 * 1. Fastpitch softball carries the ball overhead before releasing it below the windup apex.
 * 2. Ten-pin bowling carries the ball to one low underhand release toward the lane.
 * 3. Wicket components, regulation pin spots, and pool pocket mouths are distinct scene targets.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the two release styles, the held-sphere handoff and the published equipment targets.
 * @evidence contracts/development/testing.md#behavioral-verification Installs the original lexicon rows in public performances and reads displayed ball frames, launch acquisition and scene affordances.
 * @evidence contracts/development/testing.md#independent-expectations The apex observation is in displayed metres, and the bowling head-pin distance, adjacent pin spacing and cricket wicket width use their governing rule dimensions.
 * @evidence contracts/development/testing.md#distinguishing-cases Compares the softball apex against its own release, checks bowling departure independently, and separates all five wicket and six table targets.
 * @evidence contracts/development/testing.md#execution-ownership Constructs one ready pose, two isolated in-memory performances and three fixtures plus a separate pin. No external hosts.
 */
export function test_motion_swing_precision_delivery(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const start: IAutoMovieVector3 = { x: 0, y: 0, z: -1 };
  const performers: IAutoMovieMotionHumanPerformance.IInput["performers"] = [
    {
      subject: "player",
      body,
      at: start,
      yaw: 0,
      proficiency: { level: "trained" },
    },
  ];
  const ready: HumanPerformance = new HumanPerformance({
    seed: "790",
    performers,
    composition: HumanChain.subject("player").stand({ hold: 0.2, sway: 0 })
      .node,
  });
  const grip: IAutoMovieVector3 = HumanHand.frame(
    body,
    ready.bones("player", 0),
    "right",
    "grip",
  ).point;
  const hold: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStand.IParams> =
    {
      ...AutoMovieMotionHumanStance.stand,
      name: "deliveryFixtureHold",
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStand.IParams>,
      ): IAutoMovieMotionHumanActionPlan => ({
        ...AutoMovieMotionHumanStance.stand.plan(context),
        holds: [{ side: "right", prop: "ball", from: 0 }],
      }),
    };
  for (const [kind, row, to] of [
    [
      "softball",
      AutoMovieMotionHumanThrowCatch.HumanSportThrow.softballWindmill,
      { x: 0, y: 0.75, z: 5 },
    ],
    [
      "bowling",
      AutoMovieMotionHumanThrowCatch.HumanSportThrow.bowlingDelivery,
      { x: 0, y: 0.11, z: 2 },
    ],
  ] as const) {
    const ball: ReturnType<typeof createBall> = createBall({ kind });
    const ballGrip: IAutoMovieVector3 =
      ball.affordance("grip").frame.translation;
    const film: HumanPerformance = new HumanPerformance({
      seed: kind,
      laws: [hold, row],
      performers,
      props: [
        HumanObject.prop("ball", ball, {
          position: Vector3.subtract(grip, ballGrip),
          rotation: Quaternion.identity(),
        }),
      ],
      composition: HumanChain.subject("player")
        .registered(hold.name, { hold: 0.2, sway: 0 })
        .registered(row.name, {
          prop: "ball",
          target: { kind: "point", frame: "world", at: to },
        }).node,
    });
    const act: IAutoMovieMotionHumanSegment = film.segments("player")[1]!;
    const release: number =
      act.start +
      act.plan.events.find((event): boolean => event.name === "release")!
        .share *
        act.plan.duration;
    TestValidator.predicate(
      `${kind} leaves one flight at the release event`,
      film.flights("ball").length === 1 &&
        nclose(film.flights("ball")[0]!.launch, release),
    );
    const before: IAutoMovieVector3 = film.prop(
      "ball",
      release - 1e-4,
    ).position;
    const releaseFrame: IAutoMovieRigidTransform = film.prop("ball", release);
    const launched: IAutoMovieVector3 = releaseFrame.position;
    const after: IAutoMovieVector3 = film.prop("ball", release + 0.02).position;
    TestValidator.predicate(
      `${kind} maintains position through release`,
      Vector3.distance(before, launched) < 0.015,
    );
    TestValidator.predicate(
      `${kind} departs toward the marked target`,
      after.z - launched.z > 0.02,
    );
    if (kind === "softball") {
      const apex: number =
        act.start +
        act.plan.events.find((event): boolean => event.name === "windmillApex")!
          .share *
          act.plan.duration;
      TestValidator.predicate(
        "the carried softball rises through a distinct overhead windup",
        apex < release &&
          film.prop("ball", apex).position.y - launched.y > 0.35,
      );
    } else {
      const centre: IAutoMovieVector3 = Vector3.add(
        launched,
        Quaternion.rotateVector(releaseFrame.rotation, ballGrip),
      );
      TestValidator.predicate(
        "the bowling ball leaves below the hand's standing grip height",
        centre.y < grip.y,
      );
    }
  }

  const lane: ReturnType<typeof createBowlingLane> = createBowlingLane();
  const head: IAutoMovieVector3 = lane.affordance("pin1").frame.translation;
  TestValidator.predicate(
    "60 ft from the foul line to the head pin",
    nclose(head.z - lane.affordance("foulLine").frame.translation.z, 18.288),
  );
  for (const id of ["pin2", "pin3"] as const)
    TestValidator.predicate(
      `${id} is 12 in from the head pin`,
      nclose(
        Vector3.distance(lane.affordance(id).frame.translation, head),
        0.3048,
      ),
    );
  const pin: ReturnType<typeof createBowlingPin> = createBowlingPin();
  TestValidator.predicate(
    "the pin has its own ground origin and widest station",
    nclose(pin.affordance("base").frame.translation.y, 0) &&
      nclose(pin.affordance("belly").frame.translation.y, 0.1143),
  );
  const wicket: ReturnType<typeof createCricketWicket> = createCricketWicket();
  const centres: number = Math.abs(
    wicket.affordance("rightStump").frame.translation.x -
      wicket.affordance("leftStump").frame.translation.x,
  );
  TestValidator.predicate(
    "the stump outside width is 9 in",
    nclose(centres + wicket.dimensions.diameter!, 0.2286),
  );
  TestValidator.predicate(
    "the bails are individually targetable",
    Vector3.distance(
      wicket.affordance("leftBail").frame.translation,
      wicket.affordance("rightBail").frame.translation,
    ) > 0.08,
  );
  const table: ReturnType<typeof createCueTable> = createCueTable();
  const mouthIds = [
    "headLeftPocket",
    "headRightPocket",
    "leftPocket",
    "rightPocket",
    "footLeftPocket",
    "footRightPocket",
  ] as const;
  const mouths: IAutoMovieVector3[] = mouthIds.map(
    (id: (typeof mouthIds)[number]): IAutoMovieVector3 =>
      table.affordance(id).frame.translation,
  );
  TestValidator.predicate(
    "six distinct pocket mouths share the bed height",
    new Set(
      mouths.map((mouth: IAutoMovieVector3): string => `${mouth.x},${mouth.z}`),
    ).size === 6 &&
      mouths.every((mouth: IAutoMovieVector3): boolean =>
        nclose(mouth.y, table.affordance("bed").frame.translation.y),
      ),
  );
}
