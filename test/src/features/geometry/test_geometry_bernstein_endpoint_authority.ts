import { TestValidator } from "@nestia/e2e";

import { AutoMovieBernsteinAlgebra64 as B } from "../../../../packages/engine/src/geometry/curve/AutoMovieBernsteinAlgebra64";
import { AutoMovieBernsteinSubdivision64 as S } from "../../../../packages/engine/src/geometry/curve/AutoMovieBernsteinSubdivision64";
import { prepareAutoMovieBicubicAtlasBoundary64 } from "../../../../packages/engine/src/geometry/curve/prepareAutoMovieBicubicAtlasBoundary64";
import { nclose } from "../internal/nclose";

/**
 * Bernstein endpoint identities preserve the coefficient authority used by incident charts.
 * Scenarios:
 * 1. Scalar and vector endpoints retain small rounding-sensitive coefficients, extreme finite values, singleton degree and signed zero.
 * 2. Returned vectors and endpoint split children own their storage without changing the input.
 * 3. Full restrictions and endpoint splits retain the original net or a constant endpoint net of the same degree.
 * 4. Strict-interior evaluation and extrapolation remain unclamped, and an interior split retains one common junction.
 * 5. Two endpoint authorities with the same raw coefficient agree under reversal; a genuinely different raw coefficient still conflicts.
 * 6. Quadratic and cubic monomials retain their independent values at interior and extrapolated parameters in higher-degree coefficient nets without mutating frozen controls.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls scalar/vector evaluation, vector/scalar subdivision and the actual canonical boundary preparer. Exact endpoint and no-alias assertions catch repeated affine rounding and overflow before canonical incidence, while strict conflict checks retain disagreement detection.
 * @evidence contracts/testing.md#independent-expectations Bernstein basis values at zero and one are exactly the first and last supplied coefficients. Endpoint subdivision yields the original net and a degree-preserving constant net. Linear controls evaluate to the parameter, and falling-factorial controls (i)_p/(n)_p evaluate to t^p for p=2 or 3, including extrapolation. Identical declared endpoint coefficients are consistent, while 0.3 and its next representable value are distinct authorities.
 * @evidence contracts/testing.md#distinguishing-cases Covers degrees zero through cubic plus seven and twelve, 0.3 rounding, catastrophic cancellation, finite subtraction overflow, reversed nets and intervals, signed zero, frozen inputs, independent clones, exact full restriction, interior and extrapolated parameters, and positive versus genuinely conflicting canonical endpoints. This establishes the stated polynomial values and endpoint identities, not general interior error bounds or geometric regularity.
 * @evidence contracts/testing.md#execution-ownership This portable discoverable entry owns all coefficient fixtures and calls engine source without a host, native build, renderer, Human data or method replacement. Every endpoint observation is collected before the first aggregate assertion.
 */
