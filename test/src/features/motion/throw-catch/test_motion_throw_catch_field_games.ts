import { createBall, createStick } from "@automovie/archetypes";
import { Quaternion, Transform, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanThrowCatch,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
} from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../internal/motionHumanBody";
import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** The actor's field origin, in metres. */
const ORIGIN: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

/**
 * Exercise field actions lead from supported movement and tool or hand contact
 * to the named ball's displayed trajectory.
 *
 * Scenarios:
 *
 * 1. A standing football kick makes instep contact and launches the ball.
 * 2. A side-on player pushes a real puck from a low base. A square stance that
 *    cannot fit the blade refuses the same puck release.
 * 3. A rugby lateral and the two gridiron deliveries release across distinct lanes
 *    and heights.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each authored fixture and the inspected contact or release.
 * @evidence contracts/development/testing.md#behavioral-verification Samples FK, displayed prop frames and published flights from three registered action families.
 * @evidence contracts/development/testing.md#independent-expectations Computes the football's ballistic position from authored speed and gravity and reads stick contact from the model plane and disc radius. Pass checks use authored lanes and the lower snap pose relative to the quarterback.
 * @evidence contracts/development/testing.md#distinguishing-cases Samples the football before and after departure, contrasts a fitted ice blade with a square stance that misses despite nominal arm reach, and contrasts side, forward and rear delivery.
 * @evidence contracts/development/testing.md#execution-ownership Constructs in-memory performances using production archetypes, registered laws and a canonical Human body.
 */
export function test_motion_throw_catch_field_games(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const findings: string[] = [];
  for (const scenario of [kick, hockey, deliveries])
    try {
      scenario(body);
    } catch (error) {
      findings.push(`${scenario.name}: ${String(error)}`);
    }
  TestValidator.equals("field sports contacts and departures", findings, []);
}

/** Read a registered action's named cue in film seconds. */
function instant(segment: IAutoMovieMotionHumanSegment, name: string): number {
  const share: number | undefined = segment.plan.events.find(
    (event) => event.name === name,
  )?.share;
  if (share === undefined) throw new Error(`Missing ${name} cue`);
  return segment.start + share * segment.plan.duration;
}

