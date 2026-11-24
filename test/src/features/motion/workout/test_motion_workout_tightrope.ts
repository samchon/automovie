import { createBalancePole, createTightrope } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAcrobatics,
  AutoMovieMotionHumanWorkout,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";

/** The wire's span and height, metres. */
const SPAN: number = 8;
const HEIGHT: number = 1;

/** The sag walked on, metres. */
const SAG: number = 0.15;

/**
 * Walk a sagging tightrope with a balancing pole (#3997's tightrope).
 *
 * Scenarios, on two body proportions:
 *
 * 1. Every footfall's sole lies on the wire within half a foot's width across it,
 *    and at the sag's height there within 10 mm.
 * 2. The hips stay over the wire within the sway band.
 * 3. The pole stays in both hands: both grips are held the whole walk and each
 *    hand stays within 120 mm of its grip.
 * 4. A sag too shallow for the span is refused on `sag` with the least sag.
 * 5. The take passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each rule and bound.
 * @evidence contracts/development/testing.md#behavioral-verification Plans the line-walk row on a tightrope with a pole through the public chain and reads the displayed feet, hips, hands and pole.
 * @evidence contracts/development/testing.md#independent-expectations The sag's parabola and the tension `W L / (4 sag)` are closed forms of the span and the body's mass.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies and a too-shallow sag.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on the shared Human fixture.
 */
export function test_motion_workout_tightrope(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["f-small", "m-average"] as const) {
    try {
      const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
      const film: HumanPerformance = take(body, SAG);
      const walk: IAutoMovieMotionHumanSegment = film.segments("a")[0]!;
      const ankle: number = body.rest.get("leftFoot")!.y;
      let across: number = 0;
      let high: number = 0;
      for (const c of walk.plan.contacts) {
        if (c.kind !== "plant" || c.from === 0) continue;
        const side: AutoMovieHumanSide =
          c.part === "leftFoot" ? "left" : "right";
        const t: number = walk.start + c.from * walk.plan.duration + 1e-3;
        const foot: IAutoMovieResolvedBone = film
          .bones("a", t)
          .get(`${side}Foot`)!;
        const sole: IAutoMovieVector3 = HumanFoot.point(body, side, "sole", {
          ankle: foot.worldPosition,
          rotation: foot.worldRotation,
        });
        const u: number = (sole.x + SPAN / 2) / SPAN;
        across = Math.max(across, Math.abs(sole.z));
        high = Math.max(
          high,
          Math.abs(
            foot.worldPosition.y - (HEIGHT + ankle - 4 * SAG * u * (1 - u)),
          ),
        );
      }
      let sway: number = 0;
      let slip: number = 0;
      for (let t: number = walk.start; t <= walk.end; t += 0.05) {
        sway = Math.max(
          sway,
          Math.abs(film.bones("a", t).get("hips")!.worldPosition.z),
        );
        const pole: IAutoMovieRigidTransform = film.prop("pole", t);
        for (const [side, hand] of [
          ["left", "leftHand"],
          ["right", "rightHand"],
        ] as const) {
          const grip: IAutoMovieVector3 = Vector3.add(
            pole.position,
            Quaternion.rotateVector(pole.rotation, {
              x: (side === "left" ? 1 : -1) * 0.3,
              y: 0,
              z: 0,
            }),
          );
          slip = Math.max(
            slip,
            Vector3.distance(grip, film.bones("a", t).get(hand)!.worldPosition),
          );
        }
      }
      const held: boolean = (["leftHand", "rightHand"] as const).every(
        (part: IAutoMovieMotionHumanContactWindow["part"]): boolean =>
          walk.plan.contacts.some(
            (c: IAutoMovieMotionHumanContactWindow): boolean =>
              c.part === part &&
              c.kind === "grip" &&
              c.from === 0 &&
              c.to === 1,
          ),
      );
      checks.check(
        `${name} walks the wire (${(across * 1000).toFixed(0)} mm across, ${(high * 1000).toFixed(0)} mm off the sag), over it (${(sway * 1000).toFixed(0)} mm), pole in hand (${(slip * 1000).toFixed(0)} mm)`,
        across <= 0.05 &&
          high <= 0.01 &&
          sway <=
            AutoMovieMotionHumanWorkout.lineWalk.SWAY * body.measure.stature +
              0.001 &&
          held &&
          slip <= 0.12,
      );
      verdict(checks, `${name} tightrope`, film);
    } catch (error: unknown) {
      checks.check(`${String(name)}: ${everydayTake.describe(error)}`, false);
    }
  }

  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  let refused: HumanRefusal | undefined;
  try {
    take(body, 0.03);
  } catch (error) {
    if (!(error instanceof HumanRefusal)) throw error;
    refused = error;
  }
  checks.check(
    "a sag too shallow for the span is refused with the least sag",
    refused?.axis === "sag" &&
      refused.feasible?.kind === "range" &&
      refused.feasible.minimum !== null &&
      refused.feasible.minimum > 0.03,
  );
  checks.assert("workout tightrope");
}

/** A walker on the wire's left end holding the pole, walking along it. */
function take(body: IAutoMovieMotionHumanBody, sag: number): HumanPerformance {
  const start: number = -SPAN / 2 + 0.5;
  return new HumanPerformance({
    seed: "tightrope",
    laws: [AutoMovieMotionHumanAcrobatics.HumanGymnastics.lineWalk],
    performers: [
      {
        subject: "a",
        body,
        at: { x: start, y: HEIGHT, z: 0 },
        yaw: 90,
        proficiency: { level: "trained" },
      },
    ],
    props: [
      HumanObject.prop(
        "rope",
        createTightrope({ span: SPAN, height: HEIGHT }),
        { at: { x: 0, y: 0, z: 0 }, yaw: 0 },
      ),
      HumanObject.prop("pole", createBalancePole({ grip: 0.6 }), {
        at: { x: start + 0.3, y: HEIGHT + 0.55 * body.measure.stature, z: 0 },
        yaw: 90,
      }),
    ],
    composition: HumanChain.subject("a").registered("lineWalk", {
      on: { prop: "rope", affordance: "bar" },
      to: { x: SPAN / 2 - 1.5, y: HEIGHT, z: 0 },
      pole: "pole",
      sag,
    }).node,
  });
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
