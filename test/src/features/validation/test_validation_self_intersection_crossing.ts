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
  namedFacts,
  nclose,
  validationHasWarning,
  validationHasNoWarnings,
} from "../internal/predicates";

const restAt: (x: number, y: number, z: number) => IAutoMovieTransform = (x: number, y: number, z: number): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

/**
 * Two capsules whose centerlines pierce each other as an X: `armA` runs along
 * the world x-axis from (-1,0,0) to (1,0,0), `armB` along the z-axis from
 * (0,0,-1) to (0,0,1). They cross at the origin, interior to both: the two
 * centerlines share a point, so the true distance is 0.
 *
 * Every capsule endpoint sits a full unit from the other centerline, so the
 * retired four-endpoint approximation measured this pair 1 m apart and the
 * forced self-intersection check passed it; the exact clamped solver reads the
 * real 0 and produces advisory feedback.
 */
const crossSkeleton: () => IAutoMovieSkeleton = (): IAutoMovieSkeleton => ({
  id: "cross",
  bones: [
    { bone: "hips", parent: null, rest: restAt(0, 0, 0), constraint: null },
    {
      bone: "leftUpperArm",
      parent: "hips",
      rest: restAt(-1, 0, 0),
      constraint: null,
    },
    {
      bone: "leftLowerArm",
      parent: "hips",
      rest: restAt(1, 0, 0),
      constraint: null,
    },
    {
      bone: "rightUpperArm",
      parent: "hips",
      rest: restAt(0, 0, -1),
      constraint: null,
    },
    {
      bone: "rightLowerArm",
      parent: "hips",
      rest: restAt(0, 0, 1),
      constraint: null,
    },
  ],
});

const pose: (target: IAutoMovieSkeleton) => IAutoMoviePose = (target: IAutoMovieSkeleton): IAutoMoviePose => ({
  skeleton: target.id,
  root: restAt(0, 0, 0),
  joints: [],
});

const key: (target: IAutoMovieSkeleton, time: number) => IAutoMovieKeyframe = (target: IAutoMovieSkeleton, time: number): IAutoMovieKeyframe => ({
  time,
  pose: pose(target),
  expression: null,
  easing: "linear",
  bezier: null,
});

/**
 * The interior X-crossing the endpoint approximation missed is now caught: two
 * capsule centerlines passing through each other's middle report distance 0
 * (overshoot = the full radius sum), where the old four-candidate minimum saw a
 * unit gap and passed. A second pair whose capsules cross far outside each
 * other's spans still passes, so the metric gate remains the crossing itself,
 * not mere axis alignment.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs sampled proxy intersection on two interior-crossing centrelines and observes a physics warning with full-radius overshoot. Moving one segment outside the other's span must produce no warnings, so unconditional advisory output cannot satisfy the positive twin.
 * @evidence contracts/testing.md#independent-expectations Authored X/Z segments share the origin, giving zero separation and overshoot 0.1+0.1=0.2; the shifted segment begins at Z=2, beyond the same radius sum. Coordinates independently distinguish bounded intersection from infinite-line crossing; no rendered surface penetration is inferred.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts a true interior crossing with the same axis directions separated outside their bounded spans, retaining the located first-sample warning and overshoot. Collapsed segments and malformed annotations belong to the neighboring focused units.
 * @evidence contracts/testing.md#execution-ownership This named unit directly invokes portable motion sampling, FK and capsule warning semantics using existing authored records. It acquires no viewer, GPU or Human figure host and owns its local assertions without dynamic registration.
 */
export function test_validation_self_intersection_crossing(): void {
  const skeleton: IAutoMovieSkeleton = crossSkeleton();
  const motion: ReturnType<typeof makeMotion> = makeMotion([key(skeleton, 0), key(skeleton, 1)], 1);

  const crossing: ReturnType<typeof validateSelfIntersection> = validateSelfIntersection({
    motion,
    skeleton,
    pairs: [
      {
        first: { from: "leftUpperArm", to: "leftLowerArm", radius: 0.1 },
        second: { from: "rightUpperArm", to: "rightLowerArm", radius: 0.1 },
      },
    ],
    sampleRate: 1,
  });
  TestValidator.predicate(
    "interior X-crossing warns but succeeds",
    validationHasWarning(
      "crossing self-intersection",
      crossing,
      "physics",
      "$input.pairs[0].samples[0].distance",
    ),
  );
  const fired: IAutoMovieConstraintViolation | undefined | null =
    crossing.success === true
      ? (crossing.warnings ?? []).find((entry: IAutoMovieConstraintViolation): boolean =>
          entry.path.includes("samples[0]"),
        )
      : null;
  TestValidator.equals(
    "X-crossing overshoot is the full radius sum",
    namedFacts([
      ["firedKindPhysics", (): boolean => fired?.kind === "physics"],
      [
        "ncloseFiredOvershoot",
        (): boolean => fired?.kind === "physics" && nclose(fired.overshoot ?? -1, 0.2),
      ],
    ]),
    { firedKindPhysics: true, ncloseFiredOvershoot: true },
  );

  // Shift armB entirely off to +z (spanning z in [2,3]) so the centerlines no
  // longer cross within their spans: the nearest approach is armA's midpoint
  // (0,0,0) to armB's near end (0,0,2), distance 2 > 0.2, so it passes.
  const clearSkeleton: IAutoMovieSkeleton = {
    id: "cross-clear",
    bones: [
      { bone: "hips", parent: null, rest: restAt(0, 0, 0), constraint: null },
      {
        bone: "leftUpperArm",
        parent: "hips",
        rest: restAt(-1, 0, 0),
        constraint: null,
      },
      {
        bone: "leftLowerArm",
        parent: "hips",
        rest: restAt(1, 0, 0),
        constraint: null,
      },
      {
        bone: "rightUpperArm",
        parent: "hips",
        rest: restAt(0, 0, 2),
        constraint: null,
      },
      {
        bone: "rightLowerArm",
        parent: "hips",
        rest: restAt(0, 0, 3),
        constraint: null,
      },
    ],
  };
  TestValidator.predicate(
    "off-span capsules pass",
    validationHasNoWarnings("off-span capsules",
    validateSelfIntersection({
      motion: makeMotion([key(clearSkeleton, 0), key(clearSkeleton, 1)], 1),
      skeleton: clearSkeleton,
      pairs: [
        {
          first: { from: "leftUpperArm", to: "leftLowerArm", radius: 0.1 },
          second: { from: "rightUpperArm", to: "rightLowerArm", radius: 0.1 },
        },
      ],
      sampleRate: 1,
    })),
  );
}
