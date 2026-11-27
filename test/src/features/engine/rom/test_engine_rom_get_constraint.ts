import { DEFAULT_HUMANOID_ROM, AutoMovieEngineKinematics } from "@automovie/engine";
import type { IAutoMovieJointConstraint } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** A constraint unlike any default. */
const OVERRIDE: IAutoMovieJointConstraint = {
  flexion: { min: 0, max: 1 },
  abduction: null,
  twist: null,
};

/**
 * `getConstraint` answers the override when given, else the default humanoid
 * table entry, else null.
 *
 * Scenarios:
 *
 * 1. An override wins over the table.
 * 2. Without one, the table entry for the bone is answered.
 * 3. A bone with no table entry gives null.
 * 4. The table read through it pins the elbow flexion 0..150 with no abduction,
 *    the knee flexion minimum 0 with neither abduction nor twist, the
 *    shoulder's 180 degree swing cap whose maximal flexion corner stays inside
 *    it, and the hip's 120 degree cone, which pure flexion 120 reaches and the
 *    corner of maximal flexion and abduction (120, 45) exceeds. The values are
 *    the table's own (see DEFAULT_HUMANOID_ROM), whose hip abduction of 45
 *    rising to 60 with the hip flexed 90 is the AAOS 1965 norm tabulated by
 *    Cejudo, Sainz de Baranda, Santonja and Ayala (2016, SporTK 5(1):35-46,
 *    Table 1).
 */
export function test_engine_rom_get_constraint(): void {
  TestValidator.predicate(
    "the override",
    AutoMovieEngineKinematics.getConstraint("leftUpperArm", OVERRIDE) === OVERRIDE,
  );
  TestValidator.predicate(
    "the table entry",
    AutoMovieEngineKinematics.getConstraint("leftUpperArm", null) === DEFAULT_HUMANOID_ROM.leftUpperArm,
  );
  TestValidator.predicate(
    "no entry",
    DEFAULT_HUMANOID_ROM.hips !== undefined ||
      AutoMovieEngineKinematics.getConstraint("hips", null) === null,
  );
  const elbow: IAutoMovieJointConstraint = AutoMovieEngineKinematics.getConstraint("leftLowerArm", null)!;
  const knee: IAutoMovieJointConstraint = AutoMovieEngineKinematics.getConstraint("leftLowerLeg", null)!;
  TestValidator.predicate(
    "elbow and knee",
    nclose(elbow.flexion!.min, 0, 0) &&
      nclose(elbow.flexion!.max, 150, 0) &&
      elbow.abduction === null &&
      nclose(knee.flexion!.min, 0, 0) &&
      knee.abduction === null &&
      knee.twist === null,
  );
  const shoulder: IAutoMovieJointConstraint = AutoMovieEngineKinematics.getConstraint(
    "leftUpperArm",
    null,
  )!;
  TestValidator.predicate(
    "the shoulder cone",
    nclose(shoulder.swingDeg!, 180, 0) &&
      nclose(AutoMovieEngineKinematics.getConstraint("rightUpperArm", null)!.swingDeg!, 180, 0) &&
      AutoMovieEngineKinematics.swingConeAngle(shoulder.flexion!.max, shoulder.abduction!.max) <=
        shoulder.swingDeg! &&
      nclose(AutoMovieEngineKinematics.swingConeAngle(shoulder.flexion!.max, 0), 180, 1e-9),
  );
  const hip: IAutoMovieJointConstraint = AutoMovieEngineKinematics.getConstraint("leftUpperLeg", null)!;
  TestValidator.predicate(
    "the hip cone",
    nclose(hip.swingDeg!, 120, 0) &&
      nclose(AutoMovieEngineKinematics.getConstraint("rightUpperLeg", null)!.swingDeg!, 120, 0) &&
      nclose(AutoMovieEngineKinematics.swingConeAngle(hip.flexion!.max, 0), hip.swingDeg!, 1e-9) &&
      AutoMovieEngineKinematics.swingConeAngle(hip.flexion!.max, hip.abduction!.max) > hip.swingDeg!,
  );
}
