import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { WorkoutSupport } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";
import { vclose } from "../../../internal/vclose";

/** Rounding of one quaternion rotation, metres. */
const ROUNDING: number = 1e-12;

/** An affordance at a point of the prop. */
function affordance(
  id: string,
  translation: IAutoMovieVector3,
): IAutoMovieAffordance {
  return {
    id,
    kind: "surface",
    frame: {
      translation,
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    extent: null,
  };
}

/**
 * `WorkoutSupport.at` is where a prop supports a workout: the named affordance
 * of the prop's frame read once at the action's start, or the middle of two
 * named affordances (a dip station's two bars); an affordance the prop does not
 * have is refused, naming the ones it has.
 *
 * A bench at (1, 0, 2) turned 90 degrees about +Y: its top 0.45 m up and 0.3 m
 * along its own +Z, two bars 1 m up and 0.25 m either side of its +X.
 *
 * Scenarios:
 *
 * 1. The top lies at (1.3, 0.45, 2), read at the start, 2.5 s.
 * 2. The bars' middle lies at (1, 1, 2).
 * 3. A seat the bench does not have is refused, naming its affordances.
 */
export function test_unit_motions_exercise_workout_support(): void {
  const frame: IAutoMovieRigidTransform = {
    position: { x: 1, y: 0, z: 2 },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
  };
  const prop: IAutoMovieMotionHumanProp = {
    subject: "bench",
    frame,
    points: {},
    affordances: [
      affordance("top", { x: 0, y: 0.45, z: 0.3 }),
      affordance("left", { x: -0.25, y: 1, z: 0 }),
      affordance("right", { x: 0.25, y: 1, z: 0 }),
    ],
  };
  const read: number[] = [];
  const context: Parameters<typeof WorkoutSupport.at>[0] = {
    start: 2.5,
    prop: (): IAutoMovieMotionHumanPropReader => ({
      prop,
      frame: (seconds: number): IAutoMovieRigidTransform => {
        read.push(seconds);
        return frame;
      },
    }),
  };

  // 1. One affordance at the start.
  TestValidator.predicate(
    "the top in the bench's frame at the start",
    vclose(
      WorkoutSupport.at(context, { prop: "bench", affordance: "top" }),
      { x: 1.3, y: 0.45, z: 2 },
      ROUNDING,
    ) && read.join() === "2.5",
  );

  // 2. Two affordances.
  TestValidator.predicate(
    "the middle of two bars",
    vclose(
      WorkoutSupport.at(context, {
        prop: "bench",
        affordance: "left",
        other: "right",
      }),
      { x: 1, y: 1, z: 2 },
      ROUNDING,
    ),
  );

  // 3. A missing affordance.
  TestValidator.predicate(
    "a missing affordance is refused",
    throwsError(
      (): unknown =>
        WorkoutSupport.at(context, { prop: "bench", affordance: "seat" }),
      ["no affordance seat", "top, left, right"],
    ),
  );
}
