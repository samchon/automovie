import type { IAutoMovieCurve64 as C } from "@automovie/engine/geometry/curve";

import type { RecoveryChartFit as J } from "./RecoveryChartFit";
import { RecoveryChartPhysicalJet as P } from "./RecoveryChartPhysicalJet";

/**
 * Integrate private piecewise-affine source observations inside axis-aligned leaves.
 * Positive UV triangles are clipped at the tensor knots before a seven-by-seven
 * Gauss rule on a Duffy triangle supplies physical-area weighted correspondences.
 * An optional rectangular leaf partition replaces the tensor product; its open
 * interiors must cover the unit square once. Every local map remains affine.
 * For a bicubic field minus an affine source this integrates its squared residual
 * exactly in real arithmetic. Binary64 arithmetic and continuous maximum error
 * remain separate qualifications. No private source triangle leaves this operation.
 * Optional physical-gradient frames are computed once per source-triangle/leaf
 * intersection by thin QR. The same samples then stream two derivative rows;
 * their squared polynomial degree is at most ten, within the same Gauss rule.
 *
 * @evidence contracts/common.md#principled-implementation Rectangle clipping preserves each source triangle's affine chart correspondence; positive Gauss weights observe interior Bernstein support even when every original vertex lies on the chart boundary.
 * @evidence contracts/common.md#clear-and-simple-design One observation owner supplies the existing shared-control fitter with area rows, without creating coefficients or generated faces.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Interior observations come from the source, never from the candidate field; centroid counts and nonzero diagonal entries do not substitute for identifiability.
 * @evidence contracts/common.md#meaningful-documentation States polynomial integration premises, physical weight units, numerical limitations and private topology lifetime.
 * @evidence contracts/performance.md#efficient-algorithms For T source triangles, P tensor cells and K intersecting clipped child triangles, conservative cell-range lookup and clipping cost O(T(U+V)+TP) in the worst case and quadrature costs O(49K). The returned row count is 49K and is rejected before exceeding the explicit observation budget.
 * @evidence contracts/performance.md#reuse-equivalent-work Tensor knots, fixed Gauss abscissas and each clipped polygon are reused for all child samples; source positions are evaluated affinely rather than refitted.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One clipped polygon is transient; the caller owns at most maxObservations returned rows, and all source references expire after the call.
 */
