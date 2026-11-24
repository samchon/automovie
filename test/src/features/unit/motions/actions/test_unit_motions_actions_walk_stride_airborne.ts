import { walkStride } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `walkStride.airborne` is the foot in the air of an entry in stride: the one
 * not planted while the other is.
 *
 * Scenarios:
 *
 * 1. Both feet planted, or neither, is no entry in stride.
 * 2. The left foot planted leaves the right in the air, and the other way round.
 */
export function test_unit_motions_actions_walk_stride_airborne(): void {
  const entry = (left: boolean, right: boolean): walkStride.IFeet => ({
    feet: { left: { planted: left }, right: { planted: right } },
  });
  TestValidator.equals(
    "both or neither",
    [
      walkStride.airborne(entry(true, true)),
      walkStride.airborne(entry(false, false)),
    ],
    [undefined, undefined],
  );
  TestValidator.equals(
    "one in the air",
    [
      walkStride.airborne(entry(true, false)),
      walkStride.airborne(entry(false, true)),
    ],
    ["right", "left"],
  );
}
