import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryFeatureChartCuts,
  IAutoMovieRecoveryFeatureChartCutsSubdivide,
  IAutoMovieRecoveryIndexedCrease,
  IAutoMovieRecoveryObservedMeshTopology,
} from "@automovie/interface";

/**
 * Subdivide colliding feature edges using the unchanged exact midpoint
 * arithmetic.
 */
export function RecoveryFeatureChartCutsSubdivide(
  input: Parameters<IAutoMovieRecoveryFeatureChartCutsSubdivide.Operation>[0],
  source: Parameters<IAutoMovieRecoveryFeatureChartCutsSubdivide.Operation>[1],
  features: Parameters<IAutoMovieRecoveryFeatureChartCutsSubdivide.Operation>[2],
  collisions: Parameters<IAutoMovieRecoveryFeatureChartCutsSubdivide.Operation>[3],
  physicalPositions: Parameters<IAutoMovieRecoveryFeatureChartCutsSubdivide.Operation>[4],
  analyze: Parameters<IAutoMovieRecoveryFeatureChartCutsSubdivide.Operation>[5],
  fail: Parameters<IAutoMovieRecoveryFeatureChartCutsSubdivide.Operation>[6],
  edge: Parameters<IAutoMovieRecoveryFeatureChartCutsSubdivide.Operation>[7],
  lex: Parameters<IAutoMovieRecoveryFeatureChartCutsSubdivide.Operation>[8],
): ReturnType<IAutoMovieRecoveryFeatureChartCutsSubdivide.Operation> {
  const vertices: Readonly<AutoMovieVector3Tuple>[] = input.verticesMm.map(
      (p: Readonly<AutoMovieVector3Tuple>): Readonly<AutoMovieVector3Tuple> => [
        ...p,
      ],
    ),
    physical: string[] = [...input.physicalKeys],
    occurrences: string[] = [...input.occurrenceKeys],
    occurrenceSet: Set<string> = new Set(occurrences);
  const insertions: ReturnType<IAutoMovieRecoveryFeatureChartCuts.Operation>["insertions"] =
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
    const feature: IAutoMovieRecoveryIndexedCrease = features.get(word)!,
      a: number = feature.a,
      b: number = feature.b,
      midpoint = (k: 0 | 1 | 2): number =>
        roundedHalfUnits(
          integer(vertices[a]![k]!) + integer(vertices[b]![k]!),
          false,
        ),
      point: Readonly<AutoMovieVector3Tuple> = [
        midpoint(0),
        midpoint(1),
        midpoint(2),
      ];
    if (
      point.some(
        (value: number): boolean => value === Infinity || value === -Infinity,
      ) ||
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
    const edgeKeys: [string, string] =
        lex(physical[a]!, physical[b]!) <= 0
          ? [physical[a]!, physical[b]!]
          : [physical[b]!, physical[a]!],
      key: string = `feature-midpoint:${JSON.stringify([feature.sourceEdge, ...edgeKeys])}`,
      occurrence: string = `feature-midpoint-occurrence:${JSON.stringify([feature.sourceEdge, ...[occurrences[a]!, occurrences[b]!].sort(lex)])}`;
    const previous: Readonly<AutoMovieVector3Tuple> | undefined =
      physicalPositions.get(key);
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
    if (normUpper === Infinity)
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
  const expanded: Map<string, IAutoMovieRecoveryIndexedCrease> = new Map();
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
  const subdivided: IAutoMovieRecoveryObservedMeshTopology = midpoints.size
      ? analyze(vertices, triangles)
      : source,
    measuredAreas: number[] = new Array(input.triangles.length).fill(0);
  triangles.forEach(
    (_: readonly [number, number, number], face: number): void => {
      const parent: number = parents[face]!,
        n: Readonly<AutoMovieVector3Tuple> = subdivided.normals[face]!,
        old: Readonly<AutoMovieVector3Tuple> = source.normals[parent]!;
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
    if (difference === Infinity || difference === -Infinity)
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
