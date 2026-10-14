import { validateSelfIntersection } from "@automovie/engine";
import {
  IAutoMovieKeyframe,
  IAutoMovieConstraintViolation,
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
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

const restAt: (x: number, y: number, z: number) => IAutoMovieTransform = (x: number, y: number, z: number): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

const skeleton: (offset: number) => IAutoMovieSkeleton = (offset: number): IAutoMovieSkeleton => ({
  id: `skeleton-${offset}`,
  bones: [
    { bone: "hips", parent: null, rest: restAt(0, 0, 0), constraint: null },
    { bone: "spine", parent: "hips", rest: restAt(0, 1, 0), constraint: null },
    {
      bone: "leftUpperArm",
      parent: "hips",
      rest: restAt(offset, 0.5, 0),
      constraint: null,
    },
    {
      bone: "leftLowerArm",
      parent: "leftUpperArm",
      rest: restAt(0.2, 0, 0),
      constraint: null,
    },
    {
      bone: "rightUpperArm",
      parent: "hips",
      rest: restAt(1, 0, 0),
      constraint: null,
    },
    {
      bone: "rightLowerArm",
      parent: "rightUpperArm",
      rest: restAt(0, 1, 0),
      constraint: null,
    },
  ],
});

const root: () => IAutoMovieTransform = (): IAutoMovieTransform => ({
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

const pose: (target: IAutoMovieSkeleton) => IAutoMoviePose = (target: IAutoMovieSkeleton): IAutoMoviePose => ({
  skeleton: target.id,
  root: root(),
  joints: [],
});

const key: (target: IAutoMovieSkeleton, time: number) => IAutoMovieKeyframe = (target: IAutoMovieSkeleton, time: number): IAutoMovieKeyframe => ({
  time,
  pose: pose(target),
  expression: null,
  easing: "linear",
  bezier: null,
});

const pair: Parameters<typeof validateSelfIntersection>[0]["pairs"][number] = {
  first: { from: "hips", to: "spine", radius: 0.2 },
  second: { from: "leftUpperArm", to: "leftLowerArm", radius: 0.15 },
} as const;

/**
 * `validateSelfIntersection` pins the first proxy-based self-intersection
 * check: callers declare non-adjacent capsule pairs, and the validator warns on
 * sampled frames where their centerlines are closer than the sum of radii.
 *
 * Scenarios:
 *
 * 1. A forearm capsule crossing near the torso capsule produces a physics WARNING
 *    (D015: a plausibility signal, not a gate) with a stable
 *    `$input.pairs[i].samples[j].distance` path; the run still succeeds. The
 *    same crossing acknowledged with `physicsIntent` suppresses it entirely.
 * 2. Moving the same proxy pair away from the torso succeeds, proving the
 *    centerline-distance threshold is the metric gate.
 * 3. Invalid proxy annotations report deterministic type/range failures before
 *    sampling.
 * 4. A pair with a valid first capsule and invalid second capsule still skips
 *    sampling after checking both annotations, including missing endpoint and
 *    non-finite radius failures.
 * 5. Invalid sample rates with otherwise valid proxies report only the sample-rate
 *    range failure and do not sample.
 * 6. A parallel non-overlap pair with default path and sample rate succeeds.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs sampled proxy intersection and asserts located physics advice, measured overshoot, intent suppression and independent annotation/rate errors. Separated and parallel inputs must have no warnings, while malformed inputs must retain exactly their addressed failures without sampling.
 * @evidence contracts/testing.md#independent-expectations Authored vertical torso and horizontal arm proxies have separation 0.1 with radii sum 0.35, hence overshoot 0.25; moving the arm origin to X=1 removes overlap. Bone identities and positive finite radius/rate rules independently supply admission expectations, with no clinical anatomy or rendered skin claim.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts near/separated proxies and explicit physics intent; covers identical/missing endpoints, negative/zero/NaN radii, invalid second-only annotations and nonfinite/zero sampling rates, plus the default-rate parallel case. Interior crossings and collapsed spans have separate focused units; discrete sampling does not prove continuous collision freedom.
 * @evidence contracts/testing.md#execution-ownership This named portable unit invokes motion sampling, FK and distance-based warning semantics using existing authored rig/motion records. It starts no Human inspection application, renderer or collision host, and its predicate helpers execute only local assertions.
 */
export function test_validation_self_intersection(): void {
  const crossingSkeleton: IAutoMovieSkeleton = skeleton(0.1);
  const crossing: ReturnType<typeof makeMotion> = makeMotion(
    [key(crossingSkeleton, 0), key(crossingSkeleton, 1)],
    1,
  );
  const rejected: ReturnType<typeof validateSelfIntersection> = validateSelfIntersection({
    motion: crossing,
    skeleton: crossingSkeleton,
    pairs: [pair],
    sampleRate: 1,
  });
  TestValidator.predicate(
    "self-intersection warns but succeeds",
    validationHasWarning(
      "rejected self-intersection",
      rejected,
      "physics",
      "$input.pairs[0].samples[0].distance",
    ),
  );
  const first: IAutoMovieConstraintViolation | undefined | null =
    rejected.success === true
      ? (rejected.warnings ?? []).find((v: IAutoMovieConstraintViolation): boolean => v.path.includes("samples[0]"))
      : null;
  TestValidator.equals(
    "self-intersection overshoot",
    namedFacts([
      ["firstKindPhysics", (): boolean => first?.kind === "physics"],
      [
        "ncloseFirstOvershoot",
        (): boolean => first?.kind === "physics" && nclose(first.overshoot ?? -1, 0.25),
      ],
    ]),
    { firstKindPhysics: true, ncloseFirstOvershoot: true },
  );

  // physicsIntent (close choreography, a grapple) suppresses the warning.
  const acknowledged: ReturnType<typeof validateSelfIntersection> = validateSelfIntersection({
    motion: crossing,
    skeleton: crossingSkeleton,
    pairs: [pair],
    sampleRate: 1,
    physicsIntent: "grapple",
  });
  TestValidator.predicate(
    "acknowledged self-intersection is clean",
    validationHasNoWarnings("acknowledged self-intersection", acknowledged),
  );

  const clearSkeleton: IAutoMovieSkeleton = skeleton(1);
  TestValidator.predicate(
    "distant capsules pass",
    validationHasNoWarnings("distant capsules",
    validateSelfIntersection({
      motion: makeMotion([key(clearSkeleton, 0), key(clearSkeleton, 1)], 1),
      skeleton: clearSkeleton,
      pairs: [pair],
      sampleRate: 1,
    })),
  );

  const invalid: ReturnType<typeof validateSelfIntersection> = validateSelfIntersection({
    motion: crossing,
    skeleton: crossingSkeleton,
    pairs: [
      {
        first: { from: "hips", to: "hips", radius: -1 },
        second: { from: "rightFoot", to: "leftLowerArm", radius: 0 },
      },
    ],
    sampleRate: 1,
    path: "$proxyPlan",
  });
  TestValidator.predicate(
    "invalid same endpoints",
    hasViolation(invalid, "type", "$proxyPlan.pairs[0].first"),
  );
  TestValidator.predicate(
    "invalid missing bone",
    hasViolation(invalid, "type", "$proxyPlan.pairs[0].second.from"),
  );
  TestValidator.predicate(
    "invalid first radius",
    hasViolation(invalid, "range", "$proxyPlan.pairs[0].first.radius"),
  );
  TestValidator.predicate(
    "invalid second radius",
    hasViolation(invalid, "range", "$proxyPlan.pairs[0].second.radius"),
  );
  TestValidator.equals("invalid proxy count", violationCount(invalid), 4);

  const invalidSecond: ReturnType<typeof validateSelfIntersection> = validateSelfIntersection({
    motion: crossing,
    skeleton: crossingSkeleton,
    pairs: [
      {
        first: pair.first,
        second: {
          from: "leftUpperArm",
          to: "rightFoot",
          radius: Number.NaN,
        },
      },
    ],
    sampleRate: 1,
    path: "$secondPlan",
  });
  TestValidator.predicate(
    "invalid second-only missing bone",
    hasViolation(invalidSecond, "type", "$secondPlan.pairs[0].second.to"),
  );
  TestValidator.predicate(
    "invalid second-only non-finite radius",
    hasViolation(invalidSecond, "range", "$secondPlan.pairs[0].second.radius"),
  );
  TestValidator.equals(
    "invalid second-only count",
    violationCount(invalidSecond),
    2,
  );

  const invalidRate: ReturnType<typeof validateSelfIntersection> = validateSelfIntersection({
    motion: crossing,
    skeleton: crossingSkeleton,
    pairs: [pair],
    sampleRate: Number.POSITIVE_INFINITY,
    path: "$ratePlan",
  });
  TestValidator.predicate(
    "non-finite sample rate",
    hasViolation(invalidRate, "range", "$ratePlan.sampleRate"),
  );
  TestValidator.equals("non-finite rate count", violationCount(invalidRate), 1);

  const zeroRate: ReturnType<typeof validateSelfIntersection> = validateSelfIntersection({
    motion: crossing,
    skeleton: crossingSkeleton,
    pairs: [pair],
    sampleRate: 0,
    path: "$zeroRatePlan",
  });
  TestValidator.predicate(
    "zero sample rate",
    hasViolation(zeroRate, "range", "$zeroRatePlan.sampleRate"),
  );
  TestValidator.equals("zero rate count", violationCount(zeroRate), 1);

  TestValidator.predicate(
    "parallel default succeeds",
    validationHasNoWarnings("parallel default capsules",
    validateSelfIntersection({
      motion: makeMotion([key(clearSkeleton, 0), key(clearSkeleton, 1)], 1),
      skeleton: clearSkeleton,
      pairs: [
        {
          first: { from: "hips", to: "spine", radius: 0.1 },
          second: { from: "rightUpperArm", to: "rightLowerArm", radius: 0.1 },
        },
      ],
    })),
  );
}