export function test_geometry_bernstein_endpoint_authority(): void {
  const nets: B.Poly[] = [
    [[-0, 0.3, 1]],
    [
      [0, 0, 0],
      [0, 0, 0],
      [1, 0, 0],
      [0.3, 0, -0],
    ],
    [
      [0, 0, 0],
      [0, 0, 0],
      [2 ** 54, 0, 0],
      [1, 0, 0],
    ],
    [
      [-Number.MAX_VALUE, 0, 0],
      [Number.MAX_VALUE, 0, 0],
    ],
  ];
  const same: (a: number, b: number) => boolean = (
    a: number,
    b: number,
  ): boolean => nclose(a, b, 0) && Object.is(a, b);
  const equalVector: (a: readonly number[], b: readonly number[]) => boolean = (
    a: readonly number[],
    b: readonly number[],
  ): boolean =>
    a.length === b.length &&
    a.every((x: number, i: number): boolean => same(x, b[i]!));
  const observations: {
    endpoint: boolean;
    scalar: boolean;
    split: boolean;
    scalarSplit: boolean;
    restriction: boolean;
    independent: boolean;
    immutable: boolean;
  }[] = [];
  for (const net of nets)
    for (const t of [0, 1]) {
      const before: B.Poly = net.map((p: B.Vec): B.Vec => [...p]);
      const expected: B.Vec = net[t === 0 ? 0 : net.length - 1]!;
      const result: B.Vec = B.value(net, t);
      const parts: [B.Poly, B.Poly] = S.split(net, t);
      const scalarParts: [number[], number[]] = S.splitS(
        net.map((p: B.Vec): number => p[0]),
        t,
      );
      const restricted: B.Poly = S.restrict(net, 0, 1);
      const endpoint: boolean = equalVector(result, expected);
      const scalar: boolean = same(
        B.scalar(
          net.map((p: B.Vec): number => p[0]),
          t,
        ),
        expected[0],
      );
      const split: boolean = parts.every(
        (child: B.Poly, childIndex: number): boolean =>
          child.length === net.length &&
          child.every((p: B.Vec, i: number): boolean =>
            equalVector(p, childIndex === t ? expected : net[i]!),
          ),
      );
      const scalarSplit: boolean = scalarParts.every(
        (child: number[], childIndex: number): boolean =>
          child.every((x: number, i: number): boolean =>
            same(x, childIndex === t ? expected[0] : net[i]![0]),
          ),
      );
      const restriction: boolean = restricted.every(
        (p: B.Vec, i: number): boolean => equalVector(p, net[i]!),
      );
      const independent: boolean =
        result !== expected &&
        parts[0] !== parts[1] &&
        parts.every((child: B.Poly): boolean =>
          child.every((p: B.Vec): boolean => !net.includes(p)),
        ) &&
        parts[0].every((p: B.Vec): boolean => !parts[1].includes(p));
      result[0] = 17;
      parts[0][0]![0] = 19;
      parts[1][0]![0] = 23;
      restricted[0]![0] = 29;
      observations.push({
        endpoint,
        scalar,
        split,
        scalarSplit,
        restriction,
        independent,
        immutable: net.every((p: B.Vec, i: number): boolean =>
          equalVector(p, before[i]!),
        ),
      });
    }
  TestValidator.predicate(
    "all endpoint observations preserve coefficient identities and storage",
    observations.every((row: (typeof observations)[number]): boolean =>
      Object.values(row).every(Boolean),
    ),
  );

  const linear: B.Poly = [
    [0, 0, 0],
    [1, 0, 0],
  ];
  for (const t of [-1, Number.EPSILON, 0.25, 1 - Number.EPSILON, 2]) {
    TestValidator.predicate(
      "nonterminal vector and scalar values stay unclamped",
      nclose(B.value(linear, t)[0], t, 1e-15) &&
        nclose(B.scalar([0, 1], t), t, 1e-15),
    );
    if (t > 0 && t < 1)
      TestValidator.predicate(
        "nearby parameters remain interior",
        B.value(linear, t)[0] > 0 && B.value(linear, t)[0] < 1,
      );
  }
  const halves: [B.Poly, B.Poly] = S.split(nets[1]!, 0.5);
  TestValidator.predicate(
    "strict interior split shares its exact junction",
    equalVector(halves[0].at(-1)!, halves[1][0]!),
  );
  for (const degree of [2, 3, 7, 12])
    for (const power of [2, 3]) {
      if (power > degree) continue;
      const coefficients: readonly number[] = Object.freeze(
        Array.from({ length: degree + 1 }, (_: unknown, i: number): number => {
          let value: number = 1;
          for (let factor: number = 0; factor < power; factor++)
            value *= (i - factor) / (degree - factor);
          return value;
        }),
      );
      for (const t of [-0.25, 0.125, 0.5, 0.875, 1.25])
        TestValidator.predicate(
          "arbitrary-degree scalar reduction preserves independent monomials",
          nclose(B.scalar(coefficients, t), t ** power, 1e-11),
        );
    }

  const controls: B.Poly = Array.from(
    { length: 16 },
    (_: unknown, i: number): B.Vec => [(i % 4) / 10, Math.floor(i / 4) / 3, 0],
  );
  const input: Parameters<typeof prepareAutoMovieBicubicAtlasBoundary64>[0] = {
    topologyDomain: "endpoint-unit",
    controlsMm: controls,
    patches: [
      {
        id: "patch",
        controlIds: Array.from(
          { length: 16 },
          (_: unknown, i: number): number => i,
        ),
      },
    ],
    toleranceMm: 1,
    maxCells: 16,
    maxVerticesPerChunk: 64,
    boundaryAuthorities: [
      { id: "bottom", controlIds: [0, 1, 2, 3] },
      { id: "right", controlIds: [16, 17, 18, 19] },
    ],
    boundaryBindings: [
      {
        patch: "patch",
        side: 0,
        authority: "bottom",
        start: 0,
        end: 1,
        normalFan: "first",
      },
      {
        patch: "patch",
        side: 1,
        authority: "right",
        start: 1,
        end: 0,
        normalFan: "second",
      },
    ],
  };
  controls[0] = [0, 0, 0];
  controls[1] = [0, 0, 0];
  controls[2] = [1, 0, 0];
  controls[3] = [0.3, 0, 0];
  controls.push([0.3, 1, 0], [0.3, 2 / 3, 0], [0.3, 1 / 3, 0], [0.3, 0, 0]);
  const sides: readonly (readonly number[])[] = [
    [0, 1, 2, 3],
    [3, 7, 11, 15],
    [12, 13, 14, 15],
    [0, 4, 8, 12],
  ];
  TestValidator.equals(
    "same raw endpoint retains both incident authorities",
    prepareAutoMovieBicubicAtlasBoundary64(input, sides).conflicts.size,
    0,
  );
  controls[19]![0] = 0.30000000000000004;
  TestValidator.predicate(
    "a genuinely different raw endpoint remains a conflict",
    prepareAutoMovieBicubicAtlasBoundary64(input, sides).conflicts.size > 0,
  );
}
