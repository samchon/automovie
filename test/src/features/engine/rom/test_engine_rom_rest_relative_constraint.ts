import { AutoMovieEngineHumanoidRestFrame, AutoMovieEngineKinematics } from "@automovie/engine";
import { IAutoMovieJointConstraint } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

const CLINICAL: IAutoMovieJointConstraint = {
  flexion: { min: -60, max: 180 },
  abduction: { min: -30, max: 180 },
  twist: null,
};

/**
 * Reconcile declared degree intervals into rest-relative coordinates using
 * clinical = sign * pose + neutral, while retaining the existing rest-deviation
 * cone policy.
 *
 * Scenarios:
 *
 * 1. Left-arm frame (sign +1, neutral 90): clinical abduction [-30,180] becomes
 *    rest-relative [-120,90].
 * 2. Right-arm frame (sign -1, neutral 90): the same range mirrors and re-sorts to
 *    [-90,120].
 * 3. An axis with no frame entry is untouched (flexion stays [-60,180]); a null
 *    clinical axis stays null (twist).
 * 4. `AutoMovieEngineHumanoidRestFrame` mirrors the two shoulders' abduction.
 * 5. The existing rest-relative swingDeg policy carries through unchanged:
 *    numeric, null and absent values retain their meaning. This does not
 *    establish clinical swing-metric invariance under arbitrary neutral
 *    shifts.
 * 6. A 100 degree cap on wide axes, with the frame abduction +30, keeps the 100
 *    and shifts abduction -180..180 to [-210, 150].
 */
export function test_engine_rom_rest_relative_constraint(): void {
  // 1. sign +1
  const left: IAutoMovieJointConstraint = AutoMovieEngineKinematics.restRelativeConstraint(CLINICAL, {
    abduction: { sign: 1, neutral: 90 },
  });
  TestValidator.predicate(
    "left abduction shifted",
    left.abduction !== null &&
      nclose(left.abduction.min, -120, 0) &&
      nclose(left.abduction.max, 90, 0),
  );

  // 2. sign −1 mirrors + re-sorts
  const right: IAutoMovieJointConstraint = AutoMovieEngineKinematics.restRelativeConstraint(CLINICAL, {
    abduction: { sign: -1, neutral: 90 },
  });
  TestValidator.predicate(
    "right abduction mirrored",
    right.abduction !== null &&
      nclose(right.abduction.min, -90, 0) &&
      nclose(right.abduction.max, 120, 0),
  );

  // 3. no-frame axis untouched; null axis stays null
  TestValidator.predicate(
    "unframed flexion untouched",
    left.flexion !== null &&
      nclose(left.flexion.min, -60, 0) &&
      nclose(left.flexion.max, 180, 0),
  );
  TestValidator.equals("null axis stays null", left.twist, null);

  // 3b. the CLINICAL fixture carries no cone → the reconciled constraint has none
  TestValidator.equals(
    "absent swingDeg stays absent",
    left.swingDeg,
    undefined,
  );

  // 4. the humanoid table mirrors the shoulders
  TestValidator.predicate(
    "left shoulder frame",
    AutoMovieEngineHumanoidRestFrame.leftUpperArm?.abduction?.sign === 1 &&
      nclose(AutoMovieEngineHumanoidRestFrame.leftUpperArm.abduction.neutral, 90, 0),
  );
  TestValidator.predicate(
    "right shoulder mirrored",
    AutoMovieEngineHumanoidRestFrame.rightUpperArm?.abduction?.sign === -1 &&
      nclose(AutoMovieEngineHumanoidRestFrame.rightUpperArm.abduction.neutral, 90, 0),
  );

  // 5. Preserve the existing rest-relative cap policy without asserting clinical metric invariance.
  const coned: IAutoMovieJointConstraint = AutoMovieEngineKinematics.restRelativeConstraint(
    { ...CLINICAL, swingDeg: 180 },
    { abduction: { sign: 1, neutral: 90 } },
  );
  TestValidator.predicate(
    "cone half-angle preserved",
    nclose(coned.swingDeg!, 180, 0),
  );
  TestValidator.predicate(
    "abduction still shifts under the cone",
    coned.abduction !== null &&
      nclose(coned.abduction.min, -120, 0) &&
      nclose(coned.abduction.max, 90, 0),
  );
  const nullCone: IAutoMovieJointConstraint = AutoMovieEngineKinematics.restRelativeConstraint(
    { ...CLINICAL, swingDeg: null },
    { abduction: { sign: 1, neutral: 90 } },
  );
  TestValidator.equals("null cone stays null", nullCone.swingDeg, null);
  const shifted: IAutoMovieJointConstraint = AutoMovieEngineKinematics.restRelativeConstraint(
    {
      flexion: { min: -180, max: 180 },
      abduction: { min: -180, max: 180 },
      twist: null,
      swingDeg: 100,
    },
    { abduction: { sign: 1, neutral: 30 } },
  );
  TestValidator.predicate(
    "a wide shoulder under a 30 degree frame",
    nclose(shifted.swingDeg!, 100, 0) &&
      nclose(shifted.abduction!.min, -210, 0) &&
      nclose(shifted.abduction!.max, 150, 0),
  );
}
