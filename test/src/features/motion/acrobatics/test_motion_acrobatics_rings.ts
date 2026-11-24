import { createStillRings } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanWorkout,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";

/** How far a gripping hand may stand from its ring's grip, metres. */
const GRIP: number = 0.04;

/**
 * Pull-ups and a swing on still rings (#3875's rings), the two grips as one
 * support.
 *
 * Scenarios, on two body proportions:
 *
 * 1. Both hands bear on the rings' grips throughout each cycle (grip windows on
 *    the rings), each hand within 40 mm of its ring's grip.
 * 2. A swing passes under the rings and back, the hips moving at least 100 mm
 *    along the swing.
 * 3. An apparatus without the named bar is refused on `on`.
 * 4. Each take passes the shipped verdicts (torso clear of the rings and straps,
 *    contacts held, joints in range).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each rule and bound.
 * @evidence contracts/development/testing.md#behavioral-verification Plans the workout rows on still rings through the public chain and reads the displayed hands, hips and ring frames.
 * @evidence contracts/development/testing.md#independent-expectations The grips are the archetype's own affordances, read through the rings' displayed frame.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies, a pull-up and a swing, and a misnamed apparatus.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on the shared Human fixture.
 */
export function test_motion_acrobatics_rings(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  const rings: ReturnType<typeof createStillRings> = createStillRings();
  for (const name of ["f-small", "m-average"] as const) {
    try {
      const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
      for (const row of ["pullUp", "barSwing"] as const) {
        const film: HumanPerformance = take(body, rings, row, "leftGrip");
        const s: IAutoMovieMotionHumanSegment = film.segments("a")[0]!;
        const grips: readonly IAutoMovieMotionHumanContactWindow[] =
          s.plan.contacts.filter(
            (c: IAutoMovieMotionHumanContactWindow): boolean =>
              c.kind === "grip" &&
              c.support.kind === "prop" &&
              c.support.subject === "rings",
          );
        const held: IAutoMovieMotionHumanContactWindow = grips[0]!;
        let off: number = 0;
        let swept: number = 0;
        const first: IAutoMovieVector3 = film
          .bones("a", s.start + held.from * s.plan.duration + 0.05)
          .get("hips")!.worldPosition;
        for (
          let t: number = s.start + held.from * s.plan.duration + 0.05;
          t <= s.start + held.to * s.plan.duration - 0.05;
          t += 1 / 24
        ) {
          for (const side of ["left", "right"] as const) {
            const hand: IAutoMovieVector3 = film
              .bones("a", t)
              .get(side === "left" ? "leftHand" : "rightHand")!.worldPosition;
            off = Math.max(
              off,
              Vector3.distance(hand, grip(film, rings, side, t)) - 0.09,
            );
          }
          swept = Math.max(
            swept,
            Math.abs(film.bones("a", t).get("hips")!.worldPosition.z - first.z),
          );
        }
        checks.check(
          `${name} ${row} on the rings holds both grips (${grips.length} windows, ${(off * 1000).toFixed(0)} mm off)${row === "barSwing" ? `, swinging ${(swept * 1000).toFixed(0)} mm` : ""}`,
          grips.length >= 2 &&
            off <= GRIP &&
            (row !== "barSwing" || swept >= 0.1),
        );
        verdict(checks, `${name} ${row} on the rings`, film);
      }
    } catch (error: unknown) {
      checks.check(`${String(name)}: ${everydayTake.describe(error)}`, false);
    }
  }
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  let refused: HumanRefusal | undefined;
  try {
    take(body, rings, "pullUp", "bar");
  } catch (error) {
    if (!(error instanceof HumanRefusal)) throw error;
    refused = error;
  }
  checks.check(
    "an apparatus without the named bar is refused",
    refused?.axis === "on",
  );
  checks.assert("acrobatics rings");
}

/** The workout rows done on the rings. */
type Row = "pullUp" | "barSwing";

/** A gymnast standing under the rings doing a row on them. */
function take(
  body: IAutoMovieMotionHumanBody,
  rings: ReturnType<typeof createStillRings>,
  row: Row,
  affordance: string,
): HumanPerformance {
  return new HumanPerformance({
    seed: "rings",
    laws: [
      AutoMovieMotionHumanWorkout.HumanSportWorkout.pullUp,
      AutoMovieMotionHumanWorkout.HumanSportWorkout.barSwing,
    ],
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    props: [
      HumanObject.prop("rings", rings, { at: { x: 0, y: 0, z: 0 }, yaw: 0 }),
    ],
    composition: HumanChain.subject("a").registered(row, {
      count: row === "pullUp" ? 2 : 1,
      on: { prop: "rings", affordance, other: "rightGrip" },
    }).node,
  });
}

/** A ring's grip in the world at a film second. */
function grip(
  film: HumanPerformance,
  rings: ReturnType<typeof createStillRings>,
  side: AutoMovieHumanSide,
  time: number,
): IAutoMovieVector3 {
  const frame: IAutoMovieRigidTransform = film.prop("rings", time);
  const found: IAutoMovieAffordance = rings.affordance(
    side === "left" ? "leftGrip" : "rightGrip",
  );
  return Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, found.frame.translation),
  );
}

/** Gather a take's shipped verdicts as one check. */
function verdict(
  checks: motionComplaints.IGatherer,
  label: string,
  film: HumanPerformance,
): void {
  try {
    assertTakeClean(label, film);
  } catch (error: unknown) {
    checks.check(
      `${label}: ${error instanceof Error ? error.message : String(error)}`,
      false,
    );
  }
}
