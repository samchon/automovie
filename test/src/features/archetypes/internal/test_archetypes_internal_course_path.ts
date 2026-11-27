import type { AutoMovieArchetypeCourse } from "@automovie/archetypes";
import {
  ArchetypeCoursePath
} from "../../../../../packages/archetypes/src/core/internal/ArchetypeCoursePath";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Projection, square root and trigonometry at this fixture's metre scale. */
const PATH_ROUNDING: number = 128 * Number.EPSILON;

/** A graded leg uses path distance and a reverse turn uses travel direction. */
export function test_archetypes_internal_course_path(): void {
  const course: AutoMovieArchetypeCourse.ICourse = {
    start: { x: 1, z: 2, heading: 90 },
    cruise: 1,
    legs: [
      { kind: "straight", length: 4, rise: 3 },
      { kind: "turn", radius: 2, angle: -90, reverse: true },
      { kind: "straight", length: 1 },
    ],
  };
  const laid = ArchetypeCoursePath.lay(course, (axis): never => {
    throw new Error(`Unexpected course refusal at ${axis}`);
  });
  const [slope, reverse, exit] = laid.rows;
  TestValidator.predicate(
    "a 3–4 grade adds five metres of path before a quarter circle",
    nclose(laid.length, 6 + Math.PI, PATH_ROUNDING) &&
      nclose(reverse!.from, 5, PATH_ROUNDING) &&
      nclose(exit!.progress, 5 - Math.PI, PATH_ROUNDING),
  );
  const halfway = ArchetypeCoursePath.advance(slope!, 2.5);
  TestValidator.predicate(
    "half way uphill covers two metres east and rises one and a half metres",
    vclose(halfway, { x: 3, y: 1.5, z: 2 }, PATH_ROUNDING) &&
      halfway.heading === 90,
  );
  TestValidator.predicate(
    "the reverse arc backs west and south while facing turns from east to north",
    vclose(exit!, { x: 3, y: 3, z: 0 }, PATH_ROUNDING) &&
      nclose(exit!.heading, 0, PATH_ROUNDING),
  );

  const grade = (run: number, rise: number) =>
    ArchetypeCoursePath.lay(
      {
        ...course,
        start: { x: 0, z: 0, heading: 0 },
        legs: [{ kind: "straight", length: run, rise }],
      },
      (axis): never => {
        throw new Error(`Unexpected grade refusal at ${axis}`);
      },
    );
  const nearVertical = grade(2 ** -300, 2 ** 300);
  TestValidator.equals(
    "a steep grade can have representable length even when its slope squared overflows",
    nearVertical.length,
    2 ** 300,
  );
  const projected = ArchetypeCoursePath.advance(
    nearVertical.rows[0]!,
    2 ** 299,
  );
  TestValidator.equals(
    "half the steep leg",
    [projected.y, projected.z],
    [2 ** 299, 2 ** -301],
  );

  const large: number = 2 ** 600;
  const descent = grade(3 * large, -4 * large);
  const middle = ArchetypeCoursePath.advance(descent.rows[0]!, 2.5 * large);
  TestValidator.predicate(
    "large products retain both projections and the descending sign",
    nclose(middle.y / large, -2, PATH_ROUNDING) &&
      nclose(middle.z / large, 1.5, PATH_ROUNDING),
  );
  const tiny: number = Number.MIN_VALUE;
  const short = grade(3 * tiny, 4 * tiny);
  const subnormal = ArchetypeCoursePath.advance(short.rows[0]!, 2 * tiny);
  TestValidator.equals(
    "tiny products recover the two rounded subnormal projections",
    [subnormal.y, subnormal.z],
    [2 * tiny, tiny],
  );

  for (const secondLength of [1, 2 ** 1023]) {
    let refused: string | undefined;
    try {
      ArchetypeCoursePath.lay(
        {
          ...course,
          start: { x: 0, z: 0, heading: 0 },
          legs: [
            { kind: "straight", length: 2 ** 1023 },
            { kind: "straight", length: secondLength },
          ],
        },
        (axis): never => {
          refused = axis;
          throw new Error(axis);
        },
      );
    } catch (error) {
      if (!(error instanceof Error) || error.message !== refused) throw error;
    }
    TestValidator.equals(
      "each leg needs a distinct finite station",
      refused,
      "legs[1]",
    );
  }
}
