import { validateFootSkate } from "@automovie/engine";
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
  violationCount,
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

const root: (x: number, z: number) => IAutoMovieTransform = (
  x: number,
  z: number,
): IAutoMovieTransform => ({
  translation: { x, y: 0, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

const pose: (x: number, z: number) => IAutoMoviePose = (
  x: number,
  z: number,
): IAutoMoviePose => ({
  skeleton: SKELETON.id,
  root: root(x, z),
  joints: [],
});

const key: (time: number, x: number, z: number) => IAutoMovieKeyframe = (
  time: number,
  x: number,
  z: number,
): IAutoMovieKeyframe => ({
  time,
  pose: pose(x, z),
  expression: null,
  easing: "linear",
  bezier: null,
});

/**
 * Declared planted-foot windows receive advisory horizontal-speed findings; malformed contact annotations remain admission errors.
 *
 * Scenarios:
 *
 * 1. A planted left foot that slides 0.1m over 0.5s exceeds a 0.05m/s limit and
 *    reports a physics WARNING (D015: advice, not a gate) on the stable contact
 *    sample path; the run still succeeds. `physicsIntent` (a deliberate slide)
 *    suppresses it.
 * 2. Raising the allowed speed preserves successful admission for the same clip;
 *    this assertion does not inspect its warning population.
 * 3. Invalid annotation inputs report deterministic non-physics failures (errors)
 *    and do not attempt FK sampling.
 * 4. A no-drift contact with default path, rate, and tolerance succeeds.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual sampled FK foot-skate validation and checks a stable warning path with its speed overshoot, intent suppression, accepted higher tolerance/default no-drift input and four malformed annotation findings.
 * @evidence contracts/testing.md#independent-expectations The existing untranslated leg offsets place the foot at ground and root displacement 0.1m over 0.5s gives 0.2m/s, 0.15 beyond the 0.05 limit. Literal bone/window/speed/rate addresses judge invalid annotation reporting independently of sampling output.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts sliding/default-still, strict/looser speed and intentional/unintentional motion, plus missing bone, reversed window, negative speed and zero sample rate. Higher tolerance and no-drift assertions require success but do not independently require an empty warning population.
 * @evidence contracts/testing.md#execution-ownership The named synchronous entry owns the existing generic rig/clip records and directly reaches portable motion/FK semantics, without a Human asset, new geometry case, renderer or process.
 */
export function test_validation_foot_skate(): void {
  const sliding: IAutoMovieMotion = makeMotion(
    [key(0, 0, 0), key(0.5, 0.1, 0), key(1, 0.2, 0)],
    1,
  );
  const rejected: IAutoMovieValidation = validateFootSkate({
    motion: sliding,
    skeleton: SKELETON,
    contacts: [
      { bone: "leftFoot", start: 0, end: 1, maxHorizontalSpeed: 0.05 },
    ],
    sampleRate: 2,
  });
  TestValidator.predicate(
    "foot skate warns but succeeds",
    validationHasWarning(
      "rejected foot skate",
      rejected,
      "physics",
      "$input.contacts[0].samples[1].leftFoot.horizontalSpeed",
    ),
  );
  const first: IAutoMovieConstraintViolation | null | undefined =
    rejected.success === true
      ? (rejected.warnings ?? []).find(
          (v: IAutoMovieConstraintViolation): boolean =>
            v.path.includes("samples[1]"),
        )
      : null;
  TestValidator.equals(
    "foot skate overshoot",
    namedFacts([
      ["firstKindPhysics", (): boolean => first?.kind === "physics"],
      [
        "ncloseFirstOvershoot",
        (): boolean =>
          first?.kind === "physics" && nclose(first.overshoot ?? -1, 0.15),
      ],
    ]),
    { firstKindPhysics: true, ncloseFirstOvershoot: true },
  );

  // physicsIntent (a deliberate moonwalk) suppresses the skate warning.
  const acknowledged: IAutoMovieValidation = validateFootSkate({
    motion: sliding,
    skeleton: SKELETON,
    contacts: [
      { bone: "leftFoot", start: 0, end: 1, maxHorizontalSpeed: 0.05 },
    ],
    sampleRate: 2,
    physicsIntent: "moonwalk",
  });
  TestValidator.predicate(
    "acknowledged skate is clean",
    validationHasNoWarnings("acknowledged foot skate", acknowledged),
  );

  TestValidator.equals(
    "tolerance accepts planted drift",
    validateFootSkate({
      motion: sliding,
      skeleton: SKELETON,
      contacts: [
        { bone: "leftFoot", start: 0, end: 1, maxHorizontalSpeed: 0.25 },
      ],
      sampleRate: 2,
    }).success,
    true,
  );

  const invalid: IAutoMovieValidation = validateFootSkate({
    motion: sliding,
    skeleton: SKELETON,
    contacts: [
      { bone: "rightFoot", start: 0.8, end: 0.2, maxHorizontalSpeed: -1 },
    ],
    sampleRate: 0,
    path: "$contactPlan",
  });
  TestValidator.predicate(
    "invalid bone",
    hasViolation(invalid, "type", "$contactPlan.contacts[0].bone"),
  );
  TestValidator.predicate(
    "invalid window",
    hasViolation(invalid, "temporal", "$contactPlan.contacts[0]"),
  );
  TestValidator.predicate(
    "invalid speed",
    hasViolation(
      invalid,
      "range",
      "$contactPlan.contacts[0].maxHorizontalSpeed",
    ),
  );
  TestValidator.predicate(
    "invalid sample rate",
    hasViolation(invalid, "range", "$contactPlan.sampleRate"),
  );
  TestValidator.equals("invalid annotation count", violationCount(invalid), 4);

  TestValidator.equals(
    "default contact succeeds",
    validateFootSkate({
      motion: makeMotion([key(0, 0, 0), key(1, 0, 0)], 1),
      skeleton: SKELETON,
      contacts: [{ bone: "leftFoot", start: 0, end: 1 }],
    }).success,
    true,
  );
}
