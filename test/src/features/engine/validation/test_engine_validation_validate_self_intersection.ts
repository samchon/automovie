import { AutoMovieEngineValidation } from "@automovie/engine";
import type {
  IAutoMovieConstraintViolation,
  IAutoMovieKeyframe,
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
} from "../../internal/predicates";

/**
 * `validateSelfIntersection` warns where two declared capsules' centrelines,
 * measured as bounded segments, come closer than the sum of their radii.
 *
 * Fixture: from the hips at the origin, a left capsule from (-1,0,0) to (1,0,0)
 * and a right one from (0,0,-1) to (0,0,1), radius 0.1 each, still over 1 s at
 * 1 Hz. The segments cross at the origin (distance 0) although every endpoint
 * is 1 m from the other segment.
 *
 * Scenarios:
 *
 * 1. The crossing warns (physics) at `$input.pairs[0].samples[0].distance` with
 *    overshoot 0.2, the radius sum, while succeeding; `physicsIntent` silences
 *    it.
 * 2. The right capsule moved to z in [2, 3], same direction, is clear.
 * 3. A collapsed capsule (two bones at one point) through the other segment warns
 *    too.
 * 4. Sample rate 0 fails with a range finding at `.sampleRate`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers centreline crossing, separation and a collapsed capsule, including intent and rate variants.
 * @evidence contracts/development/testing.md#behavioral-verification Calls validateSelfIntersection on a typed static clip and authored capsule pairs under several sampling or intent choices.
 * @evidence contracts/development/testing.md#independent-expectations The perpendicular segments cross at zero distance, so their 0.1-metre radii sum to overshoot 0.2. The shifted segment cannot cross, and a point on the other segment retains zero centreline distance.
 */
export function test_engine_validation_validate_self_intersection(): void {
  const at = (x: number, y: number, z: number): IAutoMovieTransform => ({
    translation: { x, y, z },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  });
  const skeleton = (
    id: string,
    a: [number, number, number],
    b: [number, number, number],
    c: [number, number, number],
    d: [number, number, number],
  ): IAutoMovieSkeleton => ({
    id,
    bones: [
      { bone: "hips", parent: null, rest: at(0, 0, 0), constraint: null },
      {
        bone: "leftUpperArm",
        parent: "hips",
        rest: at(...a),
        constraint: null,
      },
      {
        bone: "leftLowerArm",
        parent: "hips",
        rest: at(...b),
        constraint: null,
      },
      {
        bone: "rightUpperArm",
        parent: "hips",
        rest: at(...c),
        constraint: null,
      },
      {
        bone: "rightLowerArm",
        parent: "hips",
        rest: at(...d),
        constraint: null,
      },
    ],
  });
  const check = (
    target: IAutoMovieSkeleton,
    extra: { sampleRate?: number; physicsIntent?: string } = {},
  ): IAutoMovieValidation => {
    const key = (time: number): IAutoMovieKeyframe => ({
      time,
      pose: { skeleton: target.id, root: at(0, 0, 0), joints: [] },
      expression: null,
      easing: "linear",
      bezier: null,
    });
    return AutoMovieEngineValidation.validateSelfIntersection({
      motion: makeMotion([key(0), key(1)], 1),
      skeleton: target,
      pairs: [
        {
          first: { from: "leftUpperArm", to: "leftLowerArm", radius: 0.1 },
          second: { from: "rightUpperArm", to: "rightLowerArm", radius: 0.1 },
        },
      ],
      sampleRate: 1,
      ...extra,
    });
  };
  const cross: IAutoMovieSkeleton = skeleton(
    "cross",
    [-1, 0, 0],
    [1, 0, 0],
    [0, 0, -1],
    [0, 0, 1],
  );

  // 1.
  const crossing: IAutoMovieValidation = check(cross);
  TestValidator.predicate(
    "crossing warns",
    validationHasWarning(
      "crossing",
      crossing,
      "physics",
      "$input.pairs[0].samples[0].distance",
    ),
  );
  const fired: IAutoMovieConstraintViolation | undefined =
    crossing.success === true
      ? (crossing.warnings ?? []).find(
          (v: IAutoMovieConstraintViolation): boolean =>
            v.path.includes("samples[0]"),
        )
      : undefined;
  TestValidator.predicate(
    "overshoot 0.2",
    fired !== undefined &&
      fired.kind === "physics" &&
      nclose(fired.overshoot ?? -1, 0.2),
  );
  TestValidator.predicate(
    "intent",
    validationHasNoWarnings(
      "intent",
      check(cross, { physicsIntent: "contact" }),
    ),
  );

  // 2.
  TestValidator.predicate(
    "off span",
    validationHasNoWarnings(
      "off span",
      check(skeleton("clear", [-1, 0, 0], [1, 0, 0], [0, 0, 2], [0, 0, 3])),
    ),
  );

  // 3.
  TestValidator.predicate(
    "collapsed",
    validationHasWarning(
      "collapsed",
      check(skeleton("collapsed", [0, 0, 0], [0, 0, 0], [0, 0, -1], [0, 0, 1])),
      "physics",
      "$input.pairs[0].samples[0].distance",
    ),
  );

  // 4.
  const zero: IAutoMovieValidation = check(cross, { sampleRate: 0 });
  TestValidator.predicate(
    "rate 0",
    zero.success === false && hasViolation(zero, "range", ".sampleRate"),
  );
}
