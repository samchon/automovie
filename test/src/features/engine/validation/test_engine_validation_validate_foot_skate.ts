import { AutoMovieEngineValidation } from "@automovie/engine";
import type {
  IAutoMovieConstraintViolation,
  IAutoMovieFootContactWindow,
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
  violationCount,
} from "../../internal/predicates";

/**
 * `validateFootSkate` advises where a foot declared planted moves faster than
 * its window allows.
 *
 * Fixture: the hips-and-left-leg rig; the root slides 0.2 m along x over 1 s
 * (0.2 m/s), sampled at 2 Hz; the left foot is planted over [0, 1].
 *
 * Scenarios:
 *
 * 1. At a 0.05 m/s limit the slide warns (physics) at
 *    `$input.contacts[0].samples[1].leftFoot.horizontalSpeed` with overshoot
 *    0.2 - 0.05 = 0.15, while succeeding; `physicsIntent` silences it.
 * 2. At a 0.25 m/s limit it succeeds.
 * 3. An undeclared bone `rightFoot` under path `$contactPlan` is a type finding at
 *    `$contactPlan.contacts[0].bone`.
 * 4. Each nonfinite, reversed or empty contact interval reports its own
 *    temporal violation before the shared grid reads it.
 */
export function test_engine_validation_validate_foot_skate(): void {
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
  const key = (time: number, x: number): IAutoMovieKeyframe => ({
    time,
    pose: { skeleton: skeleton.id, root: at(x, 0, 0), joints: [] },
    expression: null,
    easing: "linear",
    bezier: null,
  });
  const motion: IAutoMovieMotion = makeMotion(
    [key(0, 0), key(0.5, 0.1), key(1, 0.2)],
    1,
  );
  const skate = (limit: number, physicsIntent?: string): IAutoMovieValidation =>
    AutoMovieEngineValidation.validateFootSkate({
      motion,
      skeleton,
      contacts: [
        { bone: "leftFoot", start: 0, end: 1, maxHorizontalSpeed: limit },
      ],
      sampleRate: 2,
      ...(physicsIntent === undefined ? {} : { physicsIntent }),
    });

  // 1.
  const slid: IAutoMovieValidation = skate(0.05);
  TestValidator.predicate(
    "slide warns",
    validationHasWarning(
      "slide",
      slid,
      "physics",
      "$input.contacts[0].samples[1].leftFoot.horizontalSpeed",
    ),
  );
  const first: IAutoMovieConstraintViolation | undefined =
    slid.success === true
      ? (slid.warnings ?? []).find(
          (v: IAutoMovieConstraintViolation): boolean =>
            v.path.includes("samples[1]"),
        )
      : undefined;
  TestValidator.predicate(
    "overshoot 0.15",
    first !== undefined &&
      first.kind === "physics" &&
      nclose(first.overshoot ?? -1, 0.15),
  );
  TestValidator.predicate(
    "intent",
    validationHasNoWarnings("intent", skate(0.05, "moonwalk")),
  );

  // 2.
  TestValidator.equals("generous limit", skate(0.25).success, true);

  // 3.
  TestValidator.predicate(
    "undeclared bone",
    hasViolation(
      AutoMovieEngineValidation.validateFootSkate({
        motion,
        skeleton,
        contacts: [
          { bone: "rightFoot", start: 0, end: 1, maxHorizontalSpeed: 0.05 },
        ],
        sampleRate: 2,
        path: "$contactPlan",
      }),
      "type",
      "$contactPlan.contacts[0].bone",
    ),
  );
  const windows: readonly (readonly [number, number])[] = [
    [NaN, 1],
    [0, NaN],
    [-Infinity, 1],
    [0, Infinity],
    [1, 0],
    [1, 1],
  ];
  const invalidWindows: IAutoMovieValidation = AutoMovieEngineValidation.validateFootSkate({
    motion,
    skeleton,
    contacts: windows.map(
      ([start, end]): IAutoMovieFootContactWindow => ({
        bone: "leftFoot",
        start,
        end,
      }),
    ),
    sampleRate: 2,
    path: "$clock",
  });
  TestValidator.predicate(
    "each malformed contact window has exactly its own temporal finding",
    violationCount(invalidWindows) === windows.length &&
      windows.every(
        (_window: readonly [number, number], index: number): boolean =>
          hasViolation(invalidWindows, "temporal", `$clock.contacts[${index}]`),
      ),
  );
}
