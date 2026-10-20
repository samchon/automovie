import {
  type IAutoMovieRecoveryEventCurveArc,
  AutoMovieRecoveryEventCurve as E,
  type IAutoMovieRecoveryEventChartInput,
  compileAutoMovieRecoveryEventDomain,
} from "@automovie/recovery";

import { TestValidator } from "@nestia/e2e";

import type { IAutoMovieCurve64 as C } from "../../../../packages/engine/src/geometry/curve/IAutoMovieCurve64";
import { realizeAutoMovieBicubicAtlas64 } from "../../../../packages/engine/src/geometry/realizeAutoMovieBicubicAtlas64";
import { nclose } from "../internal/nclose";

/**
 * Actual engine realization consumes the compiled four-side Coons field.
 *
 * Scenarios:
 * 1. One affine patch and either orientation retain the declared square area.
 * 2. Independent opposite-side knots produce two or four conforming cells.
 * 3. Insufficient patch capacity and unequal corner authorities are refused.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls maintained coefficient compilation and the public bicubic atlas realizer, then measures actual triangle area and orientation. Changed boundary coefficients, false shared corners or a dropped tensor cell change these observations.
 * @evidence contracts/testing.md#independent-expectations The four specified straight sides bound a three-by-three millimetre planar square, with area 9e-6 square metres and positive Z chart normal. Reversing chart winding changes signed area only. A retained midpoint knot splits that same square into two exact affine fields.
 * @evidence contracts/testing.md#distinguishing-cases Covers one patch, an opposite-side knot union, both winding signs, explicit insufficient patch budget, nonmeeting corners and independent source-fit qualification. Native-parent partial-interval assembly is a separate owner and is not certified by this test.
 * @evidence contracts/testing.md#execution-ownership Generic portable CPU curves reach the actual maintained engine without a fitter, source mesh, anatomical fixture, process, filesystem, viewer or GPU.
 */
export function test_geometry_recovery_event_domain(): void {
  const a: C.Vector = [0, 0, 0],
    b: C.Vector = [3, 0, 0],
    c: C.Vector = [0, 3, 0],
    d: C.Vector = [3, 3, 0];
  const input: IAutoMovieRecoveryEventChartInput = {
    id: "square",
    winding: 1,
    chart: {
      bottom: E.line(a, b, "bottom"),
      top: E.line(c, d, "top"),
      left: E.line(a, c, "left"),
      right: E.line(b, d, "right"),
    },
  };
  const policy: Parameters<typeof compileAutoMovieRecoveryEventDomain>[1] = {
    maxPatches: 8,
    maxCells: 128,
    maxVertices: 1024,
    toleranceMm: 0.01,
    nativeParentBindings: true,
  };
  const inspect: (
    value: IAutoMovieRecoveryEventChartInput,
    patches: number,
  ) => void = (
    value: IAutoMovieRecoveryEventChartInput,
    patches: number,
  ): void => {
    const compiled: ReturnType<typeof compileAutoMovieRecoveryEventDomain> =
      compileAutoMovieRecoveryEventDomain(value, policy);
    if (!compiled.complete)
      throw new Error("The declared affine domain fits its patch budget");
    TestValidator.equals(
      "declared patch count",
      compiled.recipe.patches.length,
      patches,
    );
    TestValidator.equals(
      "source fit stays independent",
      compiled.recipe.sourceFit!.qualified,
      false,
    );
    TestValidator.equals(
      "corner owners are exact",
      compiled.maximumConstructedSharedEndpointDifferenceMm,
      0,
    );
    const realized: ReturnType<typeof realizeAutoMovieBicubicAtlas64> =
      realizeAutoMovieBicubicAtlas64(compiled.recipe);
    TestValidator.equals("complete actual field", realized.complete, true);
    const positions: number[] = realized.mesh.positions,
      indices: number[] = realized.mesh.indices!;
    let signedArea: number = 0,
      area: number = 0;
    for (let i: number = 0; i < indices.length; i += 3) {
      const ia: number = indices[i]! * 3,
        ib: number = indices[i + 1]! * 3,
        ic: number = indices[i + 2]! * 3;
      const x: number = positions[ib]! - positions[ia]!,
        y: number = positions[ib + 1]! - positions[ia + 1]!,
        z: number = positions[ib + 2]! - positions[ia + 2]!;
      const u: number = positions[ic]! - positions[ia]!,
        v: number = positions[ic + 1]! - positions[ia + 1]!,
        w: number = positions[ic + 2]! - positions[ia + 2]!;
      signedArea += (x * v - y * u) / 2;
      area += Math.hypot(y * w - z * v, z * u - x * w, x * v - y * u) / 2;
    }
    TestValidator.predicate("physical square area", nclose(area, 9e-6, 1e-14));
    TestValidator.predicate(
      "explicit chart winding",
      nclose(signedArea, value.winding * 9e-6, 1e-14),
    );
  };
  inspect(input, 1);
  inspect({ ...input, id: "negative", winding: -1 }, 1);
  const splitBottom: IAutoMovieRecoveryEventCurveArc = E.concatenate(
    [
      E.line(a, [1.5, 0, 0], "bottom-first"),
      E.line([1.5, 0, 0], b, "bottom-second"),
    ],
    "bottom-composite",
  );
  const divided: IAutoMovieRecoveryEventChartInput = {
    ...input,
    id: "divided",
    chart: { ...input.chart, bottom: splitBottom },
  };
  inspect(divided, 2);
  const splitLeft: IAutoMovieRecoveryEventCurveArc = E.concatenate(
    [
      E.line(a, [0, 1.5, 0], "left-first"),
      E.line([0, 1.5, 0], c, "left-second"),
    ],
    "left-composite",
  );
  inspect(
    {
      ...divided,
      id: "two-by-two",
      chart: { ...divided.chart, left: splitLeft },
    },
    4,
  );
  const refused: ReturnType<typeof compileAutoMovieRecoveryEventDomain> =
    compileAutoMovieRecoveryEventDomain(divided, { ...policy, maxPatches: 1 });
  TestValidator.equals(
    "finite patch budget retains refusal",
    refused.complete,
    false,
  );
  if (refused.complete)
    throw new Error("Two native cells cannot fit one patch budget");
  TestValidator.equals("required cell denominator", refused.requiredPatches, 2);
  TestValidator.error("different corner coefficients refused", (): void => {
    compileAutoMovieRecoveryEventDomain(
      {
        ...input,
        chart: { ...input.chart, left: E.line([0.01, 0, 0], c, "wrong-left") },
      },
      policy,
    );
  });
}
