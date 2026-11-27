import {
  AutoMovieArchetypeEnvironmentRide
} from "../../../../../packages/archetypes/src/environments/AutoMovieArchetypeEnvironmentRide";
import { AutoMovieEngineQuaternion } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Covers one chord, station interpolation and the quaternion readback. */
const TRACK_ROUNDING: number = 256 * Number.EPSILON;

/** The station travels along a grade and banks around the graded tangent. */
export function test_archetypes_environments_tracked_course(): void {
  const course = AutoMovieArchetypeEnvironmentRide.trackedCourse({
    points: [
      { x: 1, y: 2, z: 5 },
      { x: 1, y: 5, z: 9 },
    ],
    banks: [0, 60],
  });
  const middle = course.frame(2.5);
  TestValidator.predicate(
    "a 3–4 climb has a five metre chord and a linear midpoint",
    nclose(course.length, 5, TRACK_ROUNDING) &&
      vclose(middle.translation, { x: 1, y: 3.5, z: 7 }, TRACK_ROUNDING),
  );
  TestValidator.predicate(
    "half station preserves the graded forward and rolls the right axis 30 degrees",
    vclose(
      AutoMovieEngineQuaternion.rotateVector(middle.rotation, { x: 0, y: 0, z: 1 }),
      { x: 0, y: 0.6, z: 0.8 },
      TRACK_ROUNDING,
    ) &&
      vclose(
        AutoMovieEngineQuaternion.rotateVector(middle.rotation, { x: 1, y: 0, z: 0 }),
        { x: Math.sqrt(3) / 2, y: 0.4, z: -0.3 },
        TRACK_ROUNDING,
      ),
  );
  TestValidator.error("station after the endpoint", (): unknown =>
    course.frame(6),
  );
}
