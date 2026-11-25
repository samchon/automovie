import {
  AutoMovieConicArc,
  AutoMovieConicFieldJet,
  AutoMovieConicHermite,
  AutoMovieConicHermiteField,
} from "@automovie/engine";
import type {
  IAutoMovieConicArc,
  IAutoMovieConicFieldJet,
  IAutoMovieConicHermite,
  IAutoMovieConicHermiteField,
  IAutoMoviePolarSector,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionConicOracle } from "../../../internal/construction/ConstructionConicOracle";

/**
 * A positive rational clock cannot change the geometric curve or its polar jet.
 *
 * Fixture: a degree-elevated exact ellipse quarter of half extents a and b, as
 * a rational cubic with end weights 1 and k^3, inner weights u k and u k^2,
 * where w = sqrt(1/2), u = (1 + 2 w) / 3 and q = 2 w / (1 + 2 w); weight i
 * scaled by k^i is exactly the reparametrization t = k v / (1 - v + k v), so
 * the curve does not move.
 *
 * Scenarios:
 *
 * 1. For aspects 1 to 64, both orientations, scales 0.001, 1 and 1000, and k from
 *    1e-100 to 1e100, the radius and its two angular derivatives at the ends,
 *    near both ends and at 33 interior shares equal the independent implicit
 *    ellipse's within 2e-9 (the oracle's comparison); a made 0.01 slope error
 *    is rejected by the same comparison.
 * 2. G2 preparations (`AutoMovieConicHermite.create(1, 1, sqrt 2 - 1, tau)`) with
 *    tau from 1e-12 to 1e-240 give a circle: the radius within 1e-7 of 1, and
 *    the polar curvature numerator nonnegative to 256 epsilon of its size, at
 *    seven shares of the arc.
 * 3. The projective readings (`AutoMovieConicHermiteField.projective`) of a patch
 *    at clocks -700, 0 and 700 in the plain and the source-Hessian algebras:
 *    the clocked logarithms equal log w_i + i clock (plus log 3 on the two
 *    inner controls) minus the logarithm of the sum of their exponentials,
 *    computed independently with the largest subtracted, within 1e-9 of their
 *    size; at most four primal reads are spent; two queries share no result
 *    array.
 * 4. Raw rays (`AutoMovieConicArc.locate`) at aspects and scales 0.001, 1 and
 *    1000, shoulders 1e-12 to 1 - epsilon and seven phases are finite, and two
 *    queries share no result array.
 */
