import { validateMotion } from "../../../../packages/engine/src/validation/validateMotion";
import { IAutoMovieMotion, IAutoMovieValidation, IAutoMovieKeyframe } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../internal/createSkeleton";
import { createValidMotion } from "../internal/createValidMotion";
import { hasViolation } from "../internal/hasViolation";
import { withoutArraySlot } from "../internal/withoutArraySlot";

/**
 * Exercise the cubic-bezier control contract through motion validation before sampling.
 *
 * Scenarios:
 * 1. Missing, short, nonfinite, sparse and entirely absent control tuples fail at the bezier field.
 * 2. Non-cubic easing with stray controls fails while a dense [0,0,1,1] tuple remains valid.
 * 3. Each X control outside [0,1] fails with a range fault, while Y controls outside that interval remain valid.
 *
 * @evidence contracts/testing.md#behavioral-verification Call validateMotion on existing valid clips with one changed keyframe control tuple, checking failure paths and preserved dense/Y-overshoot success so hole-skipping cannot pass malformed controls.
 * @evidence contracts/testing.md#independent-expectations A cubic-bezier keyframe requires four actual finite controls and X coordinates in inclusive [0,1]; an absent array property is not a numeric control, while Y is unconstrained.
 * @evidence contracts/testing.md#distinguishing-cases Preserve missing/short/nonfinite/stray tuples and both X-bound directions, then add one absent Y slot and four absent slots with valid dense and Y-overshoot controls; easing inversion accuracy is owned by the sampler tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable exported unit uses portable validateMotion plus existing canonical rig/clip fixtures and the shared local sparse-array helper, without loading a host or creating an asset.
 */
export function test_validation_motion_keyframe_bezier(): void {
  const makeMotion: (patch: Partial<IAutoMovieKeyframe>) => ReturnType<typeof createValidMotion> = (
    patch: Partial<IAutoMovieKeyframe>,
  ): ReturnType<typeof createValidMotion> => {
    const base: IAutoMovieMotion = createValidMotion();
    return {
      ...base,
      keyframes: base.keyframes.map((kf: IAutoMovieKeyframe, i: number): IAutoMovieKeyframe =>
        i === 0 ? { ...kf, ...patch } : kf,
      ),
    };
  };

  const invalidCases: {
    name: string;
    patch: Partial<IAutoMovieKeyframe>;
  }[] = [
    {
      name: "cubicBezier without controls",
      patch: { easing: "cubicBezier", bezier: null },
    },
    {
      name: "cubicBezier short tuple",
      patch: {
        easing: "cubicBezier",
        bezier: [0, 0, 1] as unknown as IAutoMovieKeyframe["bezier"],
      },
    },
    {
      name: "cubicBezier non-finite control",
      patch: {
        easing: "cubicBezier",
        bezier: [0, 0, Number.NaN, 1],
      },
    },
    {
      name: "cubicBezier missing y control slot",
      patch: {
        easing: "cubicBezier",
        bezier: withoutArraySlot([0, 0, 1, 1], 1) as IAutoMovieKeyframe["bezier"],
      },
    },
    {
      name: "cubicBezier four absent slots",
      patch: {
        easing: "cubicBezier",
        bezier: new Array<number>(4) as IAutoMovieKeyframe["bezier"],
      },
    },
    {
      name: "linear with stray controls",
      patch: {
        easing: "linear",
        bezier: [0, 0, 1, 1],
      },
    },
  ];

  for (const scenario of invalidCases) {
    const result: IAutoMovieValidation = validateMotion({
      motion: makeMotion(scenario.patch),
      skeleton: createSkeleton(),
    });
    TestValidator.equals(`${scenario.name} fails`, result.success, false);
    TestValidator.predicate(
      `${scenario.name} reports bezier`,
      hasViolation(result, "type", ".bezier"),
    );
  }

  const validCubic: IAutoMovieValidation = validateMotion({
    motion: makeMotion({
      easing: "cubicBezier",
      bezier: [0, 0, 1, 1],
    }),
    skeleton: createSkeleton(),
  });
  TestValidator.equals(
    "valid cubicBezier controls pass",
    validCubic.success,
    true,
  );

  // Finite X controls outside [0,1] fail the declared cubic-bezier domain; Y remains unconstrained.
  const outOfRangeX: {
    label: string;
    bezier: [number, number, number, number];
  }[] = [
    { label: "x1 above 1", bezier: [2, 0, 0, 1] },
    { label: "x1 below 0", bezier: [-0.5, 0, 1, 1] },
    { label: "x2 above 1", bezier: [0, 0, 1.5, 1] },
    { label: "x2 below 0", bezier: [0, 0, -0.2, 1] },
  ];
  for (const { label, bezier } of outOfRangeX) {
    const result: IAutoMovieValidation = validateMotion({
      motion: makeMotion({ easing: "cubicBezier", bezier }),
      skeleton: createSkeleton(),
    });
    TestValidator.equals(`cubicBezier ${label} fails`, result.success, false);
    TestValidator.predicate(
      `cubicBezier ${label} reports a range bezier violation`,
      hasViolation(result, "range", ".bezier"),
    );
  }

  // an unconstrained y outside [0,1] still passes (only x is gated).
  TestValidator.equals(
    "cubicBezier with y outside [0,1] passes",
    validateMotion({
      motion: makeMotion({
        easing: "cubicBezier",
        bezier: [0.25, -2, 0.75, 3],
      }),
      skeleton: createSkeleton(),
    }).success,
    true,
  );
}
