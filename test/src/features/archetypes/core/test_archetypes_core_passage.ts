import {
  type AutoMovieArchetypeCourse,
  AutoMovieArchetypePassage,
  AutoMovieArchetypeRefusal,
} from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieCrowdAgent,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Rounding of a few planar coordinate operations, metres. */
const ROUNDING: number = 32 * Number.EPSILON;

/** A half-second bracket bisected forty times, plus coordinate rounding. */
const EDGE: number = 0.5 * 2 ** -40 + ROUNDING;

/** The origin of a local shape. */
const ORIGIN: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

/**
 * A linear four-second fixture supplying just the course contract, without
 * running the course planner.
 *
 * @param origin The world position at zero, metres.
 * @param speedX The X component of velocity, metres per second.
 * @param yaw A constant heading, degrees.
 * @returns The course consumed by the passage.
 */
function plan(
  origin: IAutoMovieVector3,
  speedX: number,
  yaw: number,
): AutoMovieArchetypeCourse.IPlan {
  const position = (seconds: number): IAutoMovieVector3 => ({
    ...origin,
    x: origin.x + speedX * Math.min(4, Math.max(0, seconds)),
  });
  return {
    kind: "plan",
    course: {
      kind: "timed",
      samples: [{ seconds: 0, ...origin }, { seconds: 4, ...position(4) }],
    },
    duration: 4,
    length: 4 * speedX,
    peak: speedX,
    instants: [],
    bends: [],
    legSpans: [],
    when: (distance: number): number =>
      speedX > 0 ? Math.min(4, Math.max(0, distance / speedX)) : 0,
    at: (seconds: number): AutoMovieArchetypeCourse.IState => {
      const distance: number = position(seconds).x - origin.x;
      return {
        distance,
        progress: distance,
        speed: speedX,
        curvature: 0,
        reverse: false,
        placement: {
          translation: position(seconds),
          rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yaw),
          scale: { x: 1, y: 1, z: 1 },
        },
      };
    },
  };
}

/** Observe a typed passage refusal and leave unrelated failures visible. */
function refusal(task: () => unknown): AutoMovieArchetypeRefusal | undefined {
  try {
    task();
  } catch (error: unknown) {
    if (error instanceof AutoMovieArchetypeRefusal) return error;
    throw error;
  }
  return undefined;
}

/**
 * A passage translates its participant outlines, measures the greater of
 * their margins, names the earliest conflicting route, and binds a polygon
 * obstacle to the participant's placement.
 *
 * Scenarios:
 *
 * 1. Two quarter-metre discs on crossing and offset lines. The crossing
 *    violates the half-metre margin over one analytic interval. With a unit
 *    offset the exact tangent is admitted.
 * 2. The same crossing routes a refusal to the later moving participant or
 *    to the sole participant when the second disc is a fixed obstacle.
 * 3. A rectangle grows by its own margin on all four sides. Two reads in
 *    reverse time order follow its world placement. A separately rounded
 *    steering footprint is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the planar footprints, clearance threshold, route refusals and the obstacle's local and world frames.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `conflicts`, `admit` and `obstacle` directly. The cases detect summed margins, wrong refusal routes, unordered conflicts, missing corners and a frozen obstacle.
 * @evidence contracts/development/testing.md#independent-expectations Two quarter-metre radii and the greater half-metre margin require one metre between centres, giving the crossing interval from 1 to 3 seconds. Offsetting the four rectangle edges by a quarter metre gives each signed corner. At one metre per second from X = -2 m, the obstacle reaches X = 1 m at 3 s and X = -1 m at 1 s. Forty halvings bound the timing error and 32 machine epsilons allow rounding in the bounded coordinate operations.
 * @evidence contracts/development/testing.md#distinguishing-cases The crossing and tangent distinguish strict clearance. Moving and fixed counterparts choose different refusal routes, and reverse input order tests conflict sorting. A steering polygon has no separate radius. Walker yield and lane recovery belong to `test_engine_steer_crowd_moving_obstacle`.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit discovered as `test_archetypes_core_passage`. Analytic plan readers supply the clock and placement for the passage operations.
 */
