import {
  type AutoMovieArchetypeCourse,
  AutoMovieArchetypeManoeuvre,
  AutoMovieArchetypeRefusal,
} from "@automovie/archetypes";
import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Rounding of the bounded half-turn trigonometry and frame arithmetic. */
const ROUNDING: number = 32 * Number.EPSILON;

/** An eighth-second window bracket bisected forty times, plus rounding. */
const WINDOW: number = 0.125 * 2 ** -40 + ROUNDING;

/** The floor origin. */
const ORIGIN: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

/** A gait speed interval in metres per second. */
const RANGE: AutoMovieArchetypeManoeuvre.ISpeedRange = {
  minimum: 1,
  maximum: 6,
};

/**
 * A two-second course input with analytic time and distance, and a supplied
 * root frame. No course planner or horse is needed by the samples.
 *
 * @param root The root position at the requested second, metres.
 * @param yaw The root heading at the requested second, degrees.
 * @returns The course reader the primitives consume.
 */
function course(
  root: (seconds: number) => IAutoMovieVector3,
  yaw: (seconds: number) => number,
): AutoMovieArchetypeCourse.IPlan {
  return {
    kind: "plan",
    course: {
      kind: "timed",
      samples: [{ seconds: 0, ...root(0) }, { seconds: 2, ...root(2) }],
    },
    duration: 2,
    length: 4,
    peak: 2,
    bends: [],
    instants: [],
    legSpans: [],
    when: (distance: number): number => Math.min(2, Math.max(0, distance / 2)),
    at: (seconds: number): AutoMovieArchetypeCourse.IState => {
      const t: number = Math.min(2, Math.max(0, seconds));
      return {
        distance: 2 * t,
        progress: 2 * t,
        speed: 2,
        curvature: 0,
        reverse: false,
        placement: {
          translation: root(t),
          rotation: AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yaw(t)),
          scale: { x: 1, y: 1, z: 1 },
        },
      };
    },
  };
}

/** Whether a timed sample lies at an independently specified floor point. */
function atPoint(
  sample: AutoMovieArchetypeCourse.ISample | undefined,
  seconds: number,
  point: IAutoMovieVector3,
): boolean {
  return (
    sample !== undefined &&
    sample.seconds === seconds &&
    vclose({ x: sample.x, y: sample.y ?? 0, z: sample.z }, point, ROUNDING)
  );
}

/** Observe an admission refusal without swallowing other failures. */
function refused(task: () => unknown): AutoMovieArchetypeRefusal | undefined {
  try {
    task();
  } catch (error: unknown) {
    if (error instanceof AutoMovieArchetypeRefusal) return error;
    throw error;
  }
  return undefined;
}

/**
 * The geometry and admission of arc, wheel, station and follower samples, and
 * facing windows on an authored clock.
 *
 * Scenarios:
 *
 * 1. A half-turn visits the cardinal points. A radius below the speed range
 *    refuses with its feasible interval.
 * 2. Two wheel files keep distinct radii on the same ray. An outer file too
 *    fast reduces the greatest possible inner radius by the file spacing.
 * 3. A station follows a translating and turning frame. A follower waits at
 *    the origin and later reaches the leader's earlier corner.
 * 4. Two turns see the fixed point at the same headings on separate windows.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the floor samples, feasible radius bounds, moving station, follower distance and facing intervals.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `arc`, `wheel`, `station`, `follow` and `facing` on typed planar inputs. The assertions detect a reversed turn, the wrong file radius, an unrotated station, a straight-line follower and merged facing windows.
 * @evidence contracts/development/testing.md#independent-expectations A circle's cardinal points and speed as radius times angular rate give the expected points and radius bounds. A quarter turn rotates the station offset from +X to -Z. A one-metre gap at two metres per second gives a half-second delay. A 360-degree turn per second puts the facing edges at 30 and 90 degrees in each turn. The comparisons allow 32 machine epsilons in bounded arithmetic and forty halvings of one eighth-second bracket at each facing edge.
 * @evidence contracts/development/testing.md#distinguishing-cases A legal arc and a small-radius refusal exercise the lower bound. A legal wheel and an outer file too fast exercise the spacing-dependent upper bound. The station turns, the follower waits and rounds a corner, and the facing reader leaves a gap between successive windows. Actual clearance among posed horses belongs to `test_archetypes_mounted_manoeuvres`.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit discovered as `test_archetypes_core_manoeuvre`. Analytic plan readers supply positions, headings and the distance clock.
 */
