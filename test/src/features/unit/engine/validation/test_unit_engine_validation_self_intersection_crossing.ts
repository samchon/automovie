import { validateSelfIntersection } from "@automovie/engine";
import {
  IAutoMovieConstraintViolation,
  IAutoMovieKeyframe,
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeMotion } from "../../../internal/fixtures";
import {
  namedFacts,
  nclose,
  validationHasNoWarnings,
  validationHasWarning,
} from "../../../internal/predicates";

const restAt: (x: number, y: number, z: number) => IAutoMovieTransform = (
  x: number,
  y: number,
  z: number,
): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

/**
 * The X-axis centreline from (-1,0,0) to (1,0,0) and Z-axis centreline from
 * (0,0,-1) to (0,0,1) cross at their shared interior origin, so their
 * separation is zero.
 *
 * Every endpoint sits one metre from the other centreline. The retired endpoint
 * approximation missed the intersection; the clamped segment solver reports
 * zero separation and produces advisory feedback.
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

const pose: (target: IAutoMovieSkeleton) => IAutoMoviePose = (
  target: IAutoMovieSkeleton,
): IAutoMoviePose => ({
  skeleton: target.id,
  root: restAt(0, 0, 0),
  joints: [],
});

const key: (target: IAutoMovieSkeleton, time: number) => IAutoMovieKeyframe = (
  target: IAutoMovieSkeleton,
  time: number,
): IAutoMovieKeyframe => ({
  time,
  pose: pose(target),
  expression: null,
  easing: "linear",
  bezier: null,
});

/**
 * The interior crossing reports zero separation and full-radius overshoot.
 * Moving the second capsule outside the bounded spans removes the warning while
 * preserving the axis directions.
 *
 * Scenarios:
 *
 * 1. Interior X/Z centreline crossing emits a warning with overshoot equal to the
 *    full 0.2-metre radius sum.
 * 2. Shifting the second segment to Z in [2,3] preserves the axis directions and
 *    produces no warnings outside the bounded spans.
 */
export function test_unit_engine_validation_self_intersection_crossing(): void {
  const skeleton: IAutoMovieSkeleton = crossSkeleton();
  const motion: ReturnType<typeof makeMotion> = makeMotion(
    [key(skeleton, 0), key(skeleton, 1)],
    1,
  );

  const crossing: ReturnType<typeof validateSelfIntersection> =
    validateSelfIntersection({
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
      ? (crossing.warnings ?? []).find(
          (entry: IAutoMovieConstraintViolation): boolean =>
            entry.path.includes("samples[0]"),
        )
      : null;
  TestValidator.equals(
    "X-crossing overshoot is the full radius sum",
    namedFacts([
      ["firedKindPhysics", (): boolean => fired?.kind === "physics"],
      [
        "ncloseFiredOvershoot",
        (): boolean =>
          fired?.kind === "physics" && nclose(fired.overshoot ?? -1, 0.2),
      ],
    ]),
    { firedKindPhysics: true, ncloseFiredOvershoot: true },
  );

  // Moving armB to Z in [2,3] gives bounded separation 2 > 0.2 from armA's midpoint, so the proxy pair has no warning.
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
    validationHasNoWarnings(
      "off-span capsules",
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
      }),
    ),
  );
}
