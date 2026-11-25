import type {
  IAutoMovieInspectionTrail,
  IAutoMovieMark,
} from "@automovie/interface";
import { markAutoMovieInspectionTrails } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Trail points are binary fractions copied by coordinate. */
const POINT_TOLERANCE: number = 0;

/**
 * Trail marks keep sampled coordinates in order and show the earlier tick on a
 * tie.
 *
 * Scenarios:
 *
 * 1. A moving object yields a line, full ticks, then the highlighted tick. At 0.5
 *    seconds the samples at zero and one are equally near.
 * 2. A stationary root yields one unanchored tick and its highlight, with a plain
 *    `trail` path and no line.
 */
export function test_render_scene_mark_inspection_trails(): void {
  const trails: IAutoMovieInspectionTrail[] = [
    {
      path: "person",
      times: [0, 1],
      positions: [1, 2, 3, 4, 5, 6],
      stationary: false,
    },
    {
      path: "",
      times: [0, 1],
      positions: [7, 8, 9, 7, 8, 9],
      stationary: true,
    },
  ];
  const marks: IAutoMovieMark[] = markAutoMovieInspectionTrails(trails, 0.5);
  TestValidator.equals(
    "ordered shapes and paths",
    marks.map((mark: IAutoMovieMark) => [
      mark.path,
      mark.kind,
      mark.shape.type,
      mark.anchor,
    ]),
    [
      ["person/trail", "trail", "polyline", null],
      ["person/trail", "trail", "points", null],
      ["person/trail", "trail/now", "points", null],
      ["trail", "trail", "points", null],
      ["trail", "trail/now", "points", null],
    ],
  );
  assertCoordinates(marks[0]!, [1, 2, 3, 4, 5, 6]);
  assertCoordinates(marks[1]!, [1, 2, 3, 4, 5, 6]);
  assertCoordinates(marks[2]!, [1, 2, 3]);
  assertCoordinates(marks[3]!, [7, 8, 9]);
  assertCoordinates(marks[4]!, [7, 8, 9]);
}

/** Compare the discrete vertex count and numeric coordinates of a trail mark. */
function assertCoordinates(
  mark: IAutoMovieMark,
  expected: readonly number[],
): void {
  const shape: IAutoMovieMark.Shape = mark.shape;
  TestValidator.predicate(
    `${mark.path}/${mark.kind} coordinates`,
    (shape.type === "polyline" || shape.type === "points") &&
      shape.points.length === expected.length &&
      expected.every((coordinate: number, index: number): boolean =>
        nclose(shape.points[index]!, coordinate, POINT_TOLERANCE),
      ),
  );
}
