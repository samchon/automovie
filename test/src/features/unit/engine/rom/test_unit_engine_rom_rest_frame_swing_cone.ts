import {
  ViolationCollector,
  clampJointRom,
  restRelativeConstraint,
  validateJointRom,
} from "@automovie/engine";
import {
  IAutoMovieJointConstraint,
  type IAutoMovieRestFrame,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { joint } from "../../../internal/fixtures";
import { nclose } from "../../../internal/predicates";

/** A shoulder-like clinical ball joint: axes wide, only the swing cone capping. */
const CLINICAL_SHOULDER: IAutoMovieJointConstraint = {
  flexion: { min: -180, max: 180 },
  abduction: { min: -180, max: 180 },
  twist: null,
  swingDeg: 100,
};

/** The rig's rest frame: the shoulder sits at 30° abduction, this side +. */
const FRAME: IAutoMovieRestFrame = { abduction: { sign: 1, neutral: 30 } };

const passesCone: (
  j: ReturnType<typeof joint>,
  constraint: IAutoMovieJointConstraint,
) => boolean = (
  j: ReturnType<typeof joint>,
  constraint: IAutoMovieJointConstraint,
): boolean => {
  const collector: IAutoMovieViolationCollector = new ViolationCollector();
  validateJointRom({ joint: j, constraint, path: "$input", collector });
  return collector.items.length === 0;
};

/**
 * Preserve the existing rest-relative swing policy through frame reconciliation, then observe its detection and clamp behavior. The unchanged cap is a policy, not proof that clinical swing is invariant under neutral shifts.
 *
 * Scenarios:
 *
 * 1. The 100-degree policy survives while framed abduction becomes [-210,150].
 * 2. A rest-relative 90/90-degree corner lies inside both axis intervals but reports one swing fault with 20-degree overshoot.
 * 3. Clamping with the reconciled constraint reduces the corner, preserves its one-to-one direction and yields a pose that validates.
 */
export function test_unit_engine_rom_rest_frame_swing_cone(): void {
  const reconciled: IAutoMovieJointConstraint = restRelativeConstraint(
    CLINICAL_SHOULDER,
    FRAME,
  );

  // 1. cone preserved through the shift; the framed axis genuinely shifted
  TestValidator.predicate(
    "cone survives reconciliation",
    nclose(reconciled.swingDeg!, 100, 0),
  );
  TestValidator.predicate(
    "abduction shifted by the rest frame",
    reconciled.abduction !== null &&
      nclose(reconciled.abduction.min, -210, 0) &&
      nclose(reconciled.abduction.max, 150, 0),
  );

  // 2. a corner pose past the cone is caught BY the reconciled constraint
  const corner: ReturnType<typeof joint> = joint("leftUpperArm", {
    flexion: 90,
    abduction: 90,
  });
  const collector: IAutoMovieViolationCollector = new ViolationCollector();
  validateJointRom({
    joint: corner,
    constraint: reconciled,
    path: "$input",
    collector,
  });
  TestValidator.equals(
    "reconciled cone flags the corner once",
    collector.items.length,
    1,
  );
  TestValidator.predicate(
    "flagged on the swing path",
    collector.items[0]!.path.endsWith(".swing"),
  );
  TestValidator.predicate(
    "overshoot is 120 − 100 = 20°",
    nclose(collector.items[0]!.overshoot!, 20),
  );

  // 3. clamp against the reconciled constraint pulls it back onto the cone
  const clamped: ReturnType<typeof joint> = clampJointRom(corner, reconciled);
  TestValidator.predicate("flexion pulled in below 90", clamped.flexion! < 90);
  TestValidator.predicate(
    "1:1 swing direction preserved",
    nclose(clamped.flexion!, clamped.abduction!),
  );
  TestValidator.predicate(
    "clamped pose now passes the reconciled cone",
    passesCone(clamped, reconciled),
  );
}
