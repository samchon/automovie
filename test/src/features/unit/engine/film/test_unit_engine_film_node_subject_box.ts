import { nodeSubjectBox } from "@automovie/engine";
import type {
  IAutoMovieSubjectBox,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/**
 * `nodeSubjectBox` places a node's rest extent in the world: a vertical
 * segment at the node's place when the extent has no horizontal size,
 * otherwise the axis-aligned box of its eight placed corners.
 *
 * Scenarios:
 *
 * 1. A heights-only extent 0…1.8 at (2, 0.5, -3) is the segment from
 *    (2, 0.5, -3) to (2, 2.3, -3).
 * 2. The extent x 0…2, y 0…1, z -1…1 turned a quarter about +Y, which takes
 *    (x, y, z) to (z, y, -x), and placed at (10, 0, 0) fills x 9…11, y 0…1,
 *    z -2…0.
 */
export function test_unit_engine_film_node_subject_box(): void {
  const place = (
    x: number,
    y: number,
    z: number,
    turned: boolean,
  ): IAutoMovieTransform => ({
    translation: { x, y, z },
    rotation: turned
      ? { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 }
      : { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  });
  const close = (
    actual: IAutoMovieSubjectBox,
    expected: IAutoMovieSubjectBox,
  ): boolean =>
    vclose(actual.min, expected.min, 1e-12) &&
    vclose(actual.max, expected.max, 1e-12);
  TestValidator.predicate(
    "a heights-only extent is a segment at the node",
    close(
      nodeSubjectBox(place(2, 0.5, -3, false), {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 0, y: 1.8, z: 0 },
      }),
      { min: { x: 2, y: 0.5, z: -3 }, max: { x: 2, y: 2.3, z: -3 } },
    ),
  );
  TestValidator.predicate(
    "a turned box is bounded by its placed corners",
    close(
      nodeSubjectBox(place(10, 0, 0, true), {
        min: { x: 0, y: 0, z: -1 },
        max: { x: 2, y: 1, z: 1 },
      }),
      { min: { x: 9, y: 0, z: -2 }, max: { x: 11, y: 1, z: 0 } },
    ),
  );
}
