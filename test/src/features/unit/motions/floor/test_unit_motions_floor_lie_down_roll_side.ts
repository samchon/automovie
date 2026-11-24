import { lieDownRollSide } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `lieDownRollSide` names the side a lateral lie rolls onto, and none for a
 * position that does not roll.
 *
 * Scenarios:
 *
 * 1. `lateralLeft` rolls left and `lateralRight` right.
 * 2. Supine and prone roll onto no side.
 */
export function test_unit_motions_floor_lie_down_roll_side(): void {
  TestValidator.equals(
    "the lateral positions",
    [
      lieDownRollSide({ position: "lateralLeft" }),
      lieDownRollSide({ position: "lateralRight" }),
    ],
    ["left", "right"],
  );
  TestValidator.equals(
    "no roll",
    [
      lieDownRollSide({ position: "supine" }),
      lieDownRollSide({ position: "prone" }),
    ],
    [undefined, undefined],
  );
}
