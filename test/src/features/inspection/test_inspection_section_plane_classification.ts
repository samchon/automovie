import { TestValidator } from "@nestia/e2e";

import type { AutoMovieSectionPlaneState } from "../../../../packages/engine/src/film/AutoMovieSectionPlaneState";
import { IAutoMovieSectionPlane } from "../../../../packages/engine/src/film/IAutoMovieSectionPlane";
import { autoMovieSectionPlaneDistance } from "../../../../packages/engine/src/film/autoMovieSectionPlaneDistance";
import { autoMovieSectionPlanesKeepPoint } from "../../../../packages/engine/src/film/autoMovieSectionPlanesKeepPoint";
import { classifyAutoMovieSectionPlaneBox } from "../../../../packages/engine/src/film/classifyAutoMovieSectionPlaneBox";
import { nclose } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

/**
 * A horizontal cut at y = 3: everything above it is removed.
 */
const CEILING: IAutoMovieSectionPlane = {
  point: { x: 0, y: 3, z: 0 },
  normal: { x: 0, y: 1, z: 0 },
};

/**
 * A vertical cut at x = 0 removing everything to the west, deliberately declared with a non-unit normal so normalization is exercised.
 */
const WEST_WALL: IAutoMovieSectionPlane = {
  point: { x: 0, y: 0, z: 0 },
  normal: { x: -4, y: 0, z: 0 },
};

function box(
  min: [number, number, number],
  max: [number, number, number],
): {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
} {
  return {
    min: { x: min[0], y: min[1], z: min[2] },
    max: { x: max[0], y: max[1], z: max[2] },
  };
}

/**
 * Section half-spaces keep exact contact and classify finite ordered boxes.
 *
 * Scenarios:
 * 1. Signed distances below, above and on y=3 are -1, +1 and zero.
 * 2. A non-unit west normal still measures world metres.
 * 3. Zero/nonfinite normals and nonfinite plane points throw RangeError.
 * 4. Point keep includes exact contact and an empty plane list.
 * 5. Multiple planes intersect their kept half-spaces.
 * 6. Positive-axis box support corners distinguish kept/cut/crossed.
 * 7. Negative-axis support corners preserve those same states.
 * 8. Contact on the top face keeps the box; contact on its bottom crosses it.
 * 9. An empty plane list keeps a valid box.
 * 10. Inverted and nonfinite bounds on every axis are refused even without planes.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls plane distance, point keep and box classification directly; reversed signs, skipped normalization, incorrect intersection/support corners or admitted malformed bounds fail.
 * @evidence contracts/testing.md#independent-expectations Horizontal y=3 and west-facing x=0 planes determine distances and finite box support states by hand geometry; exact contact uses zero-tolerance nclose.
 * @evidence contracts/testing.md#distinguishing-cases Positive/negative and non-unit/invalid normals, finite plane points, kept/cut/crossed boxes, contact on either face, intersecting/empty planes and invalid bounds on every axis are retained; displayed clipping belongs to hardware inspection.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_inspection_section_plane_classification entry owns these synchronous portable half-space and box calculations; resident planes and points require no production installation, process, browser or GPU.
 */
