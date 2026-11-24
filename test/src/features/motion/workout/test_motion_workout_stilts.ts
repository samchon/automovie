import { createStilt } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAcrobatics,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";

/** The stilts' platform height, metres. */
const HEIGHT: number = 0.6;

/**
 * Walk on stilts and stand still by stepping in place (#3997's stilts).
 *
 * Scenarios, on two body proportions:
 *
 * 1. The stilt tips are the only floor contacts: no displayed foot comes below the
 *    platforms' height less 10 mm, and every stilt's tip is on the floor within
 *    10 mm while its foot bears.
 * 2. The strapped stilts stay fixed to the feet: each stilt keeps its offset from
 *    its foot within 10 mm throughout.
 * 3. A walk to a stop ends within a step of it, and a stop where the walker stands
 *    steps in place within 50 mm.
 * 4. A walker off the platforms is refused on `stilts`.
 * 5. Each take passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each rule and bound.
 * @evidence contracts/development/testing.md#behavioral-verification Plans the stilts row through the public chain and reads the displayed feet and the stilts' frames.
 * @evidence contracts/development/testing.md#independent-expectations The platform height and the tip are the archetype's; the step is the law's stated share of the hip height.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies, a walk, a stand in place and an entry off the stilts.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on the shared Human fixture.
 */
export function test_motion_workout_stilts(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["f-small", "m-average"] as const) {
    try {
      const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
      const half: number = Math.abs(body.rest.get("leftUpperLeg")!.x);
      for (const stop of [1.2, 0] as const) {
        const film: HumanPerformance = take(body, half, stop, HEIGHT);
        const walk: IAutoMovieMotionHumanSegment = film.segments("a")[0]!;
        const ankle: number = body.rest.get("leftFoot")!.y;
        let low: number = Infinity;
        let strap: number = 0;
        const offset: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
          left: relative(film, "left", walk.start),
          right: relative(film, "right", walk.start),
        };
        for (let t: number = walk.start; t <= walk.end; t += 1 / 24)
          for (const side of ["left", "right"] as const) {
            low = Math.min(
              low,
              film.bones("a", t).get(`${side}Foot`)!.worldPosition.y - ankle,
            );
            strap = Math.max(
              strap,
              Vector3.distance(relative(film, side, t), offset[side]),
            );
          }
        let tip: number = 0;
        for (const c of walk.plan.contacts) {
          if (c.kind !== "plant") continue;
          const side: AutoMovieHumanSide =
            c.part === "leftFoot" ? "left" : "right";
          const t: number =
            walk.start + 0.5 * (c.from + c.to) * walk.plan.duration;
          tip = Math.max(tip, Math.abs(film.prop(side, t).position.y));
        }
        const end: IAutoMovieVector3 = film
          .bones("a", walk.end)
          .get("hips")!.worldPosition;
        checks.check(
          `${name} on stilts to ${stop} m: feet above the platforms (${((low - HEIGHT) * 1000).toFixed(0)} mm), tips down (${(tip * 1000).toFixed(0)} mm), straps fast (${(strap * 1000).toFixed(0)} mm), stopping at ${end.z.toFixed(2)} m`,
          low >= HEIGHT - 0.01 &&
            tip <= 0.01 &&
            strap <= 0.01 &&
            Math.abs(end.z - stop) <=
              (stop === 0 ? 0.05 : 0.35 * body.measure.hipHeight),
        );
        verdict(checks, `${name} stilts to ${stop} m`, film);
      }
    } catch (error: unknown) {
      checks.check(`${String(name)}: ${everydayTake.describe(error)}`, false);
    }
  }

  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  let refused: HumanRefusal | undefined;
  try {
    take(body, Math.abs(body.rest.get("leftUpperLeg")!.x), 1, 0);
  } catch (error) {
    if (!(error instanceof HumanRefusal)) throw error;
    refused = error;
  }
  checks.check(
    "a walker off the stilts is refused",
    refused?.axis === "stilts",
  );
  checks.assert("workout stilts");
}

/** A walker standing on two stilts at the origin, facing +Z, walking to a stop. */
function take(
  body: IAutoMovieMotionHumanBody,
  half: number,
  stop: number,
  standOn: number,
): HumanPerformance {
  return new HumanPerformance({
    seed: "stilts",
    laws: [AutoMovieMotionHumanAcrobatics.HumanGymnastics.stilts],
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: standOn, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    props: (["left", "right"] as const).map(
      (side: AutoMovieHumanSide): IAutoMovieMotionHumanProp =>
        HumanObject.prop(side, createStilt({ height: HEIGHT }), {
          at: { x: side === "left" ? half : -half, y: 0, z: 0.03 },
          yaw: 0,
        }),
    ),
    composition: HumanChain.subject("a").registered("stilts", {
      stilts: { left: "left", right: "right" },
      to: { x: 0, y: 0, z: stop },
    }).node,
  });
}

/** A stilt's origin in its foot's frame. */
function relative(
  film: HumanPerformance,
  side: AutoMovieHumanSide,
  time: number,
): IAutoMovieVector3 {
  const foot: IAutoMovieResolvedBone = film
    .bones("a", time)
    .get(side === "left" ? "leftFoot" : "rightFoot")!;
  const stilt: IAutoMovieRigidTransform = film.prop(side, time);
  return Quaternion.rotateVector(
    Quaternion.inverse(foot.worldRotation),
    Vector3.subtract(stilt.position, foot.worldPosition),
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
