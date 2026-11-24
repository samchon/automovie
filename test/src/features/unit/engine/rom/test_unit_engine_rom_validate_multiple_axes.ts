import {
  ViolationCollector,
  getConstraint,
  validateJointRom,
} from "@automovie/engine";
import {
  IAutoMovieConstraintViolation,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { joint } from "../../../internal/fixtures";

/**
 * Independent axis faults and a coupled swing fault retain separate correction addresses.
 *
 * Scenarios:
 * 1. A shoulder read by its three clinical angles (the default table's constraint without its swing-twist gate) at 999-degree flexion and twist produces exactly flexion, swing and twist paths; null abduction contributes zero to the coupled metric, whose periodic representative is 279 degrees.
 * 2. Under the default table, which gates the shoulder by swing and twist, a hanging arm turned 170 degrees about itself (past the 135 the table allows, measured from rest) files exactly a twist fault: its direction is in reach.
 */
export function test_unit_engine_rom_validate_multiple_axes(): void {
  const collector: IAutoMovieViolationCollector = new ViolationCollector();
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
  const gated: IAutoMovieViolationCollector = new ViolationCollector();
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
