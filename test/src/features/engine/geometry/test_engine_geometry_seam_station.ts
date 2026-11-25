import {
  AutoMovieNaturalSpline,
  AutoMovieSeamStation,
} from "@automovie/engine";
import type { IAutoMovieLoftChain } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * `AutoMovieSeamStation` is the station rule along a chain: `curvatures` and
 * `slopes` are the natural cubic spline's second and first derivatives at the
 * stations for every column, `continuous` puts them on a chain's layers except
 * the kept ones, and `copy` signs a shared owner layer into a neighbour's
 * station direction.
 *
 * Fixture: stations 0, 1, 3, 4 with columns (0, 2, 1, 3) and the constant 1,
 * the same knots `AutoMovieNaturalSpline` reads independently.
 *
 * Scenarios:
 *
 * 1. The first column's curvatures are (0, -3.75, 3.75, 0) and its slopes the
 *    natural spline's derivatives at each station within 1e-12; the constant
 *    column's are all 0.
 * 2. `continuous` of a four-layer chain at those stations (mm) gives each layer
 *    those slopes and curvatures; a kept layer keeps its own, and a kept layer
 *    without curvatures is refused.
 * 3. `copy` with factor -1 negates the first derivatives and keeps the second; an
 *    unframed owner's plane is the horizontal plane at its station; an owner
 *    without jets is refused.
 * 4. `flat` and `unflat` are inverse.
 */
export function test_engine_geometry_seam_station(): void {
  const t: number[] = [0, 1, 3, 4];
  const values: number[][] = [
    [0, 1],
    [2, 1],
    [1, 1],
    [3, 1],
  ];
  const near = (
    a: readonly number[],
    b: readonly number[],
    e: number = 1e-12,
  ): boolean =>
    a.every((x: number, i: number): boolean => Math.abs(x - b[i]!) <= e);
  const spline = AutoMovieNaturalSpline.create(t, [0, 2, 1, 3]);

  // 1.
  const M: number[][] = AutoMovieSeamStation.curvatures(t, values);
  TestValidator.predicate(
    "curvatures",
    near(
      M.map((r) => r[0]!),
      [0, -3.75, 3.75, 0],
    ) && M.every((r) => r[1] === 0),
  );
  const S: number[][] = AutoMovieSeamStation.slopes(t, values, M);
  TestValidator.predicate(
    "slopes",
    near(
      S.map((r) => r[0]!),
      t.map(
        (x: number): number => AutoMovieNaturalSpline.derivative(spline, x)[0],
      ),
    ) && S.every((r) => Math.abs(r[1]!) <= 1e-15),
  );

  // 2.
  const layer = (y: number, c: number[]): IAutoMovieLoftChain.ILayer => ({
    y,
    coefficients: c,
    slopes: [0, 0],
  });
  const chain: IAutoMovieLoftChain = {
    name: "seam",
    basis: "spline",
    order: 1,
    rule: "polar",
    samples: 1,
    layers: t.map(
      (y: number, k: number): IAutoMovieLoftChain.ILayer =>
        layer(y, values[k]!),
    ),
  };
  const solved: IAutoMovieLoftChain = AutoMovieSeamStation.continuous(chain);
  TestValidator.predicate(
    "continuous",
    solved.layers.every(
      (l, k: number): boolean =>
        near(l.slopes, S[k]!) && near(l.curvatures!, M[k]!),
    ),
  );
  const own: IAutoMovieLoftChain.ILayer = {
    ...layer(1, values[1]!),
    slopes: [9, 9],
    curvatures: [7, 7],
  };
  const kept: IAutoMovieLoftChain = AutoMovieSeamStation.continuous(
    {
      ...chain,
      layers: [chain.layers[0]!, own, chain.layers[2]!, chain.layers[3]!],
    },
    [1],
  );
  TestValidator.equals(
    "kept",
    [kept.layers[1]!.slopes, kept.layers[1]!.curvatures],
    [
      [9, 9],
      [7, 7],
    ],
  );
  TestValidator.predicate(
    "kept bare",
    throwsError(
      (): unknown => AutoMovieSeamStation.continuous(chain, [1]),
      "Kept layer 1 of seam carries no curvatures",
    ),
  );

  // 3.
  const frame = {
    origin: [1, 2, 3],
    u: [4, 5, 6],
    v: [7, 8, 9],
  } satisfies IAutoMovieLoftChain.ILayer["frameSlopes"];
  const owner: IAutoMovieLoftChain.ILayer = {
    y: 5,
    coefficients: [1, 2],
    slopes: [3, -4],
    curvatures: [5, 6],
    frameSlopes: frame,
    frameCurvatures: frame,
  };
  const copied = AutoMovieSeamStation.copy(owner, -1);
  TestValidator.equals(
    "copy",
    [
      copied.slopes,
      copied.curvatures,
      copied.frameSlopes,
      copied.frameCurvatures,
      copied.plane,
    ],
    [
      [-3, 4],
      [5, 6],
      [-1, -2, -3, -4, -5, -6, -7, -8, -9],
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
      [0, 5, 0, 1, 0, 0, 0, 0, 1],
    ],
  );
  TestValidator.predicate(
    "no jets",
    throwsError(
      (): unknown => AutoMovieSeamStation.copy(layer(5, [1, 2]), 1),
      "carries no jets",
    ),
  );

  // 4.
  TestValidator.equals(
    "flat",
    AutoMovieSeamStation.unflat(AutoMovieSeamStation.flat(frame)),
    frame,
  );
}
