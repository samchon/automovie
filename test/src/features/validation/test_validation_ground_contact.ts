import { validateGroundContact } from "@automovie/engine";
import {
  IAutoMovieConstraintViolation,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeMotion } from "../internal/fixtures";
import {
  hasViolation,
  namedFacts,
  nclose,
  validationHasNoWarnings,
  validationHasWarning,
  validationHasWarningCount,
} from "../internal/predicates";

const restAt: (x: number, y: number, z: number) => IAutoMovieTransform = (
  x: number,
  y: number,
  z: number,
): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

const SKELETON: IAutoMovieSkeleton = {
  id: "skeleton-1",
  bones: [
    { bone: "hips", parent: null, rest: restAt(0, 1, 0), constraint: null },
    {
      bone: "leftUpperLeg",
      parent: "hips",
      rest: restAt(0.1, -0.5, 0),
      constraint: null,
    },
    {
      bone: "leftLowerLeg",
      parent: "leftUpperLeg",
      rest: restAt(0, -0.4, 0),
      constraint: null,
    },
    {
      bone: "leftFoot",
      parent: "leftLowerLeg",
      rest: restAt(0, -0.1, 0),
      constraint: null,
    },
  ],
};

const root: (y: number) => IAutoMovieTransform = (
  y: number,
): IAutoMovieTransform => ({
  translation: { x: 0, y, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

const pose: (rootY: number) => IAutoMoviePose = (
  rootY: number,
): IAutoMoviePose => ({
  skeleton: SKELETON.id,
  root: root(rootY),
  joints: [],
});

const key: (time: number, rootY: number) => IAutoMovieKeyframe = (
  time: number,
  rootY: number,
): IAutoMovieKeyframe => ({
  time,
  pose: pose(rootY),
  expression: null,
  easing: "linear",
  bezier: null,
});

/**
 * Sample motion and FK to advise foot-point penetration below the configured ground plane; malformed rate or tolerance settings fail admission.
 *
 * Scenarios:
 *
 * 1. A root dip below the ground produces physics WARNINGS (D015: advice, not a
 *    gate) with a stable `$input.samples[i].leftFoot.worldPosition.y` path; the
 *    run still succeeds. `physicsIntent` suppresses them.
 * 2. A small dip inside tolerance preserves successful admission; its warning
 *    population is not asserted.
 * 3. A custom ground plane and custom path produce two endpoint warnings rooted
 *    at the custom address; the default-plane midpoint owns the depth assertion.
 * 4. NaN/zero sample rates and NaN tolerance produce located range failures instead of silently skipping the time walk.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual ground-contact sampling and checks advisory penetration paths, the midpoint depth, intent suppression and custom-ground warning count, then requires malformed rate/tolerance errors.
 * @evidence contracts/testing.md#independent-expectations Existing leg rest offsets sum to ground height, so a -0.2 root midpoint gives 0.2m penetration; a 0.1 raised ground over a one-second still clip sampled at 1Hz gives two endpoint warnings. Literal custom paths and numeric overshoot are independent expectations of that geometry and clock.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts dipping/grazing, intentional/unintentional, default/raised ground and default/custom paths, plus nonfinite/zero clocks and nonfinite tolerance. The grazing assertion requires success only, which is weaker than proving no advisory warning.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit reuses its existing generic rig and clip cases to reach portable sampling/FK; it creates no Human asset, new geometry case, browser, renderer or native artifact.
 */
export function test_validation_ground_contact(): void {
  const dipping: IAutoMovieMotion = makeMotion(
    [key(0, 0), key(0.5, -0.2), key(1, 0)],
    1,
  );
  const rejected: IAutoMovieValidation = validateGroundContact({
    motion: dipping,
    skeleton: SKELETON,
    sampleRate: 4,
  });
  TestValidator.predicate(
    "penetration warns but succeeds",
    validationHasWarning(
      "penetrating ground contact",
      rejected,
      "physics",
      "$input.samples[2].leftFoot.worldPosition.y",
    ),
  );
  const mid: IAutoMovieConstraintViolation | null | undefined =
    rejected.success === true
      ? (rejected.warnings ?? []).find(
          (v: IAutoMovieConstraintViolation): boolean =>
            v.path.includes("samples[2]"),
        )
      : null;
  TestValidator.equals(
    "penetration overshoot",
    namedFacts([
      ["refused", (): boolean => mid?.kind === "physics"],
      [
        "violated",
        (): boolean =>
          mid?.kind === "physics" && nclose(mid.overshoot ?? -1, 0.2),
      ],
    ]),
    { refused: true, violated: true },
  );

  // physicsIntent (a phasing ghost) suppresses the penetration warnings.
  const acknowledged: IAutoMovieValidation = validateGroundContact({
    motion: dipping,
    skeleton: SKELETON,
    sampleRate: 4,
    physicsIntent: "phasing",
  });
  TestValidator.predicate(
    "acknowledged penetration is clean",
    validationHasNoWarnings("acknowledged ground contact", acknowledged),
  );

  const grazing: IAutoMovieMotion = makeMotion(
    [key(0, 0), key(0.5, -0.02), key(1, 0)],
    1,
  );
  TestValidator.equals(
    "tolerance accepts graze",
    validateGroundContact({
      motion: grazing,
      skeleton: SKELETON,
      footBones: ["leftFoot"],
      tolerance: 0.03,
    }).success,
    true,
  );

  const raisedGround: IAutoMovieValidation = validateGroundContact({
    motion: makeMotion([key(0, 0), key(1, 0)], 1),
    skeleton: SKELETON,
    footBones: ["leftFoot"],
    groundY: 0.1,
    sampleRate: 1,
    path: "$motion",
  });
  TestValidator.predicate(
    "custom path",
    validationHasWarning(
      "custom ground contact path",
      raisedGround,
      "physics",
      "$motion.samples[0].leftFoot.worldPosition.y",
    ),
  );
  TestValidator.predicate(
    "custom ground samples",
    validationHasWarningCount("raised ground contacts", raisedGround, 2),
  );

  // #1156: a non-finite/non-positive sampleRate empties the sampling clock and
  // a non-finite tolerance makes `y < NaN` always false; either would silently
  // drop every penetration. Both must surface as range errors (not a silent
  // success), matching the sibling sampling validators.
  for (const badRate of [Number.NaN, 0]) {
    const result: IAutoMovieValidation = validateGroundContact({
      motion: dipping,
      skeleton: SKELETON,
      sampleRate: badRate,
    });
    TestValidator.equals(
      `sampleRate ${badRate} is a range error, not a silent skip`,
      namedFacts([
        ["refused", (): boolean => result.success === false],
        [
          "violated",
          (): boolean =>
            result.success === false &&
            hasViolation(result, "range", ".sampleRate"),
        ],
      ]),
      { refused: true, violated: true },
    );
  }
  const badTolerance: IAutoMovieValidation = validateGroundContact({
    motion: dipping,
    skeleton: SKELETON,
    sampleRate: 4,
    tolerance: Number.NaN,
  });
  TestValidator.equals(
    "non-finite tolerance is a range error",
    namedFacts([
      ["refused", (): boolean => badTolerance.success === false],
      [
        "violated",
        (): boolean =>
          badTolerance.success === false &&
          hasViolation(badTolerance, "range", ".tolerance"),
      ],
    ]),
    { refused: true, violated: true },
  );
}
