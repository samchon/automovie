import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryBoundaryCut,
  IAutoMovieRecoveryChartBoundaryNetwork,
  IAutoMovieRecoveryChartBoundaryNetworkRegistry,
} from "@automovie/interface";

/*
 * Register immutable boundary ancestry and copied chart observations before
 * augmentation.
 */
export function RecoveryChartBoundaryNetworkRegistry(
  input: Parameters<IAutoMovieRecoveryChartBoundaryNetworkRegistry.Operation>[0],
): ReturnType<IAutoMovieRecoveryChartBoundaryNetworkRegistry.Operation> {
  const pair: (a: string, b: string) => string = (
    a: string,
    b: string,
  ): string => JSON.stringify(a < b ? [a, b] : [b, a]);
  const indexed: (a: number, b: number) => string = (
    a: number,
    b: number,
  ): string => (a < b ? `${a}:${b}` : `${b}:${a}`);
  const compare: (a: string, b: string) => number = (
    a: string,
    b: string,
  ): number => (a < b ? -1 : a > b ? 1 : 0);
  const finite: (p: readonly number[]) => boolean = (
    p: readonly number[],
  ): boolean => p.length === 3;
  const blend: (
    a: Readonly<AutoMovieVector3Tuple>,
    b: Readonly<AutoMovieVector3Tuple>,
    t: number,
  ) => Readonly<AutoMovieVector3Tuple> = (
    a: Readonly<AutoMovieVector3Tuple>,
    b: Readonly<AutoMovieVector3Tuple>,
    t: number,
  ): Readonly<AutoMovieVector3Tuple> => [
    a[0] + t * (b[0] - a[0]),
    a[1] + t * (b[1] - a[1]),
    a[2] + t * (b[2] - a[2]),
  ];
  const normal: (
    a: Readonly<AutoMovieVector3Tuple>,
    b: Readonly<AutoMovieVector3Tuple>,
    c: Readonly<AutoMovieVector3Tuple>,
  ) => Readonly<AutoMovieVector3Tuple> = (
    a: Readonly<AutoMovieVector3Tuple>,
    b: Readonly<AutoMovieVector3Tuple>,
    c: Readonly<AutoMovieVector3Tuple>,
  ): Readonly<AutoMovieVector3Tuple> => {
    const x: number[] = b.map((v: number, k: number): number => v - a[k]!),
      y: number[] = c.map((v: number, k: number): number => v - a[k]!);
    return [
      x[1]! * y[2]! - x[2]! * y[1]!,
      x[2]! * y[0]! - x[0]! * y[2]!,
      x[0]! * y[1]! - x[1]! * y[0]!,
    ];
  };
  const cuts: Map<
    string,
    {
      endpoints: [string, string];
      values: Map<number, IAutoMovieRecoveryBoundaryCut>;
    }
  > = new Map();
  const insertionKeys: Map<string, { base: string; fraction: number }> =
    new Map();
  const declaredPoints: Map<string, Readonly<AutoMovieVector3Tuple>[]> =
    new Map();
  for (const chart of input.charts) {
    if (!chart)
      throw new Error(
        "Every private chart needs its insertion provenance array",
      );
    for (const cut of chart.insertions) {
      if (
        !cut ||
        cut.edgeKeys.length !== 2 ||
        !cut.edgeKeys.every((key: string): boolean => key.length > 0) ||
        cut.edgeKeys[0] === cut.edgeKeys[1] ||
        !cut.key ||
        !finite(cut.pointMm) ||
        !(cut.fractionFromFirst > 0 && cut.fractionFromFirst < 1)
      )
        throw new Error(
          "Complete noncollapsed base-edge insertion provenance is required",
        );
      const endpoints: [string, string] =
        cut.edgeKeys[0] < cut.edgeKeys[1]
          ? [cut.edgeKeys[0], cut.edgeKeys[1]]
          : [cut.edgeKeys[1], cut.edgeKeys[0]];
      const base: string = pair(...endpoints),
        fraction: number =
          cut.edgeKeys[0] === endpoints[0]
            ? cut.fractionFromFirst
            : 1 - cut.fractionFromFirst;
      if (!(fraction > 0 && fraction < 1))
        throw new Error("Canonical insertion reflection collapsed its phase");
      const old: { base: string; fraction: number } | undefined =
        insertionKeys.get(cut.key);
      if (old && (old.base !== base || old.fraction !== fraction))
        throw new Error(
          "One inserted physical key has conflicting base-edge ancestry",
        );
      insertionKeys.set(cut.key, { base, fraction });
      if (!declaredPoints.has(cut.key)) declaredPoints.set(cut.key, []);
      declaredPoints
        .get(cut.key)!
        .push([cut.pointMm[0], cut.pointMm[1], cut.pointMm[2]]);
      if (!cuts.has(base)) cuts.set(base, { endpoints, values: new Map() });
      const values: Map<number, IAutoMovieRecoveryBoundaryCut> =
        cuts.get(base)!.values;
      if (!values.has(fraction))
        values.set(fraction, {
          key: cut.key,
          fraction,
          point: [cut.pointMm[0], cut.pointMm[1], cut.pointMm[2]],
          aliases: new Set(),
        });
      const entry: IAutoMovieRecoveryBoundaryCut = values.get(fraction)!;
      entry.aliases.add(cut.key);
      if (cut.key < entry.key) entry.key = cut.key;
    }
  }
  const points: Map<string, Readonly<AutoMovieVector3Tuple>> = new Map(),
    names: Set<string> = new Set(),
    breaks: Set<string> = new Set();
  const charts: ReturnType<IAutoMovieRecoveryChartBoundaryNetwork.Operation>["charts"] =
    [];
  for (const chart of input.charts) {
    if (
      !chart.name ||
      names.has(chart.name) ||
      chart.verticesMm.length !== chart.physicalKeys.length ||
      chart.sides.length !== 4
    )
      throw new Error(
        "Unique private charts need aligned points, keys, triangles and four sides",
      );
    names.add(chart.name);
    for (let i: number = 0; i < chart.verticesMm.length; i++) {
      const key: string = chart.physicalKeys[i]!,
        point: Readonly<AutoMovieVector3Tuple> = chart.verticesMm[i]!;
      if (!key || !finite(point))
        throw new Error(
          "Private physical observations must be finite and named",
        );
      const old: Readonly<AutoMovieVector3Tuple> | undefined = points.get(key);
      if (
        old &&
        !insertionKeys.has(key) &&
        old.some((v: number, k: number): boolean => v !== point[k])
      )
        throw new Error("One original physical key has conflicting points");
      if (!old) points.set(key, [...point]);
    }
    for (const side of chart.sides) {
      if (
        side.length < 2 ||
        side.some(
          (id: number): boolean => id < 0 || id >= chart.verticesMm.length,
        )
      )
        throw new Error("A private side must address an ordered point path");
      breaks.add(chart.physicalKeys[side[0]!]!);
      breaks.add(chart.physicalKeys[side.at(-1)!]!);
    }
    if (
      chart.sides[0].at(-1) !== chart.sides[1][0] ||
      chart.sides[1].at(-1) !== chart.sides[2].at(-1) ||
      chart.sides[2][0] !== chart.sides[3].at(-1) ||
      chart.sides[3][0] !== chart.sides[0][0]
    )
      throw new Error(
        "The four ordered private sides do not share their quarter-corner occurrences",
      );
    charts.push({
      name: chart.name,
      verticesMm: chart.verticesMm.map(
        (
          p: Readonly<AutoMovieVector3Tuple>,
        ): Readonly<AutoMovieVector3Tuple> => [...p],
      ),
      physicalKeys: [...chart.physicalKeys],
      triangles: chart.triangles.map(
        (t: readonly [number, number, number]): [number, number, number] => [
          ...t,
        ],
      ),
      sides: [
        [...chart.sides[0]],
        [...chart.sides[1]],
        [...chart.sides[2]],
        [...chart.sides[3]],
      ],
      boundaries: [],
    });
  }
  let maximumPointChange: number = 0;
  const aliases: Map<string, string> = new Map();
  const orderedCuts: Map<string, IAutoMovieRecoveryBoundaryCut[]> = new Map();
  for (const [base, authority] of cuts)
    orderedCuts.set(
      base,
      [...authority.values.values()].sort(
        (
          a: IAutoMovieRecoveryBoundaryCut,
          b: IAutoMovieRecoveryBoundaryCut,
        ): number => a.fraction - b.fraction,
      ),
    );
  for (const [base, { endpoints }] of cuts) {
    const a: Readonly<AutoMovieVector3Tuple> | undefined = points.get(
        endpoints[0],
      ),
      b: Readonly<AutoMovieVector3Tuple> | undefined = points.get(endpoints[1]);
    if (
      !a ||
      !b ||
      insertionKeys.has(endpoints[0]) ||
      insertionKeys.has(endpoints[1])
    )
      throw new Error(
        "A base edge needs two original physical endpoints, not unresolved nested ancestry",
      );
    let previous: Readonly<AutoMovieVector3Tuple> = a;
    for (const cut of orderedCuts.get(base)!) {
      const point: Readonly<AutoMovieVector3Tuple> = blend(a, b, cut.fraction);
      if (
        !finite(point) ||
        point.every((v: number, k: number): boolean => v === previous[k]) ||
        point.every((v: number, k: number): boolean => v === b[k])
      )
        throw new Error("A canonical cut point is collapsed or nonfinite");
      for (const key of cut.aliases) {
        aliases.set(key, cut.key);
        const old: Readonly<AutoMovieVector3Tuple> | undefined =
          points.get(key);
        if (old)
          maximumPointChange = Math.max(
            maximumPointChange,
            Math.hypot(
              ...old.map((v: number, k: number): number => v - point[k]!),
            ),
          );
      }
      cut.point = point;
      points.set(cut.key, point);
      previous = point;
    }
  }
  for (const chart of input.charts)
    for (const cut of chart.insertions) {
      const ancestry: { base: string; fraction: number } = insertionKeys.get(
        cut.key,
      )!;
      const expected: Readonly<AutoMovieVector3Tuple> = blend(
        points.get(cut.edgeKeys[0])!,
        points.get(cut.edgeKeys[1])!,
        cut.fractionFromFirst,
      );
      const canonical: Readonly<AutoMovieVector3Tuple> = cuts
        .get(ancestry.base)!
        .values.get(ancestry.fraction)!.point;
      if (
        !finite(expected) ||
        ![expected, canonical].some(
          (point: Readonly<AutoMovieVector3Tuple>): boolean =>
            point.every(
              (v: number, k: number): boolean => v === cut.pointMm[k],
            ),
        )
      )
        throw new Error(
          "An insertion point contradicts its declared affine base-edge observation",
        );
      maximumPointChange = Math.max(
        maximumPointChange,
        Math.hypot(
          ...cut.pointMm.map(
            (v: number, k: number): number => v - canonical[k]!,
          ),
        ),
      );
    }
  const canonicalBreaks: Set<string> = new Set(
    [...breaks].map((key: string): string => aliases.get(key) ?? key),
  );
  const diagnostics: string[] = [];

  return {
    cuts,
    insertionKeys,
    declaredPoints,
    points,
    charts,
    aliases,
    orderedCuts,
    canonicalBreaks,
    diagnostics,
    maximumPointChange,
    pair,
    indexed,
    compare,
    finite,
    blend,
    normal,
  };
}
