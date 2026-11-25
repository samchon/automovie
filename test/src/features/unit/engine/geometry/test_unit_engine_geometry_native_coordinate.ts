import { AutoMovieNativeCoordinate } from "@automovie/engine";
import type {
  IAutoMovieLoftViewRead,
  IAutoMovieNativeCoordinate,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/predicates";

/**
 * `AutoMovieNativeCoordinate.locate(values, component, half, target)` finds the
 * point of a section whose coordinate `component` is `target`, on the half of
 * the other coordinate's sign `half`.
 *
 * Fixture: the exact ellipse x^2 / a^2 + z^2 / b^2 = 1, a = 3 scale and b = 2
 * scale (shoulders sqrt 2 - 1), for scales 0.001, 1 and 1000. Its roots are x =
 * half a sqrt(1 - z^2 / b^2) and z = half b sqrt(1 - x^2 / a^2). Limit: 1e-10
 * max(1, scale), binary64 root and native inversion.
 *
 * Scenarios:
 *
 * 1. For both coordinates and halves and targets of shares -1, -0.93, -0.5, 0,
 *    0.31, 0.87 and 1 of the extent: the point is the root, the residual is its
 *    coordinate minus the target, the phase is the point's polar angle, the
 *    iterations lie in [0, 64], and none at the supports (shares -1 and 1).
 * 2. Targets 1e-6 of the extent past either support, NaN and Infinity are refused
 *    with an Error, as is a collapsed section of zero extents.
 * 3. A throwing extent getter's own exception passes through unchanged.
 */
export function test_unit_engine_geometry_native_coordinate(): void {
  const refused = (label: string, job: () => unknown): void => {
    let error: unknown = null;
    try {
      job();
    } catch (caught: unknown) {
      error = caught;
    }
    TestValidator.predicate(label, error instanceof Error);
  };
  const components: (0 | 1)[] = [0, 1];
  const halves: (1 | -1)[] = [1, -1];

  for (const scale of [0.001, 1, 1000]) {
    const a: number = 3 * scale;
    const b: number = 2 * scale;
    const values: IAutoMovieLoftViewRead.IValues = {
      extents: [a, b, a, b],
      shoulders: [
        Math.SQRT2 - 1,
        Math.SQRT2 - 1,
        Math.SQRT2 - 1,
        Math.SQRT2 - 1,
      ],
    };
    const limit: number = 1e-10 * Math.max(1, scale);

    // 1.
    for (const component of components)
      for (const half of halves)
        for (const share of [-1, -0.93, -0.5, 0, 0.31, 0.87, 1]) {
          const label: string = `${scale}/${component}/${half}/${share}`;
          const target: number = share * (component === 0 ? a : b);
          const result: IAutoMovieNativeCoordinate.IResult =
            AutoMovieNativeCoordinate.locate(values, component, half, target);
          const other: number =
            half * (component === 0 ? b : a) * Math.sqrt(1 - share * share);
          const expected: number[] =
            component === 0 ? [target, other] : [other, target];
          const radius: number = Math.hypot(...result.point);
          TestValidator.predicate(
            `${label} point`,
            result.point.every((v: number, i: number): boolean =>
              nclose(v, expected[i]!, limit),
            ),
          );
          TestValidator.predicate(
            `${label} residual`,
            nclose(result.point[component] - target, result.residual, limit),
          );
          TestValidator.predicate(
            `${label} phase`,
            Math.hypot(
              result.point[0] - radius * Math.cos(result.phase),
              result.point[1] - radius * Math.sin(result.phase),
            ) <= limit,
          );
          TestValidator.predicate(
            `${label} iterations`,
            share === -1 || share === 1
              ? result.iterations === 0
              : result.iterations >= 0 && result.iterations <= 64,
          );
        }

    // 2.
    for (const target of [b * (1 + 1e-6), -b * (1 + 1e-6), NaN, Infinity])
      refused(`${scale} target ${target}`, (): unknown =>
        AutoMovieNativeCoordinate.locate(values, 1, 1, target),
      );
  }
  const values: IAutoMovieLoftViewRead.IValues = {
    extents: [1, 1, 1, 1],
    shoulders: [0.4, 0.4, 0.4, 0.4],
  };
  refused("collapsed", (): unknown =>
    AutoMovieNativeCoordinate.locate(
      { ...values, extents: [0, 0, 0, 0] },
      1,
      1,
      0,
    ),
  );

  // 3.
  const marker: Error = new Error("original coordinate datum");
  const extents: number[] = [1, 1, 1, 1];
  Object.defineProperty(extents, 1, {
    get: (): never => {
      throw marker;
    },
  });
  let caught: unknown = null;
  try {
    AutoMovieNativeCoordinate.locate({ ...values, extents }, 1, 1, 0);
  } catch (error: unknown) {
    caught = error;
  }
  TestValidator.predicate("getter exception kept", caught === marker);
}
