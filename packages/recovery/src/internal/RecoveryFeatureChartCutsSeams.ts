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
 * Publish maximal feature arcs with their two actual coherent boundary banks.
 *
 * @evidence contracts/common.md#principled-implementation Lexical traversal, junction-return anchors and directed bank checks retain the original order and identities.
 * @evidence contracts/common.md#clear-and-simple-design This phase retains its original arithmetic and ordered state transitions while its caller owns orchestration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Extraction introduces no input correction, geometry fallback, reordered reduction or changed admission condition.
 * @evidence contracts/common.md#meaningful-documentation States the phase responsibility, shared-state ownership and numerical limits inherited from the calling algorithm.
 * @evidence contracts/performance.md#efficient-algorithms Visits expanded feature edges and validates each bank against already materialized topology.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses the existing chart and fan maps without rebuilding or welding vertices.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only returned charts, seams and diagnostics escape; traversal sets and arcs are local.
 */
export function RecoveryFeatureChartCutsSeams(
  context: {
    subdivided: Topology;
    expanded: Map<string, Feature>;
    physical: string[];
    occurrences: string[];
    remap: Map<number, number>[];
    actual: Topology;
    localOf: Map<number, number>;
    chartOf: Map<number, number>;
    charts: Output["charts"];
    triangles: [number, number, number][];
    insertions: Output["insertions"];
    diagnostics: string[];
    observationDisplacementUpperMm: number;
  },
  fail: (reason: string) => never,
  edge: (a: number, b: number) => string,
  lex: (a: string, b: string) => number,
): Output {
  const {
    subdivided,
    expanded,
    physical,
    occurrences,
    remap,
    actual,
    localOf,
    chartOf,
    charts,
    triangles,
    insertions,
    diagnostics,
    observationDisplacementUpperMm,
  }: {
    subdivided: Topology;
    expanded: Map<string, Feature>;
    physical: string[];
    occurrences: string[];
    remap: Map<number, number>[];
    actual: Topology;
    localOf: Map<number, number>;
    chartOf: Map<number, number>;
    charts: Output["charts"];
    triangles: [number, number, number][];
    insertions: Output["insertions"];
    diagnostics: string[];
    observationDisplacementUpperMm: number;
  } = context;
  type Arc = {
    vertices: number[];
    edges: string[];
    closed: boolean;
    word: string;
  };
  const featureAt: Map<number, string[]> = new Map(),
    visited: Set<string> = new Set(),
    arcs: Arc[] = [],
    physicalBoundary: Set<number> = new Set(subdivided.cycles.flat());
  const vertexWord: (id: number) => string = (id: number): string =>
    JSON.stringify([physical[id], occurrences[id]]);
  for (const [key, feature] of expanded)
    for (const id of [feature.a, feature.b]) {
      const rows: string[] = featureAt.get(id) ?? [];
      rows.push(key);
      featureAt.set(id, rows);
    }
  // Two feature edges at an existing physical boundary have three incident fans.
  // They cannot continue one two-bank arc through that boundary junction.
  const junction: (id: number) => boolean = (id: number): boolean =>
    featureAt.get(id)!.length !== 2 || physicalBoundary.has(id);
  const installArc: (
    path: number[],
    edges: string[],
    closed: boolean,
  ) => void = (path: number[], edges: string[], closed: boolean): void => {
    const forward: string = JSON.stringify(path.map(vertexWord)),
      reverse: string = JSON.stringify([...path].reverse().map(vertexWord)),
      reversed: boolean = reverse < forward;
    arcs.push({
      vertices: reversed ? [...path].reverse() : path,
      edges: reversed ? [...edges].reverse() : edges,
      closed,
      word: reversed ? reverse : forward,
    });
  };
  const walk: (first: number, firstEdge: string) => void = (
    first: number,
    firstEdge: string,
  ): void => {
    const path: number[] = [first],
      edges: string[] = [];
    let current: number = first,
      key: string = firstEdge;
    for (;;) {
      if (visited.has(key)) fail("a maximal feature chain revisits an edge");
      visited.add(key);
      edges.push(key);
      const feature: Feature = expanded.get(key)!,
        next: number = feature.a === current ? feature.b : feature.a;
      path.push(next);
      if (next === first) {
        if (!junction(first)) installArc(path, edges, true);
        else {
          const anchor: number = path
              .slice(1, -1)
              .reduce(
                (best: number, id: number): number =>
                  lex(vertexWord(id), vertexWord(best)) < 0 ? id : best,
                path[1]!,
              ),
            at: number = path.indexOf(anchor);
          if (!(at > 0 && at < path.length - 1))
            fail(
              "a junction-return feature loop lacks a distinct interior arc anchor",
            );
          installArc(path.slice(0, at + 1), edges.slice(0, at), false);
          installArc(path.slice(at), edges.slice(at), false);
          diagnostics.push(
            `junction-return-loop-split:${JSON.stringify({ junction: physical[first], anchor: physical[anchor] })}`,
          );
        }
        break;
      }
      const outgoing: string[] = featureAt.get(next)!;
      if (junction(next)) {
        installArc(path, edges, false);
        break;
      }
      current = next;
      key = outgoing[0] === key ? outgoing[1]! : outgoing[0]!;
    }
  };
  const orderedVertices: number[] = [...featureAt.keys()].sort(
    (a: number, b: number): number => lex(vertexWord(a), vertexWord(b)),
  );
  for (const id of orderedVertices)
    featureAt.get(id)!.sort((a: string, b: string): number => {
      const x: Feature = expanded.get(a)!,
        y: Feature = expanded.get(b)!;
      return lex(
        vertexWord(x.a === id ? x.b : x.a),
        vertexWord(y.a === id ? y.b : y.a),
      );
    });
  for (const id of orderedVertices)
    if (junction(id))
      for (const key of featureAt.get(id)!)
        if (!visited.has(key)) walk(id, key);
  for (const id of orderedVertices)
    for (const key of featureAt.get(id)!) if (!visited.has(key)) walk(id, key);
  arcs.sort((a: Arc, b: Arc): number => lex(a.word, b.word));
  const seams: ReturnType<typeof RecoveryFeatureChartCuts>["seams"] = [];
  for (const arc of arcs) {
    const banks: [number[], number[]] = [[], []];
    for (let k: number = 0; k < arc.edges.length; k++) {
      const a: number = arc.vertices[k]!,
        b: number = arc.vertices[k + 1]!,
        rows: Row[] = subdivided.edges.get(arc.edges[k]!)!;
      const forward: Row | undefined = rows.find(
          (row: Row): boolean => row.a === a && row.b === b,
        ),
        backward: Row | undefined = rows.find(
          (row: Row): boolean => row.a === b && row.b === a,
        );
      if (!forward || !backward)
        fail("a feature arc lacks opposite coherent source incidents");
      for (let bank: number = 0; bank < 2; bank++) {
        const row: Row = bank === 0 ? forward! : backward!,
          from: number = remap[a]!.get(row.face)!,
          to: number = remap[b]!.get(row.face)!;
        const actualRows: Row[] | undefined = actual.edges.get(edge(from, to));
        if (
          actualRows?.length !== 1 ||
          actualRows[0]!.a !== (bank === 0 ? from : to) ||
          actualRows[0]!.b !== (bank === 0 ? to : from)
        )
          fail(
            "a feature bank disagrees with actual coherent boundary incidence",
          );
        if (banks[bank]!.length && banks[bank]!.at(-1) !== from)
          fail("a degree-two feature bank changes its incident fan");
        if (!banks[bank]!.length) banks[bank]!.push(from);
        banks[bank]!.push(to);
      }
    }
    const bindings: ReturnType<
      typeof RecoveryFeatureChartCuts
    >["seams"][number]["banks"] = banks.map(
      (path: number[]): { chart: number; path: number[] } => {
        const chart: number = chartOf.get(path[0]!)!;
        if (
          path.some((id: number): boolean => chartOf.get(id) !== chart) ||
          (arc.closed && path[0] !== path.at(-1))
        )
          fail("a maximal feature bank is not one supported chart path");
        return {
          chart,
          path: path.map((id: number): number => localOf.get(id)!),
        };
      },
    ) as [{ chart: number; path: number[] }, { chart: number; path: number[] }];
    seams.push({
      id: `feature-arc.${seams.length}`,
      kind: "crease",
      closed: arc.closed,
      physicalPath: arc.vertices.map((id: number): string => physical[id]!),
      banks: bindings,
    });
  }
  if (
    visited.size !== expanded.size ||
    charts.reduce(
      (sum: number, chart: (typeof charts)[number]): number =>
        sum + chart.triangles.length,
      0,
    ) !== triangles.length
  )
    fail("feature or source-triangle ownership is incomplete");
  diagnostics.push(
    "Private cut charts retain actual boundary cycles; disk topology, UV injectivity, compact curve fitting, shared partial-arc authority and generated normal fans remain separate qualifications.",
  );
  return {
    charts,
    seams,
    insertions,
    observationDisplacementUpperMm,
    diagnostics,
  };
}
