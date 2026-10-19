import type { IAutoMovieCurve64 as C } from "@automovie/engine/geometry/curve";

import type { RecoveryFeatureChartCuts } from "./RecoveryFeatureChartCuts";

type Input = Parameters<typeof RecoveryFeatureChartCuts>[0];
type Output = ReturnType<typeof RecoveryFeatureChartCuts>;
type Row = { a: number; b: number; face: number };
type Topology = {
  edges: Map<string, Row[]>;
  vertexEdges: string[][];
  incident: number[][];
  components: number[][];
  faceComponent: Int32Array;
  cycles: number[][];
  areas: number[];
  normals: C.Vector[];
};
type Feature = Input["featureEdges"][number];
/**
 * Subdivide colliding feature edges using the unchanged exact midpoint arithmetic.
 *
 * @evidence contracts/common.md#principled-implementation Binary64 integer means round ties to even and each positive error term enters the original upward L1 sum before child ownership checks.
 * @evidence contracts/common.md#clear-and-simple-design This phase retains its original arithmetic and ordered state transitions while its caller owns orchestration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Extraction introduces no input correction, geometry fallback, reordered reduction or changed admission condition.
 * @evidence contracts/common.md#meaningful-documentation States the phase responsibility, shared-state ownership and numerical limits inherited from the calling algorithm.
 * @evidence contracts/performance.md#efficient-algorithms Sorts colliding edge identities and validates the same subdivided topology once.
 * @evidence contracts/performance.md#reuse-equivalent-work The returned vertices, faces, parents and expanded features are reused by fan materialization.
 * @evidence contracts/performance.md#bound-retention-and-release-resources DataView and integer scratch are private to this call; arrays and diagnostic bounds transfer to the caller.
 */
