import {
  clinch
} from "../../../../../packages/motions/src/grappling/internal/clinch";
import { TestValidator } from "@nestia/e2e";

/**
 * Check the target regions selected for each clinch grip.
 *
 * Scenarios:
 *
 * 1. A plum clinch uses both hands around the nape with 0.35 m offsets to
 *    either side.
 * 2. A right collar selects the left neck and right elbow. A left collar
 *    mirrors the pair.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases specify both grip styles and both collar sides.
 * @evidence contracts/development/testing.md#behavioral-verification The region helper returns exact hand, offset and body-region records.
 * @evidence contracts/development/testing.md#independent-expectations The expected records enumerate the two sides from the authored partner-relative choice.
 */
export function test_motions_grappling_clinch(): void {
  TestValidator.equals(
    "the plum and both collars",
    [
      clinch.regions("plum", "right"),
      clinch.regions("collarSleeve", "right"),
      clinch.regions("collarSleeve", "left"),
    ],
    [
      {
        left: { region: "nape", across: -0.35 },
        right: { region: "nape", across: 0.35 },
      },
      {
        right: { region: "neckLeft", across: 0 },
        left: { region: "elbowRight", across: 0 },
      },
      {
        left: { region: "neckRight", across: 0 },
        right: { region: "elbowLeft", across: 0 },
      },
    ],
  );
}
