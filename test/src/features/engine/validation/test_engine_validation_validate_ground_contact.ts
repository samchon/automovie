import { AutoMovieEngineValidation } from "@automovie/engine";
import type {
  IAutoMovieConstraintViolation,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeMotion } from "../../internal/fixtures";
import {
  hasViolation,
  nclose,
  validationHasNoWarnings,
  validationHasWarning,
  validationHasWarningCount,
} from "../../internal/predicates";

/**
 * `validateGroundContact` samples a clip through forward kinematics and advises
 * (warns, never fails) where a foot point sinks below the ground; malformed
 * settings fail admission.
 *
 * Fixture: hips at y = 1 over a left leg of rest offsets -0.5, -0.4 and -0.1,
 * so the foot stands on y = 0 when the root is at 0; the root dips to -0.2 at
 * 0.5 s of a 1 s clip, sampled at 4 Hz (sample 2 is the dip).
 *
 * Scenarios:
 *
 * 1. The dip warns (physics) at `$input.samples[2].leftFoot.worldPosition.y` with
 *    overshoot 0.2 while succeeding; `physicsIntent` silences it.
 * 2. A 0.02 dip inside tolerance 0.03 succeeds.
 * 3. A still clip over ground raised to 0.1, at 1 Hz with path `$motion`, warns at
 *    both samples under `$motion.samples[0]...`.
 * 4. A zero or nonfinite sample rate produces a range finding at `.sampleRate`.
 * 5. A nonfinite tolerance produces a range finding at `.tolerance`, even when it
 *    would hide the dip in the sampled clip.
 */
export function test_engine_validation_validate_ground_contact(): void {
  const at = (x: number, y: number, z: number): IAutoMovieTransform => ({
    translation: { x, y, z },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  });
  const skeleton: IAutoMovieSkeleton = {
    id: "skeleton-1",
    bones: [
      { bone: "hips", parent: null, rest: at(0, 1, 0), constraint: null },
      {
        bone: "leftUpperLeg",
        parent: "hips",
        rest: at(0.1, -0.5, 0),
        constraint: null,
      },
      {
        bone: "leftLowerLeg",
        parent: "leftUpperLeg",
        rest: at(0, -0.4, 0),
        constraint: null,
      },
      {
        bone: "leftFoot",
        parent: "leftLowerLeg",
        rest: at(0, -0.1, 0),
        constraint: null,
      },
    ],
  };
  const key = (time: number, y: number): IAutoMovieKeyframe => ({
    time,
    pose: { skeleton: skeleton.id, root: at(0, y, 0), joints: [] },
    expression: null,
    easing: "linear",
    bezier: null,
  });
  const dipping: IAutoMovieMotion = makeMotion(
    [key(0, 0), key(0.5, -0.2), key(1, 0)],
    1,
  );

  // 1.
  const dipped: IAutoMovieValidation = AutoMovieEngineValidation.validateGroundContact({
    motion: dipping,
    skeleton,
    sampleRate: 4,
  });
  TestValidator.predicate(
    "dip warns",
    validationHasWarning(
      "dip",
      dipped,
      "physics",
      "$input.samples[2].leftFoot.worldPosition.y",
    ),
  );
  const mid: IAutoMovieConstraintViolation | undefined =
    dipped.success === true
      ? (dipped.warnings ?? []).find(
          (v: IAutoMovieConstraintViolation): boolean =>
            v.path.includes("samples[2]"),
        )
      : undefined;
  TestValidator.predicate(
    "overshoot 0.2",
    mid !== undefined &&
      mid.kind === "physics" &&
      nclose(mid.overshoot ?? -1, 0.2),
  );
  TestValidator.predicate(
    "intent",
    validationHasNoWarnings(
      "intent",
      AutoMovieEngineValidation.validateGroundContact({
        motion: dipping,
        skeleton,
        sampleRate: 4,
        physicsIntent: "phasing",
      }),
    ),
  );

  // 2.
  TestValidator.equals(
    "graze",
    AutoMovieEngineValidation.validateGroundContact({
      motion: makeMotion([key(0, 0), key(0.5, -0.02), key(1, 0)], 1),
      skeleton,
      footBones: ["leftFoot"],
      tolerance: 0.03,
    }).success,
    true,
  );

  // 3.
  const raised: IAutoMovieValidation = AutoMovieEngineValidation.validateGroundContact({
    motion: makeMotion([key(0, 0), key(1, 0)], 1),
    skeleton,
    footBones: ["leftFoot"],
    groundY: 0.1,
    sampleRate: 1,
    path: "$motion",
  });
  TestValidator.predicate(
    "raised ground",
    validationHasWarning(
      "raised",
      raised,
      "physics",
      "$motion.samples[0].leftFoot.worldPosition.y",
    ) && validationHasWarningCount("raised", raised, 2),
  );

  // 4.
  const zero: IAutoMovieValidation = AutoMovieEngineValidation.validateGroundContact({
    motion: dipping,
    skeleton,
    sampleRate: 0,
  });
  TestValidator.predicate(
    "rate 0",
    zero.success === false && hasViolation(zero, "range", ".sampleRate"),
  );

  const settingsFailures: string[] = [];
  for (const field of ["sampleRate", "tolerance"] as const) {
    for (const value of [NaN, Infinity]) {
      try {
        const result: IAutoMovieValidation = AutoMovieEngineValidation.validateGroundContact({
          motion: dipping,
          skeleton,
          sampleRate: 4,
          [field]: value,
        });
        if (!hasViolation(result, "range", `.${field}`))
          settingsFailures.push(`${field} ${value} did not return its finding`);
      } catch (error: unknown) {
        settingsFailures.push(`${field} ${value} threw ${String(error)}`);
      }
    }
  }
  TestValidator.equals(
    "nonfinite settings return range findings",
    settingsFailures,
    [],
  );
}
