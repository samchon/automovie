import { validateSelfIntersection } from "@automovie/engine";
import {
  IAutoMovieKeyframe,
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeMotion } from "../internal/fixtures";
import { validationHasWarning } from "../internal/predicates";

const restAt: (x: number, y: number, z: number) => IAutoMovieTransform = (x: number, y: number, z: number): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

/**
 * Distinct bones `hips` and `spine` share the origin because the child has a zero rest offset, so their capsule centreline collapses to a point. The `leftUpperArm` to `leftLowerArm` chain places the other capsule across that point.
 */
const skeleton: IAutoMovieSkeleton = {
  id: "collapsed",
  bones: [
    { bone: "hips", parent: null, rest: restAt(0, 0, 0), constraint: null },
    { bone: "spine", parent: "hips", rest: restAt(0, 0, 0), constraint: null },
    {
      bone: "leftUpperArm",
      parent: "hips",
      rest: restAt(-1, 0, 0),
      constraint: null,
    },
    {
      bone: "leftLowerArm",
      parent: "leftUpperArm",
      rest: restAt(2, 0, 0),
      constraint: null,
    },
  ],
};

const pose: IAutoMoviePose = {
  skeleton: skeleton.id,
  root: restAt(0, 0, 0),
  joints: [],
};

const key: (time: number) => IAutoMovieKeyframe = (time: number): IAutoMovieKeyframe => ({
  time,
  pose,
  expression: null,
  easing: "linear",
  bezier: null,
});

/**
 * A capsule with distinct endpoint bones at one world point has zero separation from a second centreline through that point, inside the summed radii.
 *
 * The retired four-endpoint approximation could propagate NaN from a collapsed span and suppress its warning. The current shared clamped segment solver handles degenerate spans explicitly; this regression observes the resulting distance warning through the validator rather than attributing it to the retired implementation.
 *
 * Scenarios:
 * 1. Distinct bones at one world point collapse the first centreline; a second bounded segment through that point must emit the addressed advisory warning.
 *
 * @evidence contracts/testing.md#behavioral-verification Samples the actual self-intersection validator with distinct endpoint bones whose world positions coincide. The coincident capsule and a second centreline through the origin must produce an addressed advisory distance warning instead of silently passing a nonfinite distance comparison.
 * @evidence contracts/testing.md#independent-expectations Authored rest offsets place the collapsed segment at the origin and the other segment across [-1,1] on X, so their separation is zero and less than radii 0.3+0.15. This geometric oracle concerns supplied proxies, not a Human skin mesh or anatomical measurement.
 * @evidence contracts/testing.md#distinguishing-cases This existing regression isolates coincident world endpoints while keeping distinct declared bone identities. The ordinary suite owns malformed annotations, rates, separated proxies and intent suppression; the crossing unit owns two noncollapsed interior spans.
 * @evidence contracts/testing.md#execution-ownership The named portable unit invokes sampling/FK and geometric warning production through an existing authored motion fixture. It starts no simulation world, viewer or Human inspection host and registers no extra cases.
 */
export function test_validation_self_intersection_collapsed(): void {
  const result: ReturnType<typeof validateSelfIntersection> = validateSelfIntersection({
    motion: makeMotion([key(0), key(1)], 1),
    skeleton,
    pairs: [
      {
        first: { from: "hips", to: "spine", radius: 0.3 },
        second: { from: "leftUpperArm", to: "leftLowerArm", radius: 0.15 },
      },
    ],
    sampleRate: 1,
  });

  TestValidator.predicate(
    "collapsed-centerline overlap no longer slips through as NaN",
    validationHasWarning(
      "collapsed self-intersection",
      result,
      "physics",
      "$input.pairs[0].samples[0].distance",
    ),
  );
}
