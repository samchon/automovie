import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanProp,
} from "@automovie/interface";
import { everydayTypeCaseBoard, typeText } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/**
 * `everydayTypeCaseBoard` stages a keyboard: its home row at its origin and a
 * key field as wide as the letter rows (`typeText.WIDTH`), the board turned so
 * its +Z side, where the typist sits, faces a typist at the origin facing +Z.
 *
 * Scenarios:
 *
 * 1. Placed at (0, 0.75, 0.4), its home row is there and its +Z faces -Z.
 * 2. Its key field is `typeText.WIDTH` wide.
 */
export function test_unit_motions_executable_everyday_type_case_board(): void {
  const board: IAutoMovieMotionHumanProp = everydayTypeCaseBoard({
    x: 0,
    y: 0.75,
    z: 0.4,
  });
  TestValidator.predicate(
    "placed facing the typist",
    vclose(board.frame.position, { x: 0, y: 0.75, z: 0.4 }, 1e-12) &&
      vclose(
        Quaternion.rotateVector(board.frame.rotation, { x: 0, y: 0, z: 1 }),
        { x: 0, y: 0, z: -1 },
        1e-12,
      ),
  );
  TestValidator.equals(
    "the home row and the key field",
    board.affordances!.map(
      (a: IAutoMovieAffordance): [string, number | undefined] => [
        a.id,
        a.width,
      ],
    ),
    [
      ["homeRow", undefined],
      ["keys", typeText.WIDTH],
    ],
  );
}