export function test_unit_engine_geometry_conic_projective(): void {
  const w: number = Math.SQRT1_2;
  const u: number = (1 + 2 * w) / 3;
  const q: number = (2 * w) / (1 + 2 * w);
  const shares: number[] = [
    0,
    1e-12,
    1 - 1e-12,
    1,
    ...Array.from(
      { length: 33 },
      (_: unknown, i: number): number => (i + 0.3) / 34,
    ),
  ];
  const aspects: number[] = [1, 2, 4, 8, 16, 32, 64];
  const orientations: boolean[] = [false, true];
  const scales: number[] = [0.001, 1, 1000];
  const clocks: number[] = [1e-100, 1e-30, 1e-10, 1, 1e10, 1e30, 1e100];

  // 1.
  const findings: string[] = [];
  const patches: [number, IAutoMovieConicHermite.IPatch][] = [];
  for (const aspect of aspects)
    for (const reverse of orientations)
      for (const scale of scales) {
        const a: number = scale * (reverse ? aspect : 1);
        const b: number = scale * (reverse ? 1 : aspect);
        for (const k of clocks) {
          const patch: IAutoMovieConicHermite.IPatch = {
            extent: a,
            deficit: a,
            height: b,
            native: 1,
            angle: Math.PI / 2,
            curvature: a / (b * b),
            points: [
              [0, 0],
              [0, q],
              [1 - q, 1],
              [1, 1],
            ],
            weights: [1, u * k, u * k * k, k ** 3],
          };
          if (patches.length < 6) patches.push([k, patch]);
          for (const share of shares)
            ConstructionConicOracle.compare(
              findings,
              `ellipse ${aspect}/${reverse}/${scale}/${k}/${share}`,
              AutoMovieConicHermite.radius(patch, share * patch.angle),
              ConstructionConicOracle.ellipse(a, b, share * patch.angle),
              scale,
              2e-9,
            );
        }
      }
  TestValidator.equals("ellipse findings", findings, []);
  const red: string[] = [];
  const expected: IAutoMoviePolarSector.Jet = ConstructionConicOracle.ellipse(
    3,
    2,
    0.3,
  );
  ConstructionConicOracle.compare(
    red,
    "made slope",
    [expected[0], expected[1] + 0.01, expected[2]],
    expected,
    1,
    2e-9,
  );
  TestValidator.predicate(
    "a made 0.01 slope error is rejected",
    red.length !== 0,
  );

  // 2.
  const E: number = Math.SQRT2 - 1;
  for (const tau of [1e-12, 1e-30, 1e-60, 1e-120, 1e-240]) {
    const prepared: IAutoMovieConicHermite.IPatch | string | null =
      AutoMovieConicHermite.create(1, 1, E, tau);
    if (prepared === null || typeof prepared === "string")
      throw new Error(`G2 fixture ${tau}: ${prepared}`);
    for (const share of [0, 0.01, 0.1, 0.5, 0.9, 0.99, 1]) {
      const jet: IAutoMoviePolarSector.Jet = AutoMovieConicHermite.radius(
        prepared,
        share * prepared.angle,
      );
      const turn: number = jet[0] ** 2 + 2 * jet[1] ** 2 - jet[0] * jet[2];
      const floor: number =
        256 *
        Number.EPSILON *
        (jet[0] ** 2 + 2 * jet[1] ** 2 + Math.abs(jet[0] * jet[2]));
      TestValidator.predicate(
        `G2 ${tau}/${share} radius`,
        Math.abs(jet[0] - 1) <= 1e-7,
      );
      TestValidator.predicate(`G2 ${tau}/${share} curvature`, turn >= -floor);
    }
  }

  // 3.
  const independentLogs = (
    patch: IAutoMovieConicHermite.IPatch,
    clock: number,
  ): number[] => {
    const raw: number[] = patch.weights.map(
      (weight: number, i: number): number =>
        Math.log(weight) + (i === 1 || i === 2 ? Math.log(3) : 0) + i * clock,
    );
    const top: number = Math.max(...raw);
    const normalizer: number =
      top +
      Math.log(
        raw.reduce(
          (sum: number, value: number): number => sum + Math.exp(value - top),
          0,
        ),
      );
    return raw.map((value: number): number => value - normalizer);
  };
  const projective = <T>(
    ops: IAutoMovieConicFieldJet.IAlgebra<T>,
    patch: IAutoMovieConicHermite.IPatch<T>,
    first: IAutoMovieConicHermite.IPatch,
    clock: number,
    leading: (value: T) => number,
    label: string,
  ): void => {
    let reads: number = 0;
    const counted: IAutoMovieConicFieldJet.IAlgebra<T> = {
      ...ops,
      value: (value: T): number => {
        reads++;
        return ops.value(value);
      },
    };
    const weights: T[] = patch.weights.map((value: T): T => ops.log(value));
    const actual: IAutoMovieConicHermiteField.IProjective<T> =
      AutoMovieConicHermiteField.projective(counted, patch, weights, clock);
    TestValidator.predicate(`${label} primal reads`, reads <= 4);
    const logs: number[] = independentLogs(first, clock);
    logs.forEach((expectedLog: number, i: number): void => {
      TestValidator.predicate(
        `${label} log ${i} at ${clock}`,
        Math.abs(leading(actual.logs[i]!) - expectedLog) <=
          1e-9 * Math.max(1, Math.abs(expectedLog)),
      );
    });
    const next: IAutoMovieConicHermiteField.IProjective<T> =
      AutoMovieConicHermiteField.projective(ops, patch, weights, clock);
    TestValidator.predicate(
      `${label} separate point arrays`,
      actual.point !== next.point,
    );
    TestValidator.predicate(
      `${label} separate log arrays`,
      actual.logs !== next.logs,
    );
  };
  for (const [k, patch] of patches) {
    const ops: IAutoMovieConicFieldJet.IAlgebra<IAutoMovieConicFieldJet.IJet> =
      AutoMovieConicFieldJet.AD;
    const source: IAutoMovieConicHermite.IPatch<IAutoMovieConicFieldJet.IJet> =
      {
        ...patch,
        extent: ops.constant(patch.extent),
        deficit: ops.constant(patch.deficit),
        height: ops.constant(patch.height),
        native: ops.constant(patch.native),
        curvature: ops.constant(patch.curvature),
        points: patch.points.map(
          (
            p: readonly [number, number],
          ): readonly [
            IAutoMovieConicFieldJet.IJet,
            IAutoMovieConicFieldJet.IJet,
          ] => [ops.constant(p[0]), ops.constant(p[1])],
        ),
        weights: patch.weights.map(
          (v: number, i: number): IAutoMovieConicFieldJet.IJet => [
            v,
            v * ((i + 1) / 8),
            v * ((i - 1) / 16),
            v / 32,
            v / 64,
            -v / 128,
          ],
        ),
      };
    for (const clock of [-700, 0, 700]) {
      projective(
        AutoMovieConicFieldJet.NUMBER,
        patch,
        patch,
        clock,
        (value: number): number => value,
        `number k ${k}`,
      );
      projective(
        ops,
        source,
        patch,
        clock,
        (value: IAutoMovieConicFieldJet.IJet): number => value[0],
        `jet k ${k}`,
      );
    }
  }

  // 4.
  for (const aspect of [0.001, 1, 1000])
    for (const scale of [0.001, 1, 1000])
      for (const r of [1e-12, 0.05, Math.SQRT2 - 1, 0.9, 1 - Number.EPSILON])
        for (const phi of [
          0,
          1e-12,
          0.3,
          Math.PI / 4,
          Math.PI / 2 - 1e-12,
          Math.PI / 2,
        ]) {
          const a: number = aspect * scale;
          const ray: IAutoMovieConicArc.IRay | null = AutoMovieConicArc.locate(
            a,
            scale,
            r,
            phi,
          );
          const label: string = `ray ${a}/${scale}/${r}/${phi}`;
          TestValidator.predicate(
            `${label} found`,
            ray !== null && ray.native !== null,
          );
          const next: IAutoMovieConicArc.IRay | null = AutoMovieConicArc.locate(
            a,
            scale,
            r,
            phi,
          );
          if (ray === null || next === null) continue;
          TestValidator.predicate(
            `${label} bounded`,
            [...ray.point, ...ray.tangent, ...ray.radial].every(
              (v: number): boolean => Math.abs(v) <= Number.MAX_VALUE,
            ),
          );
          TestValidator.predicate(
            `${label} separate arrays`,
            ray.point !== next.point &&
              ray.tangent !== next.tangent &&
              ray.radial !== next.radial,
          );
        }
}