export function test_archetypes_core_passage(): void {
  const disc: AutoMovieArchetypePassage.IFootprint = {
    outline: [ORIGIN],
    radius: 0.25,
  };
  const moving: AutoMovieArchetypePassage.IParticipant = {
    id: "moving",
    plan: plan({ x: -2, y: 0, z: 0 }, 1, 90),
    footprint: disc,
    margin: 0.125,
  };
  const resting: AutoMovieArchetypePassage.IParticipant = {
    id: "resting",
    plan: plan(ORIGIN, 0, 0),
    footprint: disc,
    margin: 0.5,
  };
  const cross: AutoMovieArchetypePassage.IProps = {
    participants: [moving, resting],
    step: 0.5,
  };
  const [hit, ...other]: AutoMovieArchetypePassage.IConflict[] =
    AutoMovieArchetypePassage.conflicts("cross", cross);
  TestValidator.predicate(
    "the crossing is one named interval with the greater passage margin",
    hit !== undefined &&
      other.length === 0 &&
      hit.subject === "moving" &&
      hit.other === "resting" &&
      hit.required === 0.5 &&
      nclose(hit.from, 1, EDGE) &&
      nclose(hit.to, 3, EDGE) &&
      nclose(hit.clearance, -0.5, ROUNDING),
  );
  TestValidator.equals(
    "a parallel offset admits an exact tangent",
    AutoMovieArchetypePassage.conflicts("cross", {
      ...cross,
      participants: [
        { ...moving, plan: plan({ x: -2, y: 0, z: 1 }, 1, 90) },
        resting,
      ],
    }),
    [],
  );
  const pair: AutoMovieArchetypeRefusal | undefined = refusal(() =>
    AutoMovieArchetypePassage.admit("cross", cross),
  );
  const fixed: AutoMovieArchetypeRefusal | undefined = refusal(() =>
    AutoMovieArchetypePassage.admit("cross", {
      ...cross,
      participants: [moving],
      obstacles: [
        { id: "resting", footprint: disc, margin: resting.margin },
      ],
    }),
  );
  TestValidator.predicate(
    "a refusal names the route that must change and retains both bodies",
    pair?.axis === "participants[1].plan" &&
      fixed?.axis === "participants[0].plan" &&
      [pair, fixed].every((failure: AutoMovieArchetypeRefusal): boolean =>
        failure.reason.includes("moving") && failure.reason.includes("resting"),
      ),
  );

  const intervals: AutoMovieArchetypePassage.IConflict[] =
    AutoMovieArchetypePassage.conflicts("cross", {
      ...cross,
      participants: [moving],
      obstacles: [
        {
          id: "further",
          footprint: { ...disc, outline: [{ x: 1, y: 0, z: 0 }] },
          margin: resting.margin,
        },
        {
          id: "nearer",
          footprint: { ...disc, outline: [{ x: -1, y: 0, z: 0 }] },
          margin: resting.margin,
        },
      ],
    });
  TestValidator.equals(
    "fixed conflicts are reported in time order",
    intervals.map(
      (interval: AutoMovieArchetypePassage.IConflict): string => interval.other,
    ),
    ["nearer", "further"],
  );

  const rectangle: AutoMovieArchetypePassage.IParticipant = {
    ...moving,
    footprint: {
      outline: [
        { x: -1, y: 2, z: -2 },
        { x: 1, y: 2, z: -2 },
        { x: 1, y: 2, z: 2 },
        { x: -1, y: 2, z: 2 },
      ],
      radius: 0,
    },
    margin: 0.25,
  };
  const obstacle: IAutoMovieCrowdAgent.IObstacle =
    AutoMovieArchetypePassage.obstacle(rectangle);
  const corners: readonly IAutoMovieVector3[] = [
    { x: -1.25, y: 0, z: -2.25 },
    { x: 1.25, y: 0, z: -2.25 },
    { x: 1.25, y: 0, z: 2.25 },
    { x: -1.25, y: 0, z: 2.25 },
  ];
  TestValidator.predicate(
    "the polygon keeps all four signed corners after applying its margin",
    obstacle.footprint.length === corners.length &&
      corners.every((corner: IAutoMovieVector3): boolean =>
        obstacle.footprint.some((point: IAutoMovieVector3): boolean =>
          vclose(point, corner, ROUNDING),
        ),
      ),
  );
  TestValidator.predicate(
    "the obstacle reads two world placements in reverse time order",
    [
      { seconds: 3, x: 1 },
      { seconds: 1, x: -1 },
    ].every(({ seconds, x }: { seconds: number; x: number }): boolean => {
      const at: ReturnType<NonNullable<IAutoMovieCrowdAgent.IObstacle["motion"]>>
        | undefined = obstacle.motion?.(seconds);
      return (
        at !== undefined &&
        nclose(at.yaw, 90, ROUNDING * 90) &&
        vclose(at.position, { x, y: 0, z: 0 }, ROUNDING)
      );
    }),
  );
  TestValidator.predicate(
    "a separate radius is refused for a steering polygon",
    refusal(() => AutoMovieArchetypePassage.obstacle(moving))?.axis ===
      "footprint.radius",
  );
}
