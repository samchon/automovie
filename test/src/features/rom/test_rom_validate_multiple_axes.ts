import {
  ViolationCollector,
  getConstraint,
  validateJointRom,
} from "@automovie/engine";
import { IAutoMovieConstraintViolation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { joint } from "../internal/fixtures";

/**
 * Independent axis faults and a coupled swing fault retain separate correction addresses.
 *
 * Scenarios:
 * 1. A shoulder at 999-degree flexion and twist produces exactly flexion, swing and twist paths; null abduction contributes zero to the coupled metric, whose periodic representative is 279 degrees.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual ROM validation and compares the complete sorted path population, catching collapsed axis faults, an exempted null swing axis or an extra diagnostic.
 * @evidence contracts/testing.md#independent-expectations Both 999-degree axes exceed the default shoulder intervals; the half-angle cosine representative of 999-degree flexion with zero abduction is 279 degrees, beyond the 180-degree cone. Literal field paths specify the report independently of collector order.
 * @evidence contracts/testing.md#distinguishing-cases This entry owns simultaneous independent-axis and coupled-cone faults with a resting partner; accepted, single-axis and immobile-zero cases are separate ROM tests.
 * @evidence contracts/testing.md#execution-ownership The named synchronous entry uses the existing joint fixture and a local collector; no pose renderer, process, native artifact or dynamically registered case participates.
 */
export function test_rom_validate_multiple_axes(): void {
  const collector: ViolationCollector = new ViolationCollector();
  validateJointRom({
    joint: joint("leftUpperArm", { flexion: 999, twist: 999 }),
    constraint: getConstraint("leftUpperArm", null)!,
    path: "$input",
    collector,
  });
  const paths: string[] = collector.items.map(
    (v: IAutoMovieConstraintViolation): string => v.path,
  );
  TestValidator.equals(
    "each bad axis files its own violation, and the swing cone files its own",
    [...paths].sort((a: string, b: string): number =>
      a < b ? -1 : a > b ? 1 : 0,
    ),
    ["$input.flexion", "$input.swing", "$input.twist"],
  );
}
