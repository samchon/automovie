import {
  clinch
} from "../../../../../packages/motions/src/grappling/internal/clinch";
import { TestValidator } from "@nestia/e2e";

/**
 * `clinch.regions` names a clinch's two grips: a plum clinch cups the nape with
 * both hands spread `clinch.SPREAD` either way; a collar-and-sleeve grip takes
 * the opposite side of the neck with the collar hand and the facing elbow with
 * the other.
 *
 * Scenarios:
 *
 * 1. The plum's hands lie 0.35 m either side of the nape.
 * 2. A right collar takes the left neck and the right elbow; a left collar the
 *    mirror.
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