export function test_inspection_section_plane_classification(): void {
  // 1. signed distance, including the boundary
  TestValidator.predicate(
    "one metre under a y=3 cut is -1",
    nclose(autoMovieSectionPlaneDistance(CEILING, { x: 7, y: 2, z: -5 }), -1),
  );
  TestValidator.predicate(
    "one metre over a y=3 cut is +1",
    nclose(autoMovieSectionPlaneDistance(CEILING, { x: 7, y: 4, z: -5 }), 1),
  );
  TestValidator.predicate(
    "a point exactly on the cut is exactly zero",
    test12ValuesClose(
      autoMovieSectionPlaneDistance(CEILING, { x: 7, y: 3, z: -5 }),
      0,
    ),
  );

  // 2. a non-unit normal still reports metres
  TestValidator.predicate(
    "a length-4 normal reports the same metres as its unit twin",
    nclose(
      autoMovieSectionPlaneDistance(WEST_WALL, { x: -2.5, y: 1, z: 0 }),
      2.5,
    ),
  );

  // 3. degenerate normals are refused, not defaulted
  TestValidator.predicate(
    "a zero normal is refused",
    throwsRangeError((): number =>
      autoMovieSectionPlaneDistance(
        { point: { x: 0, y: 0, z: 0 }, normal: { x: 0, y: 0, z: 0 } },
        { x: 1, y: 1, z: 1 },
      ),
    ),
  );
  TestValidator.predicate(
    "a non-finite normal is refused",
    throwsRangeError((): number =>
      autoMovieSectionPlaneDistance(
        { point: { x: 0, y: 0, z: 0 }, normal: { x: Number.NaN, y: 1, z: 0 } },
        { x: 1, y: 1, z: 1 },
      ),
    ),
  );
  TestValidator.predicate(
    "a non-finite plane point is refused",
    throwsRangeError(
      (): number =>
        autoMovieSectionPlaneDistance(
          {
            point: { x: 0, y: Number.POSITIVE_INFINITY, z: 0 },
            normal: { x: 0, y: 1, z: 0 },
          },
          { x: 1, y: 1, z: 1 },
        ),
      "point",
    ),
  );

  // 4. point keep, including the boundary and the empty declaration
  TestValidator.predicate(
    "a point under the cut is kept",
    test12ValuesClose(
      autoMovieSectionPlanesKeepPoint([CEILING], { x: 0, y: 2.9, z: 0 }),
      true,
    ),
  );
  TestValidator.predicate(
    "a point over the cut is removed",
    test12ValuesClose(
      autoMovieSectionPlanesKeepPoint([CEILING], { x: 0, y: 3.1, z: 0 }),
      false,
    ),
  );
  TestValidator.predicate(
    "a point exactly on the cut is kept",
    test12ValuesClose(
      autoMovieSectionPlanesKeepPoint([CEILING], { x: 0, y: 3, z: 0 }),
      true,
    ),
  );
  TestValidator.predicate(
    "no declared plane keeps everything",
    test12ValuesClose(
      autoMovieSectionPlanesKeepPoint([], { x: 0, y: 900, z: 0 }),
      true,
    ),
  );

  // 5. planes intersect rather than union
  TestValidator.predicate(
    "one removing plane removes the point even when another keeps it",
    test12ValuesClose(
      autoMovieSectionPlanesKeepPoint([WEST_WALL, CEILING], {
        x: -1,
        y: 1,
        z: 0,
      }),
      false,
    ),
  );

  // 6. box classification, removed side on the positive axis
  TestValidator.predicate(
    "a box entirely under the cut is kept",
    test12ValuesClose(
      classifyAutoMovieSectionPlaneBox({
        planes: [CEILING],
        ...box([-1, 0, -1], [1, 2, 1]),
      }),
      "kept",
    ),
  );
  TestValidator.predicate(
    "a box entirely over the cut is cut",
    test12ValuesClose(
      classifyAutoMovieSectionPlaneBox({
        planes: [CEILING],
        ...box([-1, 4, -1], [1, 6, 1]),
      }),
      "cut",
    ),
  );
  TestValidator.predicate(
    "a box straddling the cut is crossed",
    test12ValuesClose(
      classifyAutoMovieSectionPlaneBox({
        planes: [CEILING],
        ...box([-1, 2, -1], [1, 4, 1]),
      }),
      "crossed",
    ),
  );

  // 7. the mirrored corner choice: removed side on the negative axis
  TestValidator.predicate(
    "a box entirely east of a west-removing cut is kept",
    test12ValuesClose(
      classifyAutoMovieSectionPlaneBox({
        planes: [WEST_WALL],
        ...box([1, 0, -1], [3, 2, 1]),
      }),
      "kept",
    ),
  );
  TestValidator.predicate(
    "a box entirely west of a west-removing cut is cut",
    test12ValuesClose(
      classifyAutoMovieSectionPlaneBox({
        planes: [WEST_WALL],
        ...box([-3, 0, -1], [-1, 2, 1]),
      }),
      "cut",
    ),
  );
  TestValidator.predicate(
    "a box straddling a west-removing cut is crossed",
    test12ValuesClose(
      classifyAutoMovieSectionPlaneBox({
        planes: [WEST_WALL],
        ...box([-1, 0, -1], [1, 2, 1]),
      }),
      "crossed",
    ),
  );

  // 8. exact contact on either face
  TestValidator.predicate(
    "a box whose top face lies on the cut is kept whole",
    test12ValuesClose(
      classifyAutoMovieSectionPlaneBox({
        planes: [CEILING],
        ...box([-1, 1, -1], [1, 3, 1]),
      }),
      "kept",
    ),
  );
  TestValidator.predicate(
    "a box whose bottom face lies on the cut is crossed, not cut",
    test12ValuesClose(
      classifyAutoMovieSectionPlaneBox({
        planes: [CEILING],
        ...box([-1, 3, -1], [1, 5, 1]),
      }),
      "crossed",
    ),
  );

  // 9. regression: an uncut scene
  TestValidator.predicate(
    "no declared plane classifies any box as kept",
    test12ValuesClose(
      classifyAutoMovieSectionPlaneBox({
        planes: [],
        ...box([-100, -100, -100], [100, 100, 100]),
      }),
      "kept",
    ),
  );

  // 10. a malformed box is refused rather than misclassified
  TestValidator.predicate(
    "an inverted box is refused",
    throwsRangeError(
      (): AutoMovieSectionPlaneState =>
        classifyAutoMovieSectionPlaneBox({
          planes: [CEILING],
          ...box([-1, 2, -1], [1, 0, 1]),
        }),
      "box",
    ),
  );
  TestValidator.predicate(
    "a non-finite box corner is refused",
    throwsRangeError(
      (): AutoMovieSectionPlaneState =>
        classifyAutoMovieSectionPlaneBox({
          planes: [CEILING],
          ...box([-1, 0, -1], [1, Number.NaN, 1]),
        }),
      "box",
    ),
  );
  for (const axis of ["x", "y", "z"] as const) {
    const inverted: ReturnType<typeof box> = box([0, 0, 0], [1, 1, 1]);
    inverted.min[axis] = 2;
    TestValidator.predicate(
      `inverted ${axis} bounds fail without planes`,
      throwsRangeError(
        (): AutoMovieSectionPlaneState =>
          classifyAutoMovieSectionPlaneBox({ planes: [], ...inverted }),
        `Section box ${axis} range`,
      ),
    );
    for (const corner of ["min", "max"] as const) {
      const invalid: ReturnType<typeof box> = box([0, 0, 0], [1, 1, 1]);
      invalid[corner][axis] = corner === "min" ? NaN : Infinity;
      TestValidator.predicate(
        `nonfinite ${corner}.${axis} fails without planes`,
        throwsRangeError(
          (): AutoMovieSectionPlaneState =>
            classifyAutoMovieSectionPlaneBox({ planes: [], ...invalid }),
          `Section box ${axis} range`,
        ),
      );
    }
  }
}

/**
 * Require the documented refusal class and its owning geometric field.
 */
function throwsRangeError(
  task: () => unknown,
  message: string = "normal",
): boolean {
  try {
    task();
    return false;
  } catch (error) {
    return error instanceof RangeError && error.message.includes(message);
  }
}
