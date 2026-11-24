import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBallet,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanDance,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import {
  AutoMovieMotionHumanRange,
  HumanFoot,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * Classical ballet on the beat (#3991's ballet).
 *
 * Scenarios:
 * 1. Each of the five positions places the heels at its relation within
 *    15 mm, each foot turned out by the turnout within 3 degrees (the
 *    bodies alternating).
 * 2. A relevé lifts the heels at least 30 mm while the balls stay within
 *    3 mm of where they stood.
 * 3. A single and a double pirouette turn the hips by 360 degrees a turn
 *    about the supporting ball, which slides at most 5 mm, the working toes
 *    within 120 mm of the supporting knee through the turn.
 * 4. A grand jeté opens the legs to the asked split at the apex within 15
 *    degrees and lands on the leading foot.
 * 5. A turnout beyond the hip's external rotation and a split beyond the
 *    hips' range are refused with the limit.
 * 6. The relevé, pirouette and jeté takes pass the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each relation, bound and refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Plans the ballet row through the public chain and reads the displayed feet, knee, thighs and hips.
 * @evidence contracts/development/testing.md#independent-expectations Relations are the positions' stated foot-length spacings; turns are whole turns; the limits are the body's range table.
 * @evidence contracts/development/testing.md#distinguishing-cases Five positions, a relevé, a single and a double pirouette on different bodies, a jeté, and two refusals.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on the shared Human fixture.
 */
export function test_motion_dance_ballet(): void {
  const turnout: number = AutoMovieMotionHumanDance.ballet.TURNOUT;
  const bodies: readonly Fixture[] = ["f-small", "m-average"];

  // 1. Positions.
  for (const position of [1, 2, 3, 4, 5]) {
    const name: Fixture = bodies[position % 2]!;
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const film: HumanPerformance = take(body, {
      kind: "position",
      position,
      movement: "hold",
      count: 1,
    });
    const step: IAutoMovieMotionHumanSegment = film.segments("a")[1]!;
    const t: number = step.start + at(step, "position") + 0.05;
    const left: IAutoMovieVector3 = socket(film, body, t, "left", "heel");
    const right: IAutoMovieVector3 = socket(film, body, t, "right", "heel");
    const fl: number = body.measure.footLength;
    const c: number = Math.cos((turnout * Math.PI) / 180);
    const apart: number = Math.hypot(left.x - right.x, left.z - right.z);
    const ahead: number = left.z - right.z;
    const expected: number =
      position === 1
        ? AutoMovieMotionHumanDance.balletPositions.HEEL * fl
        : position === 2
          ? AutoMovieMotionHumanDance.balletPositions.SECOND * fl
          : position === 3
            ? 0.5 * c * fl +
              AutoMovieMotionHumanDance.balletPositions.WIDTH * fl
            : position === 4
              ? c * fl + AutoMovieMotionHumanDance.balletPositions.FOURTH * fl
              : c * fl + AutoMovieMotionHumanDance.balletPositions.WIDTH * fl;
    const measured: number = position <= 2 ? apart : -ahead;
    const outL: number = heading(film, t, "left");
    const outR: number = heading(film, t, "right");
    TestValidator.predicate(
      `${name} position ${position}: heels ${(measured * 1000).toFixed(0)} mm for ${(expected * 1000).toFixed(0)}, turned out ${outL.toFixed(1)} and ${outR.toFixed(1)} degrees`,
      Math.abs(measured - expected) <= 0.015 &&
        Math.abs(outL - turnout) <= 3 &&
        Math.abs(outR + turnout) <= 3,
    );
  }

  // 2. Relevé.
  {
    const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
    const film: HumanPerformance = take(body, {
      kind: "position",
      position: 1,
      movement: "releve",
      count: 2,
    });
    const step: IAutoMovieMotionHumanSegment = film.segments("a")[1]!;
    const before: number = step.start + at(step, "beat1");
    const peak: number = step.start + at(step, "beat2");
    let ok: boolean = true;
    for (const side of ["left", "right"] as const) {
      const heel: number = socket(film, body, peak, side, "heel").y;
      const slide: number = Vector3.distance(
        socket(film, body, before, side, "ball"),
        socket(film, body, peak, side, "ball"),
      );
      ok &&= heel >= 0.03 && slide <= 0.003;
    }
    TestValidator.predicate("a relevé lifts the heels on the balls", ok);
    assertTakeClean("relevé", film);
  }

  // 3. Pirouettes.
  for (const [name, turns] of [
    ["f-small", 1],
    ["m-average", 2],
  ] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const film: HumanPerformance = take(body, { kind: "pirouette", turns });
    const step: IAutoMovieMotionHumanSegment = film.segments("a")[1]!;
    const from: number = step.start + at(step, "turn");
    const to: number = step.start + at(step, "land");
    const ball0: IAutoMovieVector3 = socket(film, body, from, "left", "ball");
    let slide: number = 0;
    let toe: number = 0;
    let turned: number = 0;
    let last: number = yaw(film, from);
    for (let t: number = from; t <= to; t += 1 / 48) {
      slide = Math.max(
        slide,
        Vector3.distance(ball0, socket(film, body, t, "left", "ball")),
      );
      const knee: IAutoMovieVector3 = film
        .bones("a", t)
        .get("leftLowerLeg")!.worldPosition;
      toe = Math.max(
        toe,
        Vector3.distance(knee, socket(film, body, t, "right", "toe")),
      );
      const now: number = yaw(film, t);
      turned += ((now - last + 540) % 360) - 180;
      last = now;
    }
    TestValidator.predicate(
      `${name} turns ${turned.toFixed(0)} degrees for ${turns} turns, the ball sliding ${(slide * 1000).toFixed(1)} mm, the toes ${(toe * 1000).toFixed(0)} mm from the knee`,
      Math.abs(Math.abs(turned) - 360 * turns) <= 10 &&
        slide <= 0.005 &&
        toe <= 0.12,
    );
    assertTakeClean(`${name} pirouette`, film);
  }

  // 4. Grand jeté.
  {
    const body: IAutoMovieMotionHumanBody = motionHumanBody("f-small");
    const split: number = 150;
    const film: HumanPerformance = take(body, { kind: "grandJete", split });
    const step: IAutoMovieMotionHumanSegment = film.segments("a")[1]!;
    const apex: number = step.start + at(step, "apex");
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      film.bones("a", apex);
    const thigh: (side: AutoMovieHumanSide) => IAutoMovieVector3 = (
      side: AutoMovieHumanSide,
    ): IAutoMovieVector3 =>
      Vector3.normalize(
        Vector3.subtract(
          bones.get(side === "left" ? "leftLowerLeg" : "rightLowerLeg")!
            .worldPosition,
          bones.get(side === "left" ? "leftUpperLeg" : "rightUpperLeg")!
            .worldPosition,
        ),
      );
    const opened: number =
      (Math.acos(Vector3.dot(thigh("left"), thigh("right"))) * 180) / Math.PI;
    const land: number = step.start + at(step, "landing") + 0.02;
    TestValidator.predicate(
      `the jeté splits ${opened.toFixed(0)} degrees at the apex and lands on the leading foot`,
      Math.abs(opened - split) <= 15 &&
        socket(film, body, land, "right", "heel").y <= 0.01 &&
        socket(film, body, land, "left", "toe").y >= 0.1,
    );
    assertTakeClean("grand jeté", film);
  }

  // 5. Refusals.
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const refusal: (
    params: IAutoMovieMotionHumanBallet.IParams,
  ) => HumanRefusal | undefined = (
    params: IAutoMovieMotionHumanBallet.IParams,
  ): HumanRefusal | undefined => {
    try {
      take(body, params);
    } catch (error) {
      if (error instanceof HumanRefusal) return error;
      throw error;
    }
    return undefined;
  };
  const outward: number = AutoMovieMotionHumanRange.limit(
    "leftUpperLeg",
    "external",
  )!;
  const wide: HumanRefusal | undefined = refusal({
    kind: "position",
    turnout: outward + 10,
  });
  TestValidator.predicate(
    "a turnout beyond the hip's range is refused with the limit",
    wide?.axis === "turnout" &&
      wide.feasible?.kind === "range" &&
      Math.abs((wide.feasible.maximum ?? 0) - outward) <= 1e-9,
  );
  TestValidator.predicate(
    "a split beyond the hips' range is refused",
    refusal({ kind: "grandJete", split: 300 })?.axis === "split",
  );
}

/** The two canonical bodies the steps are danced on. */
type Fixture = "f-small" | "m-average";

/** A performer dancing one ballet step after a brief stand. */
function take(
  body: IAutoMovieMotionHumanBody,
  params: IAutoMovieMotionHumanBallet.IParams,
): HumanPerformance {
  return new HumanPerformance({
    seed: "ballet",
    laws: [AutoMovieMotionHumanDance.HumanDanceStyles.ballet],
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a")
      .stand({ hold: 0.3, sway: 0 })
      .registered("ballet", params).node,
  });
}

/** An event's action second. */
function at(segment: IAutoMovieMotionHumanSegment, name: string): number {
  return (
    segment.plan.events.find(
      (e: IAutoMovieMotionEvent): boolean => e.name === name,
    )!.share * segment.plan.duration
  );
}

/** A displayed foot socket at a film second. */
function socket(
  film: HumanPerformance,
  body: IAutoMovieMotionHumanBody,
  time: number,
  side: AutoMovieHumanSide,
  point: IAutoMovieMotionHumanFoot.Socket,
): IAutoMovieVector3 {
  const foot: IAutoMovieResolvedBone = film
    .bones("a", time)
    .get(`${side}Foot`)!;
  return HumanFoot.point(body, side, point, {
    ankle: foot.worldPosition,
    rotation: foot.worldRotation,
  });
}

/** A displayed foot's heading from the hips', degrees, positive turned to the left. */
function heading(
  film: HumanPerformance,
  time: number,
  side: AutoMovieHumanSide,
): number {
  const foot: IAutoMovieResolvedBone = film
    .bones("a", time)
    .get(`${side}Foot`)!;
  return HumanFoot.heading(foot.worldRotation) - yaw(film, time);
}

/** The displayed hips' heading, degrees. */
function yaw(film: HumanPerformance, time: number): number {
  const forward: IAutoMovieVector3 = Quaternion.rotateVector(
    film.bones("a", time).get("hips")!.worldRotation,
    { x: 0, y: 0, z: 1 },
  );
  return (Math.atan2(forward.x, forward.z) * 180) / Math.PI;
}