export function RecoveryChartAreaObservations(input: {
  verticesMm: readonly C.Vector[];
  triangles: readonly (readonly [number, number, number])[];
  parameters: readonly (readonly number[])[];
  u: readonly number[];
  v: readonly number[];
  rectangles?: readonly (readonly [number, number, number, number])[];
  maxObservations: number;
  physicalGradientLengthMm?: number;
}): {
  observations: J.Input["observations"][number][];
  sourceAreaMm2: number;
  integratedAreaMm2: number;
  children: number;
  maximumRelativeAreaDiscrepancy: number;
} {
  if (
    !Number.isSafeInteger(input.maxObservations) ||
    input.maxObservations < 49 ||
    input.parameters.length !== input.verticesMm.length
  )
    throw new Error(
      "Aligned private observations and a positive quadrature budget are required",
    );
  if (
    input.physicalGradientLengthMm !== undefined &&
    !(
      input.physicalGradientLengthMm >= 0 &&
      Number.isFinite(input.physicalGradientLengthMm)
    )
  )
    throw new Error(
      "The physical-gradient exchange length must be finite and nonnegative",
    );
  for (const knots of [input.u, input.v])
    if (
      knots.length < 2 ||
      knots[0] !== 0 ||
      knots.at(-1) !== 1 ||
      knots.some(
        (x: number, i: number): boolean =>
          !Number.isFinite(x) || (i > 0 && x <= knots[i - 1]!),
      )
    )
      throw new Error("Increasing unit-chart tensor knots are required");
  const rectangles: readonly (readonly [number, number, number, number])[] =
    input.rectangles ??
    input.v
      .slice(0, -1)
      .flatMap((v: number, j: number): [number, number, number, number][] =>
        input.u
          .slice(0, -1)
          .map((u: number, i: number): [number, number, number, number] => [
            u,
            input.u[i + 1]!,
            v,
            input.v[j + 1]!,
          ]),
      );
  if (
    !rectangles.length ||
    rectangles.some(
      (r: readonly number[]): boolean =>
        r.length !== 4 ||
        !r.every(Number.isFinite) ||
        !(
          0 <= r[0]! &&
          r[0]! < r[1]! &&
          r[1]! <= 1 &&
          0 <= r[2]! &&
          r[2]! < r[3]! &&
          r[3]! <= 1
        ),
    )
  )
    throw new Error("Positive unit-chart rectangles are required");
  const cuts: number[] = [
    ...new Set(
      rectangles.flatMap((r: readonly number[]): number[] => [r[0]!, r[1]!]),
    ),
  ].sort((a: number, b: number): number => a - b);
  if (cuts[0] !== 0 || cuts.at(-1) !== 1)
    throw new Error("Observation rectangles do not cover the unit square");
  for (let i: number = 1; i < cuts.length; i++) {
    const intervals: readonly (readonly [number, number, number, number])[] =
      rectangles
        .filter(
          (r: readonly number[]): boolean =>
            r[0]! <= cuts[i - 1]! && r[1]! >= cuts[i]!,
        )
        .sort(
          (a: readonly number[], b: readonly number[]): number => a[2]! - b[2]!,
        );
    let previous: number = 0;
    for (const r of intervals) {
      if (r[2] !== previous)
        throw new Error("Observation rectangles overlap or leave an open gap");
      previous = r[3]!;
    }
    if (previous !== 1)
      throw new Error("Observation rectangles leave an uncovered stripe");
  }
  type Vertex = { uv: [number, number]; point: C.Vector };
  const nodes: readonly number[] = [
    0.025446043828620757, 0.12923440720030277, 0.2970774243113014, 0.5,
    0.7029225756886985, 0.8707655927996972, 0.9745539561713792,
  ];
  const weights: readonly number[] = [
    0.06474248308443485, 0.1398526957446383, 0.19091502525255946,
    0.2089795918367347, 0.19091502525255946, 0.1398526957446383,
    0.06474248308443485,
  ];
  const area: (a: C.Vector, b: C.Vector, c: C.Vector) => number = (
    a: C.Vector,
    b: C.Vector,
    c: C.Vector,
  ): number => {
    const x: number[] = b.map(
        (value: number, k: number): number => value - a[k]!,
      ),
      y: number[] = c.map((value: number, k: number): number => value - a[k]!);
    return (
      Math.hypot(
        x[1]! * y[2]! - x[2]! * y[1]!,
        x[2]! * y[0]! - x[0]! * y[2]!,
        x[0]! * y[1]! - x[1]! * y[0]!,
      ) / 2
    );
  };
  const clip: (
    polygon: Vertex[],
    axis: number,
    bound: number,
    greater: boolean,
  ) => Vertex[] = (
    polygon: Vertex[],
    axis: number,
    bound: number,
    greater: boolean,
  ): Vertex[] => {
    const output: Vertex[] = [];
    for (let i: number = 0; i < polygon.length; i++) {
      const a: Vertex = polygon[i]!,
        b: Vertex = polygon[(i + 1) % polygon.length]!;
      const insideA: boolean = greater
          ? a.uv[axis]! >= bound
          : a.uv[axis]! <= bound,
        insideB: boolean = greater
          ? b.uv[axis]! >= bound
          : b.uv[axis]! <= bound;
      if (insideA) output.push(a);
      if (insideA !== insideB) {
        const t: number = (bound - a.uv[axis]!) / (b.uv[axis]! - a.uv[axis]!);
        const uv: [number, number] = [
          a.uv[0] + t * (b.uv[0] - a.uv[0]),
          a.uv[1] + t * (b.uv[1] - a.uv[1]),
        ];
        uv[axis] = bound;
        output.push({
          uv,
          point: [0, 1, 2].map(
            (k: number): number =>
              a.point[k]! + t * (b.point[k]! - a.point[k]!),
          ) as [number, number, number],
        });
      }
    }
    return output;
  };
  const observations: J.Input["observations"][number][] = [];
  let sourceAreaMm2: number = 0,
    integratedAreaMm2: number = 0,
    children: number = 0,
    maximumRelativeAreaDiscrepancy: number = 0;
  for (const triangle of input.triangles) {
    const source: Vertex[] = triangle.map((id: number): Vertex => {
      if (!Number.isSafeInteger(id) || id < 0 || id >= input.verticesMm.length)
        throw new Error("Private source triangle address is invalid");
      const uv: readonly number[] = input.parameters[id]!,
        point: C.Vector = input.verticesMm[id]!;
      if (
        uv.length !== 2 ||
        uv.some(
          (x: number): boolean => !Number.isFinite(x) || x < 0 || x > 1,
        ) ||
        point.some((x: number): boolean => !Number.isFinite(x))
      )
        throw new Error("Finite unit-chart source observations are required");
      return { uv: [uv[0]!, uv[1]!], point };
    });
    const determinant: number =
      (source[1]!.uv[0] - source[0]!.uv[0]) *
        (source[2]!.uv[1] - source[0]!.uv[1]) -
      (source[1]!.uv[1] - source[0]!.uv[1]) *
        (source[2]!.uv[0] - source[0]!.uv[0]);
    const sourceArea: number = area(
      source[0]!.point,
      source[1]!.point,
      source[2]!.point,
    );
    if (!(determinant > 0 && sourceArea > 0 && Number.isFinite(sourceArea)))
      throw new Error(
        "Positive private UV and physical source triangles are required for area fitting",
      );
    sourceAreaMm2 += sourceArea;
    let retainedArea: number = 0,
      retainedChildren: number = 0;
    const minimum: number[] = [0, 1].map((k: number): number =>
        Math.min(...source.map((p: Vertex): number => p.uv[k]!)),
      ),
      maximum: number[] = [0, 1].map((k: number): number =>
        Math.max(...source.map((p: Vertex): number => p.uv[k]!)),
      );
    for (let patch: number = 0; patch < rectangles.length; patch++) {
      const [u0, u1, v0, v1]: readonly [number, number, number, number] =
        rectangles[patch]!;
      if (
        maximum[0]! <= u0 ||
        minimum[0]! >= u1 ||
        maximum[1]! <= v0 ||
        minimum[1]! >= v1
      )
        continue;
      const physicalJet: ReturnType<typeof P> | undefined =
        input.physicalGradientLengthMm
          ? P({
              pointsMm: [source[0]!.point, source[1]!.point, source[2]!.point],
              parameters: [source[0]!.uv, source[1]!.uv, source[2]!.uv],
              bounds: [u0, u1, v0, v1],
              lengthMm: input.physicalGradientLengthMm,
            })
          : undefined;
      let polygon: Vertex[] = clip(source, 0, u0, true);
      polygon = clip(polygon, 0, u1, false);
      polygon = clip(polygon, 1, v0, true);
      polygon = clip(polygon, 1, v1, false);
      for (let k: number = 1; k + 1 < polygon.length; k++) {
        const a: Vertex = polygon[0]!,
          b: Vertex = polygon[k]!,
          c: Vertex = polygon[k + 1]!;
        const childArea: number = area(a.point, b.point, c.point);
        if (childArea === 0) continue;
        if (!(childArea > 0 && Number.isFinite(childArea)))
          throw new Error("Clipped observation area is not representable");
        if (observations.length + 49 > input.maxObservations)
          throw new Error(
            "Private chart area-observation budget exhausted before fitting",
          );
        children++;
        retainedChildren++;
        integratedAreaMm2 += childArea;
        retainedArea += childArea;
        for (let r: number = 0; r < 7; r++)
          for (let s: number = 0; s < 7; s++) {
            const x: number = nodes[r]!,
              y: number = nodes[s]!,
              beta: number = x * (1 - y),
              gamma: number = x * y;
            const uv: number[] = [0, 1].map(
              (axis: number): number =>
                a.uv[axis]! +
                beta * (b.uv[axis]! - a.uv[axis]!) +
                gamma * (c.uv[axis]! - a.uv[axis]!),
            );
            const pointMm: C.Vector = [0, 1, 2].map(
              (axis: number): number =>
                a.point[axis]! +
                beta * (b.point[axis]! - a.point[axis]!) +
                gamma * (c.point[axis]! - a.point[axis]!),
            ) as [number, number, number];
            const weight: number =
              2 * childArea * x * weights[r]! * weights[s]!;
            if (!(weight > 0 && Number.isFinite(weight)))
              throw new Error(
                "A positive source-area quadrature weight is not representable",
              );
            observations.push({
              patch,
              u: (uv[0]! - u0) / (u1 - u0),
              v: (uv[1]! - v0) / (v1 - v0),
              pointMm,
              weight,
              physicalJet,
            });
          }
      }
    }
    if (!retainedChildren)
      throw new Error(
        "A positive source triangle lost all representable interior observations",
      );
    maximumRelativeAreaDiscrepancy = Math.max(
      maximumRelativeAreaDiscrepancy,
      Math.abs(retainedArea - sourceArea) / sourceArea,
    );
  }
  if (
    !observations.length ||
    !Number.isFinite(sourceAreaMm2) ||
    !Number.isFinite(integratedAreaMm2)
  )
    throw new Error("Finite positive source-area coverage is required");
  return {
    observations,
    sourceAreaMm2,
    integratedAreaMm2,
    children,
    maximumRelativeAreaDiscrepancy,
  };
}