export function test_archetypes_core_manoeuvre(): void {
  const arc: AutoMovieArchetypeManoeuvre.IArc = {
    centre: ORIGIN,
    radius: 2,
    bearing: 0,
    sweep: 180,
    start: 1,
    end: 3,
  };
  const samples: AutoMovieArchetypeCourse.ISample[] =
    AutoMovieArchetypeManoeuvre.arc("arc", arc, RANGE, 1);
  TestValidator.predicate(
    "a half turn visits the three cardinal points",
    samples.length === 3 &&
      atPoint(samples[0], 1, { x: 0, y: 0, z: 2 }) &&
      atPoint(samples[1], 2, { x: 2, y: 0, z: 0 }) &&
      atPoint(samples[2], 3, { x: 0, y: 0, z: -2 }),
  );
  const small: AutoMovieArchetypeRefusal | undefined = refused(() =>
    AutoMovieArchetypeManoeuvre.arc("arc", { ...arc, radius: 0.5 }, RANGE, 1),
  );
  TestValidator.predicate(
    "a small arc names both admissible radii",
    small?.axis === "radius" &&
      small.feasible?.kind === "range" &&
      small.feasible.minimum !== null &&
      small.feasible.maximum !== null &&
      nclose(small.feasible.minimum, 2 / Math.PI, ROUNDING) &&
      nclose(small.feasible.maximum, 12 / Math.PI, ROUNDING),
  );

  const wheel: AutoMovieArchetypeManoeuvre.IWheel = {
    centre: ORIGIN,
    inner: 2,
    spacing: 2,
    files: 2,
    bearing: 0,
    sweep: 90,
    start: 0,
    end: 2,
  };
  const files: AutoMovieArchetypeCourse.ISample[][] =
    AutoMovieArchetypeManoeuvre.wheel("wheel", wheel, RANGE, 1);
  TestValidator.predicate(
    "a wheel keeps its radii on the common intermediate ray",
    files.length === 2 &&
      atPoint(files[0]?.[1], 1, { x: Math.SQRT2, y: 0, z: Math.SQRT2 }) &&
      atPoint(files[1]?.[1], 1, {
        x: 2 * Math.SQRT2,
        y: 0,
        z: 2 * Math.SQRT2,
      }),
  );
  const fast: AutoMovieArchetypeRefusal | undefined = refused(() =>
    AutoMovieArchetypeManoeuvre.wheel("wheel", { ...wheel, end: 1 }, RANGE, 0.5),
  );
  TestValidator.predicate(
    "the outer file's speed reduces the inner file's upper bound",
    fast?.axis === "inner" &&
      fast.feasible?.kind === "range" &&
      fast.feasible.minimum !== null &&
      fast.feasible.maximum !== null &&
      nclose(fast.feasible.minimum, 2 / Math.PI, ROUNDING) &&
      nclose(fast.feasible.maximum, 12 / Math.PI - 2, ROUNDING),
  );

  const carrier: AutoMovieArchetypeCourse.IPlan = course(
    (t: number): IAutoMovieVector3 => ({
      x: 2 * Math.max(0, t - 1),
      y: 0,
      z: 2 * Math.min(1, t),
    }),
    (t: number): number => (t < 1 ? 0 : 90),
  );
  const stations: AutoMovieArchetypeCourse.ISample[] =
    AutoMovieArchetypeManoeuvre.station(carrier, { x: 1, y: 0, z: 0 }, 0, 2, 1);
  TestValidator.predicate(
    "the offset turns with the carrier",
    atPoint(stations[0], 0, { x: 1, y: 0, z: 0 }) &&
      atPoint(stations[2], 2, { x: 2, y: 0, z: 1 }),
  );
  const follow: AutoMovieArchetypeCourse.ISample[] =
    AutoMovieArchetypeManoeuvre.follow(carrier, 1, 0, 2, 0.5);
  TestValidator.predicate(
    "the follower waits and then takes the leader's own corner",
    atPoint(follow[0], 0, ORIGIN) &&
      atPoint(follow[1], 0.5, ORIGIN) &&
      atPoint(follow[3], 1.5, { x: 0, y: 0, z: 2 }) &&
      atPoint(follow[4], 2, { x: 1, y: 0, z: 2 }),
  );

  const windows: AutoMovieArchetypeManoeuvre.IWindow[] =
    AutoMovieArchetypeManoeuvre.facing(
      course((): IAutoMovieVector3 => ORIGIN, (t: number): number => 360 * t),
      { x: 1, y: 0, z: 0 },
      30,
      30,
      0,
      2,
      0.125,
    );
  TestValidator.predicate(
    "two turns keep separate windows at the same local headings",
    windows.length === 2 &&
      windows.every(
        (window: AutoMovieArchetypeManoeuvre.IWindow, i: number): boolean =>
          nclose(window.from, i + 1 / 12, WINDOW) &&
          nclose(window.to, i + 1 / 4, WINDOW),
      ),
  );
}