/** Verify the ball and the two feet on the strike's displayed clock. */
function kick(body: IAutoMovieMotionHumanBody): void {
  const diameter: number = 0.22;
  const radius: number = diameter / 2;
  const foot: IAutoMovieVector3 = body.rest.get("rightFoot")!;
  const toe: number = foot.z + HumanFoot.offset(body, "right", "toe").z;
  const position: IAutoMovieVector3 = {
    x: foot.x,
    y: 0,
    z: toe + 0.15 + radius,
  };
  const speed: number = 2.4;
  const lift: number = 1;
  const performance: HumanPerformance = new HumanPerformance({
    seed: "exercise-field-kick",
    performers: [
      {
        subject: "player",
        body,
        at: ORIGIN,
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    laws: [AutoMovieMotionHumanThrowCatch.HumanSportThrow.kickRight],
    props: [
      HumanObject.prop("ball", createBall({ kind: "football", diameter }), {
        at: position,
        yaw: 0,
      }),
    ],
    composition: HumanChain.subject("player").registered("kickRight", {
      ball: "ball",
      speed,
      lift,
    }).node,
  });

  const stroke: number = instant(performance.segments("player")[0]!, "stroke");
  const step: number = 0.05;
  const centre: IAutoMovieVector3 = { ...position, y: radius };
  const instep: IAutoMovieVector3 = performance
    .bones("player", stroke)
    .get("rightToes")!.worldPosition;
  const plantBefore: IAutoMovieVector3 = performance
    .bones("player", stroke - step)
    .get("leftFoot")!.worldPosition;
  const plantAt: IAutoMovieVector3 = performance
    .bones("player", stroke)
    .get("leftFoot")!.worldPosition;
  // Existing kick case specifies a 15 mm instep gap and 5 mm plant-slip bound.
  TestValidator.predicate(
    "football instep contact",
    nclose(Vector3.distance(instep, centre), radius, 0.015),
  );
  TestValidator.predicate(
    "support foot stays planted at the stroke",
    vclose(plantBefore, plantAt, 0.005),
  );

  const flight = performance.flights("ball");
  TestValidator.equals("the same football starts one flight", flight.length, 1);
  TestValidator.predicate(
    "the ball leaves on the contact cue",
    nclose(flight[0]!.launch, stroke, 1e-6),
  );
  const expected: IAutoMovieVector3 = {
    x: position.x,
    y: position.y + lift * step - 0.5 * 9.80665 * step ** 2,
    z: position.z + speed * step,
  };
  TestValidator.predicate(
    "actual football after departure",
    vclose(performance.prop("ball", stroke + step).position, expected, 1e-5),
  );
  TestValidator.predicate(
    "backward seek still displays the pre-kick ball",
    vclose(performance.prop("ball", stroke - step).position, position, 1e-6),
  );
}

/** Check the real blade's displayed face against the puck's radial side. */
function hockey(body: IAutoMovieMotionHumanBody): void {
  const puck: ReturnType<typeof createBall> = createBall({ kind: "puck" });
  const stick: ReturnType<typeof createStick> = createStick({
    kind: "iceHockey",
  });
  const puckPosition: IAutoMovieVector3 = { x: 0, y: 0, z: 0.75 };
  const stickFrame: IAutoMovieRigidTransform = {
    position: { x: -0.16, y: 0, z: 0.51 },
    rotation: Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, -35),
  };
  const play = (
    at: IAutoMovieVector3,
    yaw: number,
    hand: AutoMovieHumanSide,
  ): HumanPerformance =>
    new HumanPerformance({
      seed: "exercise-hockey-puck",
      performers: [
        { subject: "player", body, at, yaw, proficiency: { level: "trained" } },
      ],
      laws: [AutoMovieMotionHumanThrowCatch.stickBall],
      props: [
        HumanObject.prop("puck", puck, { at: puckPosition, yaw: 0 }),
        HumanObject.prop("stick", stick, stickFrame),
      ],
      composition: HumanChain.subject("player")
        .crouch({ depth: "full", hold: 1 }, "low")
        .over((upper) =>
          upper
            .registered("stickBall", {
              kind: "iceHockey",
              stick: "stick",
              ball: "puck",
              speed: 3,
              hand,
              target: {
                kind: "point",
                frame: "world",
                at: { x: 0, y: 0.0125, z: 4 },
              },
            })
            .sync({ of: "low", event: "lowest" }),
        ).node,
    });

  // In this side-on crouch both grips stay in front of the torso.
  const performance: HumanPerformance = play(
    { x: 0.3, y: 0, z: 0.18 },
    -90,
    "left",
  );
  const stroke: number = instant(performance.overlays("player")[0]!, "stroke");
  const releasedStick: IAutoMovieRigidTransform = performance.prop(
    "stick",
    stroke,
  );
  const face: IAutoMovieTransform = stick.placed(
    "blade",
    Transform.of(releasedStick.position, releasedStick.rotation),
  );
  const normal: IAutoMovieVector3 = Quaternion.rotateVector(face.rotation, {
    x: 0,
    y: 1,
    z: 0,
  });
  const rim: IAutoMovieVector3 = { x: 0, y: 0.0125, z: puckPosition.z - 0.038 };
  const delta: IAutoMovieVector3 = Vector3.subtract(rim, face.translation);
  const gap: number = Math.abs(Vector3.dot(delta, normal));
  const blade = stick.affordances.find(
    (affordance) => affordance.id === "blade",
  )!;
  const across: number = Vector3.dot(
    delta,
    Quaternion.rotateVector(face.rotation, { x: 1, y: 0, z: 0 }),
  );
  const vertical: number = Vector3.dot(
    delta,
    Quaternion.rotateVector(face.rotation, { x: 0, y: 0, z: 1 }),
  );
  // Reuse the 15 mm ball-strike contact bound and require the actual face extent.
  TestValidator.predicate(
    `blade face meets the radial puck rim (normal gap ${(gap * 1000).toFixed(1)} mm, rim minus blade ${JSON.stringify(delta)} m, face coordinates ${across} m and ${vertical} m)`,
    gap <= 0.015 &&
      Math.abs(across) <= blade.width! / 2 &&
      Math.abs(vertical) <= blade.depth! / 2 &&
      normal.z > 0,
  );
  const flights = performance.flights("puck");
  TestValidator.equals("one named puck flight", flights.length, 1);
  TestValidator.predicate(
    "blade cue releases puck",
    nclose(flights[0]!.launch, stroke, 1e-6),
  );
  TestValidator.predicate(
    "the displayed puck moves down the play lane",
    performance.prop("puck", stroke + 0.035).position.z > puckPosition.z + 0.07,
  );

  // The square stance cleared the old arm-length check but swung the displayed
  // blade well clear of the puck while publishing a launch. Its hands are
  // now laid on the shaft as one planned course, so the miss is refused
  // where it starts: either no clear arm keeps a hand on its grip (`region`,
  // its value the millimetres past the region's disc), or the fitted blade
  // misses the rim (`stick`, past the 15 mm contact bound). Either way no
  // launch is published.
  let refusal: unknown;
  try {
    play(ORIGIN, 0, "right");
  } catch (error) {
    refusal = error;
  }
  TestValidator.predicate(
    `the square grip's fitted miss refuses the puck launch (${refusal instanceof Error ? refusal.message : "launched"})`,
    refusal instanceof HumanRefusal &&
      refusal.kind === "reach" &&
      typeof refusal.value === "number" &&
      ((refusal.axis === "stick" &&
        refusal.value > 0.015 &&
        refusal.feasible?.kind === "range" &&
        refusal.feasible.maximum === 0.015) ||
        (refusal.axis === "region" && refusal.value > 0)),
  );
}

/**
 * Check side, forward and rear deliveries and their different body support
 * geometry.
 */
function deliveries(body: IAutoMovieMotionHumanBody): void {
  const cases = [
    {
      name: "rugbyPass",
      kind: "rugby",
      law: AutoMovieMotionHumanThrowCatch.HumanSportThrow.rugbyPass,
      target: { x: 4, y: 1, z: -0.4 },
    },
    {
      name: "gridironPass",
      kind: "americanFootball",
      law: AutoMovieMotionHumanThrowCatch.HumanSportThrow.gridironPass,
      target: { x: 0, y: 1, z: 7 },
    },
    {
      name: "gridironSnap",
      kind: "americanFootball",
      law: AutoMovieMotionHumanThrowCatch.HumanSportThrow.gridironSnap,
      target: { x: 0, y: 0.9, z: -4 },
    },
  ] as const;
  const releases: { height: number; lean: number }[] = [];
  for (const sample of cases) {
    const performance: HumanPerformance = new HumanPerformance({
      seed: sample.name,
      performers: [
        {
          subject: "player",
          body,
          at: ORIGIN,
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      laws: [sample.law],
      props: [
        HumanObject.prop("ball", createBall({ kind: sample.kind }), {
          at: { x: -0.25, y: 0.9, z: 0.35 },
          yaw: 0,
        }),
      ],
      composition: HumanChain.subject("player")
        .pickUp({ prop: "ball", handle: "grip" })
        .registered(sample.name, {
          prop: "ball",
          target: { kind: "point", frame: "world", at: sample.target },
        }).node,
    });
    const release: number = instant(
      performance.segments("player").at(-1)!,
      "release",
    );
    const shown: IAutoMovieVector3 = performance.prop("ball", release).position;
    const next: IAutoMovieVector3 = performance.prop(
      "ball",
      release + 0.04,
    ).position;
    const travel: IAutoMovieVector3 = Vector3.subtract(next, shown);
    const toward: IAutoMovieVector3 = Vector3.subtract(sample.target, shown);
    const lateral: boolean = sample.name === "rugbyPass";
    const backsnap: boolean = sample.name === "gridironSnap";
    const reader = HumanSignature(performance, "player", body, 0);
    TestValidator.equals(
      `${sample.name} publishes one actual ball flight`,
      performance.flights("ball").length,
      1,
    );
    TestValidator.predicate(
      `${sample.name} departs on its declared lane`,
      Vector3.dot(travel, toward) > 0 &&
        (lateral
          ? travel.x > Math.abs(travel.z)
          : backsnap
            ? travel.z < 0
            : travel.z > 0),
    );
    TestValidator.predicate(
      `${sample.name} has grounded support at release`,
      HumanSignature.bears(reader, release, "left") ||
        HumanSignature.bears(reader, release, "right"),
    );
    releases.push({
      height: shown.y,
      lean: HumanSignature.trunk(reader, release),
    });
  }

  const quarterback = releases[1]!;
  const snap = releases[2]!;
  TestValidator.predicate(
    "the snap uses a lower release and a greater forward fold than the quarterback pass",
    snap.height < quarterback.height && snap.lean > quarterback.lean,
  );
}