export function RecoveryFeatureChartCutsSubdivide(
  input: Input,
  source: Topology,
  features: Map<string, Feature>,
  collisions: Set<string>,
  physicalPositions: Map<string, C.Vector>,
  analyze: (
    vertices: readonly C.Vector[],
    triangles: readonly (readonly [number, number, number])[],
  ) => Topology,
  fail: (reason: string) => never,
  edge: (a: number, b: number) => string,
  lex: (a: string, b: string) => number,
): {
  vertices: C.Vector[];
  physical: string[];
  occurrences: string[];
  insertions: Output["insertions"];
  diagnostics: string[];
  observationDisplacementUpperMm: number;
  triangles: [number, number, number][];
  owners: number[];
  parents: number[];
  expanded: Map<string, Feature>;
  subdivided: Topology;
} {
  const vertices: C.Vector[] = input.verticesMm.map(
      (p: C.Vector): C.Vector => [...p],
    ),
    physical: string[] = [...input.physicalKeys],
    occurrences: string[] = [...input.occurrenceKeys],
    occurrenceSet: Set<string> = new Set(occurrences);
  const insertions: ReturnType<typeof RecoveryFeatureChartCuts>["insertions"] =
      [],
    diagnostics: string[] = [],
    midpoints: Map<string, number> = new Map(),
    bits: DataView = new DataView(new ArrayBuffer(8));
  let observationDisplacementUpperMm: number = 0;
  // Binary64 coordinates are integers in units of 2^-1074 mm. Their exact mean
  // and its rounding error therefore use units of 2^-1075 mm below.
  const integer: (value: number) => bigint = (value: number): bigint => {
    bits.setFloat64(0, value);
    const word: bigint = bits.getBigUint64(0),
      exp: number = Number((word >> 52n) & 2047n),
      fraction: bigint = word & ((1n << 52n) - 1n),
      magnitude: bigint = exp
        ? ((1n << 52n) | fraction) << BigInt(exp - 1)
        : fraction;
    return word >> 63n ? -magnitude : magnitude;
  };
  // Retain 53 significant bits and at least the binary64 subnormal quantum.
  // Midpoints round nearest with ties to even; nonnegative error bounds round up.
  const roundedHalfUnits: (value: bigint, upward: boolean) => number = (
    value: bigint,
    upward: boolean,
  ): number => {
    if (value === 0n) return 0;
    const sign: number = value < 0n ? -1 : 1,
      magnitude: bigint = value < 0n ? -value : value,
      shift: number = Math.max(1, magnitude.toString(2).length - 53),
      mask: bigint = (1n << BigInt(shift)) - 1n;
    let high: bigint = magnitude >> BigInt(shift);
    const remainder: bigint = magnitude & mask,
      half: bigint = 1n << BigInt(shift - 1);
    if (
      upward
        ? remainder > 0n
        : remainder > half || (remainder === half && (high & 1n) !== 0n)
    )
      high++;
    return sign * Number(high) * 2 ** (shift - 1075);
  };
  const nextUp: (value: number) => number = (value: number): number => {
    if (value === 0) return Number.MIN_VALUE;
    bits.setFloat64(0, value);
    bits.setBigUint64(0, bits.getBigUint64(0) + 1n);
    return bits.getFloat64(0);
  };
  const orderedCollisions: string[] = [...collisions].sort(
    (a: string, b: string): number =>
      lex(
        JSON.stringify([
          features.get(a)!.sourceEdge,
          ...[
            occurrences[features.get(a)!.a]!,
            occurrences[features.get(a)!.b]!,
          ].sort(lex),
        ]),
        JSON.stringify([
          features.get(b)!.sourceEdge,
          ...[
            occurrences[features.get(b)!.a]!,
            occurrences[features.get(b)!.b]!,
          ].sort(lex),
        ]),
      ),
  );
  for (const word of orderedCollisions) {
    const feature: Feature = features.get(word)!,
      a: number = feature.a,
      b: number = feature.b,
      point: C.Vector = [0, 1, 2].map((k: number): number =>
        roundedHalfUnits(
          integer(vertices[a]![k]!) + integer(vertices[b]![k]!),
          false,
        ),
      ) as [number, number, number];
    if (
      !point.every(Number.isFinite) ||
      [a, b].some((id: number): boolean =>
        point.every((x: number, k: number): boolean => x === vertices[id]![k]),
      )
    )
      fail("a rounded conforming midpoint collapses to an endpoint");
    const length: number = Math.hypot(
        ...vertices[b]!.map(
          (x: number, k: number): number => x - vertices[a]![k]!,
        ),
      ),
      fraction: number = point.reduce(
        (sum: number, x: number, k: number): number =>
          sum +
          ((x - vertices[a]![k]!) / length) *
            ((vertices[b]![k]! - vertices[a]![k]!) / length),
        0,
      );
    if (
      !(fraction > 0 && fraction < 1) ||
      point.some(
        (x: number, k: number): boolean =>
          x < Math.min(vertices[a]![k]!, vertices[b]![k]!) ||
          x > Math.max(vertices[a]![k]!, vertices[b]![k]!),
      )
    )
      fail("a rounded midpoint is not a strict interior edge observation");
    const edgeKeys: [string, string] = [physical[a]!, physical[b]!].sort(
        lex,
      ) as [string, string],
      key: string = `feature-midpoint:${JSON.stringify([feature.sourceEdge, ...edgeKeys])}`,
      occurrence: string = `feature-midpoint-occurrence:${JSON.stringify([feature.sourceEdge, ...[occurrences[a]!, occurrences[b]!].sort(lex)])}`;
    const previous: C.Vector | undefined = physicalPositions.get(key);
    if (
      (previous &&
        previous.some((x: number, k: number): boolean => x !== point[k])) ||
      occurrenceSet.has(occurrence)
    )
      fail("a midpoint identity conflicts with an existing observation");
    const errors: number[] = point.map((x: number, k: number): number => {
      const difference: bigint =
        2n * integer(x) - integer(vertices[a]![k]!) - integer(vertices[b]![k]!);
      return roundedHalfUnits(difference < 0n ? -difference : difference, true);
    });
    // Upward sums give an L1 bound, which also bounds Euclidean point displacement.
    let normUpper: number = 0;
    for (const error of errors)
      if (error > 0) normUpper = nextUp(normUpper + error);
    if (!Number.isFinite(normUpper))
      fail("a midpoint rounding bound is unrepresentable");
    observationDisplacementUpperMm = Math.max(
      observationDisplacementUpperMm,
      normUpper,
    );
    diagnostics.push(
      `midpoint-rounding:${JSON.stringify({ key, coordinateUpperMm: errors, positionNormUpperMm: normUpper })}`,
    );
    midpoints.set(word, vertices.length);
    vertices.push(point);
    physical.push(key);
    occurrences.push(occurrence);
    occurrenceSet.add(occurrence);
    physicalPositions.set(key, point);
    insertions.push({ edgeKeys, fractionFromFirst: 0.5, key, pointMm: point });
  }
  const triangles: [number, number, number][] = [],
    owners: number[] = [],
    parents: number[] = [];
  input.triangles.forEach(
    (t: readonly [number, number, number], face: number): void => {
      const cuts: number[] = [0, 1, 2].filter((k: number): boolean =>
        midpoints.has(edge(t[k]!, t[(k + 1) % 3]!)),
      );
      // Two colliding cuts cannot meet: their common vertex would have two cut fans.
      if (cuts.length > 1)
        fail("colliding feature edges unexpectedly share an incident triangle");
      const k: number | undefined = cuts[0],
        children: [number, number, number][] =
          k === undefined
            ? [[...t]]
            : [
                [
                  t[k]!,
                  midpoints.get(edge(t[k]!, t[(k + 1) % 3]!))!,
                  t[(k + 2) % 3]!,
                ],
                [
                  midpoints.get(edge(t[k]!, t[(k + 1) % 3]!))!,
                  t[(k + 1) % 3]!,
                  t[(k + 2) % 3]!,
                ],
              ];
      for (const child of children) {
        triangles.push(child);
        owners.push(input.triangleSourceFaces[face]!);
        parents.push(face);
      }
    },
  );
  const expanded: Map<string, Feature> = new Map();
  for (const feature of features.values()) {
    const middle: number | undefined = midpoints.get(
      edge(feature.a, feature.b),
    );
    if (middle === undefined) expanded.set(edge(feature.a, feature.b), feature);
    else {
      expanded.set(edge(feature.a, middle), { ...feature, b: middle });
      expanded.set(edge(middle, feature.b), { ...feature, a: middle });
    }
  }
  const subdivided: Topology = midpoints.size
      ? analyze(vertices, triangles)
      : source,
    measuredAreas: number[] = new Array(input.triangles.length).fill(0);
  triangles.forEach(
    (_: readonly [number, number, number], face: number): void => {
      const parent: number = parents[face]!,
        n: C.Vector = subdivided.normals[face]!,
        old: C.Vector = source.normals[parent]!;
      if (
        !(
          n.reduce(
            (sum: number, x: number, k: number): number => sum + x * old[k]!,
            0,
          ) > 0
        )
      )
        fail("a subdivided triangle changed coherent geometric winding");
      measuredAreas[parent] += subdivided.areas[face]!;
    },
  );
  for (let face: number = 0; face < measuredAreas.length; face++) {
    const difference: number = measuredAreas[face]! - source.areas[face]!;
    if (!Number.isFinite(difference))
      fail("a measured subdivision area discrepancy is unrepresentable");
    if (difference !== 0)
      diagnostics.push(
        `subdivision-area-difference-mm2:${JSON.stringify({ sourceFace: input.triangleSourceFaces[face], privateTriangle: face, difference })}`,
      );
  }

  return {
    vertices,
    physical,
    occurrences,
    insertions,
    diagnostics,
    observationDisplacementUpperMm,
    triangles,
    owners,
    parents,
    expanded,
    subdivided,
  };
}
