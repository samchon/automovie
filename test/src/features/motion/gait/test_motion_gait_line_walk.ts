import { createBalanceBeam } from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
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

/** The planted-contact bound, metres (the campaign's 5 mm). */
const PLANT: number = 0.005;

/**
 * Walk heel to toe along a balance beam.
 *
 * Scenarios, on two body proportions:
 *
 * 1. Every footfall's sole lies on the beam's top: its middle within half the
 *    beam's width of the beam's line and its ankle at the ankle's standing
 *    height above the top within 10 mm.
 * 2. Each foot holds the ball it bears the line under within 5 mm while it bears
 *    (the law's heel rises about that ball), and the feet bear on the beam.
 * 3. The hips stay over the line within the sway band, and the walk stops within a
 *    foot's length of the authored point.
 * 4. A stop beyond the beam's end is refused on `to`, and a walk entered from the
 *    floor beside the beam is refused on `on`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the footfalls, the plants, the sway, the stop and the refusals with their bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Plans the walk through the public chain on a real beam and reads displayed feet and hips against the beam's own top.
 * @evidence contracts/development/testing.md#independent-expectations The beam's width, length and top are the archetype's; the 5 mm and 10 mm are the campaign's contact bounds; the sway band is the law's stated amplitude.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies, a stop off the beam and an entry off the beam.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on the shared Human fixture, without a render or external process.
 */
export function test_motion_gait_line_walk(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  const beam: ReturnType<typeof createBalanceBeam> = createBalanceBeam();
  const surface: ReturnType<typeof beam.affordance> =
    beam.affordance("surface");
  const top: number = surface.frame.translation.y;
  const width: number = surface.width!;
  const length: number = surface.depth!;
  for (const name of ["f-small", "m-average"] as const) {
    try {
      const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
      const stop: IAutoMovieVector3 = { x: 0, y: top, z: 1.2 };
      const film: HumanPerformance = take(
        body,
        beam,
        { x: 0, y: top, z: -1.5 },
        stop,
      );
      verdict(checks, "line walk", film);
      const walk: IAutoMovieMotionHumanSegment = film.segments("a")[0]!;
      const ankle: number = body.rest.get("leftFoot")!.y;

      // 1 and 2. Footfalls on the top, and planted.
      for (const c of walk.plan.contacts) {
        if (c.kind !== "plant") continue;
        const side: AutoMovieHumanSide =
          c.part === "leftFoot" ? "left" : "right";
        const from: number = walk.start + c.from * walk.plan.duration + 1e-3;
        const to: number = walk.start + c.to * walk.plan.duration - 1e-3;
        if (to <= from) continue;
        const sole: IAutoMovieVector3 = socket(film, body, from, side, "sole");
        const foot: IAutoMovieVector3 = film
          .bones("a", from)
          .get(`${side}Foot`)!.worldPosition;
        const slip: number = Vector3.distance(
          socket(film, body, from, side, "ball"),
          socket(film, body, to, side, "ball"),
        );
        checks.check(
          `${name} ${side} footfall at ${from.toFixed(2)} s on the beam (${(sole.x * 1000).toFixed(1)} mm across, ${((foot.y - top - ankle) * 1000).toFixed(1)} mm high, ${(slip * 1000).toFixed(1)} mm slip)`,
          (c.from === 0 || Math.abs(sole.x) <= width / 2) &&
            (c.from === 0 || Math.abs(foot.y - top - ankle) <= 0.01) &&
            slip <= PLANT &&
            c.support.kind === "prop" &&
            c.support.subject === "beam",
        );
      }

      // 3. Over the line, to the stop.
      let widest: number = 0;
      for (
        let t: number = walk.start;
        t <= walk.start + walk.plan.duration;
        t += 0.05
      )
        widest = Math.max(widest, Math.abs(hips(film, t).x));
      const end: IAutoMovieVector3 = hips(
        film,
        walk.start + walk.plan.duration,
      );
      checks.check(
        `${name} hips stay over the line (${(widest * 1000).toFixed(1)} mm) and stop at the point`,
        widest <=
          AutoMovieMotionHumanWorkout.lineWalk.SWAY * body.measure.stature +
            0.001 && Math.abs(end.z - stop.z) <= body.measure.footLength,
      );
    } catch (error: unknown) {
      checks.check(`${String(name)}: ${everydayTake.describe(error)}`, false);
    }
  }

  // 4. Refusals.
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const refusal: (
    at: IAutoMovieVector3,
    to: IAutoMovieVector3,
  ) => HumanRefusal | undefined = (
    at: IAutoMovieVector3,
    to: IAutoMovieVector3,
  ): HumanRefusal | undefined => {
    try {
      take(body, beam, at, to);
    } catch (error) {
      if (error instanceof HumanRefusal) return error;
      throw error;
    }
    return undefined;
  };
  checks.check(
    "a stop beyond the beam's end is refused",
    refusal({ x: 0, y: top, z: -1.5 }, { x: 0, y: top, z: length })?.axis ===
      "to",
  );
  checks.check(
    "a walk from the floor beside the beam is refused",
    refusal({ x: 0.6, y: 0, z: -1.5 }, { x: 0, y: top, z: 1 })?.axis === "on",
  );
  checks.assert("gait line walk");
}

/** A performer standing on the beam at `at`, walking to `to`. */
function take(
  body: IAutoMovieMotionHumanBody,
  beam: ReturnType<typeof createBalanceBeam>,
  at: IAutoMovieVector3,
  to: IAutoMovieVector3,
): HumanPerformance {
  return new HumanPerformance({
    seed: "line-walk",
    laws: [AutoMovieMotionHumanAcrobatics.HumanGymnastics.lineWalk],
    performers: [
      { subject: "a", body, at, yaw: 0, proficiency: { level: "trained" } },
    ],
    props: [
      HumanObject.prop("beam", beam, { at: { x: 0, y: 0, z: 0 }, yaw: 0 }),
    ],
    composition: HumanChain.subject("a").registered("lineWalk", {
      on: { prop: "beam" },
      to,
    }).node,
  });
}

/** The displayed hips at a film second. */
function hips(film: HumanPerformance, time: number): IAutoMovieVector3 {
  return film.bones("a", time).get("hips")!.worldPosition;
}

/** A displayed foot socket at a film second. */
function socket(
  film: HumanPerformance,
  body: IAutoMovieMotionHumanBody,
  time: number,
  side: AutoMovieHumanSide,
  point: Parameters<typeof HumanFoot.point>[2],
): IAutoMovieVector3 {
  const foot: IAutoMovieResolvedBone = film
    .bones("a", time)
    .get(`${side}Foot`)!;
  return HumanFoot.point(body, side, point, {
    ankle: foot.worldPosition,
    rotation: foot.worldRotation,
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
