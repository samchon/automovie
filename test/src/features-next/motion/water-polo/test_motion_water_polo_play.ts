import {
  createWaterPoloBall,
  createWaterPoloGoal,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanAquatic,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropFlight,
  IAutoMovieMotionHumanWaterPolo,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanSwim,
  AutoMovieMotionHumanWaterPolo,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { vclose } from "../../../features/internal/vclose";

/** World height of the pool surface, metres. */
const WATER: number = 0;

/** Contact and continuity bound in metres: one centimetre of displayed geometry. */
const METRE: number = 0.01;

/** Goal placement: the mouth plane at z = 9 m, facing back up the field. */
const GOAL: IAutoMovieVector3 = { x: 0, y: WATER, z: 9 };

/** The shooter's catch point on the right of its body, above the water. */
const RECEIVE: IAutoMovieVector3 = { x: -0.4, y: WATER + 0.3, z: 4.15 };

/** A point inside the net behind the left post region, clear of the keeper. */
const CORNER: IAutoMovieVector3 = { x: 1, y: WATER + 0.55, z: 9.25 };

/** A point in front of the keeper's chest where a two-handed save is made. */
const SAVE: IAutoMovieVector3 = { x: 0, y: WATER + 0.3, z: 8.05 };

/** The three players of the play. */
type Subject = "passer" | "shooter" | "keeper";

/** How the shot ends. */
type Outcome = "goal" | "save";

/**
 * A water polo play joins a pass, a one-handed catch, a shot and the
 * goalkeeper on one ball and one film clock, all on eggbeater support.
 *
 * Scenarios:
 * 1. The passer releases the held ball to the shooter, whose staged catch
 *    takes custody of the same flight over its own eggbeater support.
 * 2. The shooter shoots the caught ball past the keeper into the fixed
 *    goal, and the goal rule credits the shooter when the whole ball has
 *    passed the mouth plane.
 * 3. A shot at the keeper is saved by the keeper's two-handed catch over its
 *    support: the keeper takes custody before the plane and no goal is credited.
 * 4. Every performer keeps the pelvis under and the head over the water, and
 *    reverse sampling returns the same ball frames.
 * 5. A goal that is not fixed in the scene refuses scoring.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the three players, the ball, the goal, the scenarios and the measurement bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Composes the registered aquatic and stageCatch laws through the public performance and reads displayed bones, ball frames, flights and the goal rule.
 * @evidence contracts/development/testing.md#independent-expectations World Aquatics fixes the mouth as 3 m by 0.9 m from the waterline, so a goal is the whole ball inside that rectangle behind the plane. Palm contact is the ball radius from its centre within 1 cm. The water plane bounds pelvis and head.
 * @evidence contracts/development/testing.md#distinguishing-cases A corner shot scores past the keeper, a shot at the keeper is caught and credited to nobody, the pass is never credited, and an unfixed goal refuses.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances of one body profile, two archetypes and the public motions API; no viewer.
 */
export function test_motion_water_polo_play(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const ball: ReturnType<typeof createWaterPoloBall> = createWaterPoloBall(
    { circumference: 0.7, mass: 0.42 },
    3,
  );
  const radius: number = 0.7 / (2 * Math.PI);
  const goal: IAutoMovieMotionHumanProp = HumanObject.prop(
    "goal",
    createWaterPoloGoal(),
    { at: GOAL, yaw: 180, fixed: true },
  );

  // Seat the ball at the passer's displayed grip before any hand moves.
  const performers: IAutoMovieMotionHumanPerformer[] = [
    performer(body, "passer", { x: -2.6, y: WATER, z: 3.95 }, 90),
    performer(body, "shooter", { x: 0, y: WATER, z: 4 }, 0),
    performer(body, "keeper", { x: 0, y: WATER, z: 8.4 }, 180),
  ];
  const hand: IAutoMovieVector3 = HumanHand.frame(
    body,
    stage(performers, [], "goal", undefined).bones("passer", 0),
    "right",
    "grip",
  ).point;
  const props: IAutoMovieMotionHumanProp[] = [
    HumanObject.prop("ball", ball, { at: hand, yaw: 0 }),
    goal,
  ];

  // The pass's own aimed flight time decides when the catch meets it.
  const pass: number = aimed(stage(performers, props, "goal", undefined), 0);
  const scored: HumanPerformance = stage(performers, props, "goal", pass);
  const shot: number = aimed(stage(performers, props, "save", pass), 1);
  const saved: HumanPerformance = stage(performers, props, "save", pass, shot);
  assertTakeClean("the play passes the generic audit", scored);

  const flights: readonly IAutoMovieMotionHumanPropFlight.IFlight[] =
    scored.flights("ball");
  TestValidator.predicate(
    "the pass and the shot fly the same ball, and the shooter captures the pass",
    flights.length === 2 &&
      flights[0]!.source.subject === "passer" &&
      flights[1]!.source.subject === "shooter" &&
      flights[0]!.capturedAt !== undefined &&
      flights[0]!.capturedAt <= flights[1]!.launch,
  );

  // The shooter's palm meets the ball at capture; the ball is continuous
  // through capture and the shot's release.
  const captured: number = flights[0]!.capturedAt!;
  const palm: IAutoMovieVector3 = HumanHand.frame(
    body,
    scored.bones("shooter", captured),
    "right",
    "palm",
  ).point;
  const centre: IAutoMovieVector3 = scored.prop("ball", captured).position;
  TestValidator.predicate(
    `the shooter's palm meets the ball surface at capture (${(Vector3.distance(palm, centre) - radius).toFixed(4)} m from the surface)`,
    Math.abs(Vector3.distance(palm, centre) - radius) < METRE,
  );
  for (const [label, seconds] of [
    ["capture", captured],
    ["release", flights[1]!.launch],
  ] as const)
    TestValidator.predicate(
      `the ball is continuous across the ${label}`,
      vclose(
        scored.prop("ball", seconds - 1e-4).position,
        scored.prop("ball", seconds + 1e-4).position,
        METRE,
      ),
    );

  // The goal rule credits the shooter once the whole ball has passed the
  // mouth plane inside the regulation rectangle.
  const goals: readonly IAutoMovieMotionHumanWaterPolo.ICue[] =
    AutoMovieMotionHumanWaterPolo.scoreGoal({
      film: scored,
      ball: "ball",
      goal,
    });
  const crossing: IAutoMovieVector3 | undefined =
    goals[0] === undefined ? undefined : mouthLocal(goals[0].center);
  TestValidator.predicate(
    "one goal is credited to the shooter with the whole ball inside the mouth",
    goals.length === 1 &&
      goals[0]!.scorer === "shooter" &&
      crossing !== undefined &&
      Math.abs(crossing.z + radius) < 1e-6 &&
      Math.abs(crossing.x) + radius <= 1.5 &&
      crossing.y >= radius &&
      crossing.y + radius <= 0.9,
  );

  // The keeper's catch takes the same shot before the plane.
  const save: readonly IAutoMovieMotionHumanPropFlight.IFlight[] =
    saved.flights("ball");
  TestValidator.predicate(
    "the keeper captures the shot in front of the goal and no goal is credited",
    save.length === 2 &&
      save[1]!.capturedAt !== undefined &&
      mouthLocal(saved.prop("ball", save[1]!.capturedAt).position).z > radius &&
      AutoMovieMotionHumanWaterPolo.scoreGoal({
        film: saved,
        ball: "ball",
        goal,
      }).length === 0,
  );

  // Eggbeater support: pelvis below and head above the surface throughout.
  for (const [label, film] of [
    ["goal", scored],
    ["save", saved],
  ] as const)
    for (const subject of ["passer", "shooter", "keeper"] as const) {
      let floating: boolean = true;
      for (let i: number = 0; i <= 48; ++i) {
        const bones: ReturnType<HumanPerformance["bones"]> = film.bones(
          subject,
          (film.duration * i) / 48,
        );
        floating &&=
          bones.get("hips")!.worldPosition.y < WATER &&
          bones.get("head")!.worldPosition.y > WATER;
      }
      TestValidator.predicate(
        `${subject} stays water-supported through the ${label} play`,
        floating,
      );
    }

  // Out-of-order sampling reads the same ball.
  const times: readonly number[] = [0.5, 1.7, 2.9, 3.8, scored.duration - 0.1];
  const forward: readonly IAutoMovieVector3[] = times.map(
    (t: number): IAutoMovieVector3 => scored.prop("ball", t).position,
  );
  TestValidator.predicate(
    "reverse sampling returns the same ball frames",
    [...times]
      .reverse()
      .every((t: number, i: number): boolean =>
        vclose(
          scored.prop("ball", t).position,
          forward[times.length - 1 - i]!,
          1e-9,
        ),
      ),
  );

  let refusal: unknown;
  try {
    AutoMovieMotionHumanWaterPolo.scoreGoal({
      film: scored,
      ball: "ball",
      goal: { ...goal, fixed: false },
    });
  } catch (error: unknown) {
    refusal = error;
  }
  TestValidator.predicate(
    "an unfixed goal cannot score",
    refusal instanceof HumanRefusal && refusal.axis === "goal",
  );
}

/** A trained performer at a water-level placement. */
function performer(
  body: IAutoMovieMotionHumanBody,
  subject: Subject,
  at: IAutoMovieVector3,
  yaw: number,
): IAutoMovieMotionHumanPerformer {
  return { subject, body, at, yaw, proficiency: { level: "trained" } };
}

/** The goal mouth's local coordinates of a world point: +Z into the field. */
function mouthLocal(point: IAutoMovieVector3): IAutoMovieVector3 {
  const frame: IAutoMovieRigidTransform = HumanObject.frame({
    at: GOAL,
    yaw: 180,
  });
  return Quaternion.rotateVector(
    Quaternion.inverse(frame.rotation),
    Vector3.subtract(point, frame.position),
  );
}

/** The aimed flight time of the film's indexed launch, seconds after release. */
function aimed(film: HumanPerformance, index: number): number {
  const seconds: number | undefined =
    film.flights("ball")[index]?.published.aim?.seconds;
  if (seconds === undefined)
    throw new Error(`launch ${index} of the ball publishes no aimed flight`);
  return seconds;
}

/**
 * Stage the play. Without a pass time only the passer acts with the ball;
 * with one the shooter catches and shoots; with a shot time the keeper
 * also catches the shot for the save.
 */
function stage(
  performers: readonly IAutoMovieMotionHumanPerformer[],
  props: readonly IAutoMovieMotionHumanProp[],
  outcome: Outcome,
  pass: number | undefined,
  shot?: number,
): HumanPerformance {
  const polo = (
    role: IAutoMovieMotionHumanAquatic.Role,
    at?: IAutoMovieVector3,
  ): IAutoMovieMotionHumanAquatic.IParams => ({
    kind: "waterPolo",
    water: WATER,
    role,
    ...(at === undefined || props.length === 0 ? {} : { prop: "ball", at }),
  });
  const side: AutoMovieHumanSide = "right";
  const passer: ReturnType<typeof HumanChain.subject> = HumanChain.subject(
    "passer",
  ).registered("aquatic", polo("attack", RECEIVE), "pass");
  const shooter: ReturnType<typeof HumanChain.subject> =
    pass === undefined
      ? HumanChain.subject("shooter").registered("aquatic", polo("defend"))
      : HumanChain.subject("shooter")
          .registered("aquatic", polo("defend"))
          .over((u: ReturnType<typeof HumanChain.subject>) =>
            u.registered("stageCatch", {
              partner: "pass",
              ball: "ball",
              hands: "one",
              hand: side,
              intercept: pass,
            }),
          )
          .registered(
            "aquatic",
            polo("attack", outcome === "save" ? SAVE : CORNER),
            "shot",
          );
  const keeper: ReturnType<typeof HumanChain.subject> =
    shot === undefined
      ? HumanChain.subject("keeper")
          .registered("aquatic", polo("keeper"))
          .registered("aquatic", polo("keeper"))
      : HumanChain.subject("keeper")
          .registered("aquatic", polo("keeper"))
          .registered("aquatic", polo("keeper"))
          .over((u: ReturnType<typeof HumanChain.subject>) =>
            u
              .registered("stageCatch", {
                partner: "shot",
                ball: "ball",
                hands: "two",
                intercept: shot,
              })
              .until({ event: "held" }),
          );
  return new HumanPerformance({
    seed: `water-polo-${outcome}`,
    laws: [
      AutoMovieMotionHumanSwim.aquatic,
    ],
    performers: [...performers],
    props: [...props],
    composition: {
      kind: "parallel",
      parts: [passer.node, shooter.node, keeper.node],
    },
  });
}
