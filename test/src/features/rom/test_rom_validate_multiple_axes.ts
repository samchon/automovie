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
 * 1. A shoulder read by its three clinical angles (the default table's constraint without its swing-twist gate) at 999-degree flexion and twist produces exactly flexion, swing and twist paths; null abduction contributes zero to the coupled metric, whose periodic representative is 279 degrees.
 * 2. Under the default table, which gates the shoulder by swing and twist, a hanging arm turned 170 degrees about itself (past the 135 the table allows, measured from rest) files exactly a twist fault: its direction is in reach.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls actual ROM validation and compares the complete sorted path population, catching collapsed axis faults, an exempted null swing axis or an extra diagnostic; and under the default table's swing-twist gate, a hanging shoulder turned past its twist files the twist alone, catching a gate that also faults the swing or misses the twist.
 * @evidence contracts/development/testing.md#independent-expectations Both 999-degree axes exceed the default shoulder intervals; the half-angle cosine representative of 999-degree flexion with zero abduction is 279 degrees, beyond the 180-degree cone. A 170-degree turn of a hanging arm exceeds the table's 135 degrees of twist from rest while its direction stays at rest, inside any swing. Literal field paths specify the report independently of collector order.
 * @evidence contracts/development/testing.md#distinguishing-cases This entry owns simultaneous independent-axis and coupled-cone faults with a resting partner, and the swing-twist gate's twist-only fault; accepted, single-axis and immobile-zero cases are separate ROM tests.
 * @evidence contracts/development/testing.md#execution-ownership The named synchronous entry uses the existing joint fixture and a local collector; no pose renderer, process, native artifact or dynamically registered case participates.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 numbered scenarios it runs, each naming the input and the behavior it pins: the three-angle shoulder's flexion, swing and twist paths, and the gated shoulder's twist path alone.
 */
export function test_rom_validate_multiple_axes(): void {
  const collector: ViolationCollector = new ViolationCollector();
  validateJointRom({
    joint: joint("leftUpperArm", { flexion: 999, twist: 999 }),
    // The shoulder's three-angle gate, without the swing-twist one the table
    // gives it, so each clinical axis files its own fault.
    constraint: { ...getConstraint("leftUpperArm", null)!, swingTwist: null },
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

  // 2. The default table's swing-twist gate.
  const gated: ViolationCollector = new ViolationCollector();
  validateJointRom({
    joint: joint("leftUpperArm", { flexion: 0, abduction: 0, twist: 170 }),
    constraint: getConstraint("leftUpperArm", null)!,
    path: "$input",
    collector: gated,
  });
  TestValidator.equals(
    "a hanging shoulder turned 170 degrees files its twist alone",
    gated.items.map((v: IAutoMovieConstraintViolation): string => v.path),
    ["$input.twist"],
  );
}
