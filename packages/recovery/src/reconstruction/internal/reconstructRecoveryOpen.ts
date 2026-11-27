import { AutoMovieEngineCurveGrid64 } from "@automovie/engine";
import type {
  AutoMovieCubicBezierControls3,
  IAutoMovieCubicBezierCurve64,
  IAutoMovieReconstructRecovery,
  IAutoMovieRecoveryOpenContinuation,
  IAutoMovieRecoveryOpenReconstructionOperation,
  IAutoMovieRecoveryOpenRunDescriptionOperation,
} from "@automovie/interface";

import { describeRecoveryOpenRun } from "./describeRecoveryOpenRun";
import { reconstructRecovery } from "./reconstructRecovery";

/*
 * Consume saved open cubics and their explicit adjacent endpoint transport
 * through the engine. One maximal ordinary run owns its common parameter grid,
 * shared station boundaries and PCHIP station fields. Course joins and the
 * emitted PL surface are not certified C1/G1.
 */
export function reconstructRecoveryOpen(
  bundle: Parameters<IAutoMovieRecoveryOpenReconstructionOperation.Operation>[0],
  graph: Parameters<IAutoMovieRecoveryOpenReconstructionOperation.Operation>[1],
): ReturnType<IAutoMovieRecoveryOpenReconstructionOperation.Operation> {
  if (
    graph.intervals.length !== bundle.reports.length - 1 ||
    graph.orientations.length !== bundle.reports.length ||
    !(graph.resolutionMm > 0) ||
    graph.maxVerticesPerRun < 4
  )
    throw new Error(
      "A complete source-free open-continuation sidecar is required",
    );
  type Node = { section: number; arc: number };
  type Edge = { before: Node; after: Node; reverse: boolean };
  const key: (n: Node) => string = (n: Node): string => `${n.section}:${n.arc}`;
  const outgoing: Map<string, Edge> = new Map(),
    incoming: Map<string, Edge> = new Map();
  let pairs: number = 0,
    unsupportedGroups: number = 0;
  const address: (section: number, arc: number) => void = (
    section: number,
    arc: number,
  ): void => {
    if (arc < 0 || arc >= bundle.reports[section]!.open.length)
      throw new Error(
        "Open curve address does not match saved coefficient authority",
      );
  };
  for (let i: number = 0; i < graph.intervals.length; i++) {
    const interval: IAutoMovieRecoveryOpenContinuation["intervals"][number] =
      graph.intervals[i]!;
    if (
      interval.beforeSection !== i ||
      interval.afterSection !== i + 1 ||
      graph.orientations[i]!.length !== bundle.reports[i]!.open.length
    )
      throw new Error(
        "Open continuation must address every adjacent saved section exactly",
      );
    const seen: [Set<number>, Set<number>] = [new Set(), new Set()];
    const claim: (side: 0 | 1, arc: number) => void = (
      side: 0 | 1,
      arc: number,
    ): void => {
      address(i + side, arc);
      if (seen[side].has(arc))
        throw new Error("Open adjacency records overlap");
      seen[side].add(arc);
    };
    for (const pair of interval.pairs) {
      claim(0, pair.before);
      claim(1, pair.after);
      const edge: Edge = {
        before: { section: i, arc: pair.before },
        after: { section: i + 1, arc: pair.after },
        reverse: pair.reverseAfter,
      };
      if (outgoing.has(key(edge.before)) || incoming.has(key(edge.after)))
        throw new Error(
          "Ordinary open continuation has multiple incident strips",
        );
      outgoing.set(key(edge.before), edge);
      incoming.set(key(edge.after), edge);
      pairs++;
    }
    for (const group of interval.unresolved) {
      for (const arc of group.before) claim(0, arc);
      for (const arc of group.after) claim(1, arc);
      unsupportedGroups++;
    }
    if (
      seen[0].size !== bundle.reports[i]!.open.length ||
      seen[1].size !== bundle.reports[i + 1]!.open.length
    )
      throw new Error(
        "Open adjacency omits a saved arc rather than reporting its local uncertainty",
      );
  }
  if (
    graph.orientations.at(-1)!.length !== bundle.reports.at(-1)!.open.length ||
    graph.orientations.some((row: (1 | -1 | null)[]): boolean =>
      row.some(
        (x: 1 | -1 | null): boolean => x !== null && x !== 1 && x !== -1,
      ),
    )
  )
    throw new Error("Orientation witnesses must align with saved arcs");
  const base: ReturnType<IAutoMovieReconstructRecovery.Operation> =
    reconstructRecovery(bundle);
  const construction: ReturnType<IAutoMovieRecoveryOpenReconstructionOperation.Operation>["construction"] =
    [...base.construction];
  const diagnostics: string[] = [
    ...base.diagnostics,
    ...graph.diagnostics,
    "Closed-only unresolved records are preserved independently; open continuation can supply additional surfaces for those previously unrepresented observations.",
    "Open surfaces use one normalized phase chart and station PCHIP per maximal run; neither source injectivity nor global course C1/G1 or surface error is certified.",
  ];
  const openReports: ReturnType<IAutoMovieRecoveryOpenReconstructionOperation.Operation>["openReports"] =
    { runs: [], pairs, unsupportedGroups, generatedRuns: 0 };
  const normalized: (
    curve: IAutoMovieCubicBezierCurve64,
    reverse: boolean,
  ) => IAutoMovieCubicBezierCurve64 = (
    curve: IAutoMovieCubicBezierCurve64,
    reverse: boolean,
  ): IAutoMovieCubicBezierCurve64 => {
    if (
      curve.closed ||
      curve.unit !== "mm" ||
      curve.phaseIntervals.length !== curve.spans.length
    )
      throw new Error("Saved open cubic millimetre authority required");
    const widths: number[] = reverse
      ? [...curve.phaseIntervals].reverse()
      : [...curve.phaseIntervals];
    const total: number = widths.reduce(
      (sum: number, h: number): number => sum + h,
      0,
    );
    if (!(total > 0)) throw new Error("Open curve phase cannot be normalized");
    let prefix: number = 0;
    const phaseIntervals: number[] = widths.map(
      (width: number, i: number): number => {
        const value: number =
          i + 1 === widths.length ? 1 - prefix : width / total;
        if (!(value > 0))
          throw new Error(
            "Normalized open phase interval is not representable",
          );
        prefix += value;
        return value;
      },
    );
    const spans: AutoMovieCubicBezierControls3[] = reverse
      ? [...curve.spans]
          .reverse()
          .map(
            (
              span: AutoMovieCubicBezierControls3,
            ): AutoMovieCubicBezierControls3 => [
              span[3],
              span[2],
              span[1],
              span[0],
            ],
          )
      : [...curve.spans];
    return {
      ...curve,
      closed: false,
      phaseUnit: "normalized",
      phaseIntervals,
      spans,
    };
  };
  for (const edge of outgoing.values()) {
    if (incoming.has(key(edge.before))) continue;
    const nodes: Node[] = [edge.before];
    const reversals: boolean[] = [
      graph.orientations[edge.before.section]![edge.before.arc] === -1,
    ];
    let current: Edge | undefined = edge;
    while (current) {
      const previousReversal: boolean = reversals.at(-1)!;
      nodes.push(current.after);
      reversals.push(previousReversal !== current.reverse);
      current = outgoing.get(key(current.after));
    }
    const id: string = `recovery.open.${key(nodes[0]!)}`;
    const metadata: ReturnType<IAutoMovieRecoveryOpenRunDescriptionOperation.Operation> =
      describeRecoveryOpenRun(bundle, nodes);
    diagnostics.push(
      ...metadata.diagnostics.map(
        (message: string): string => `${id}: ${message}`,
      ),
    );
    const record: (typeof openReports.runs)[number] = {
      id,
      firstSection: nodes[0]!.section,
      lastSection: nodes.at(-1)!.section,
      curves: metadata.curves,
      generated: false,
      reason: null,
      vertices: 0,
      triangles: 0,
      omittedZeroAreaTriangles: 0,
      unresolvedVertexNormals: 0,
      isolatedVertices: 0,
      nonfiniteNormalSums: 0,
    };
    try {
      const courses: IAutoMovieCubicBezierCurve64[] = nodes.map(
        (n: Node, i: number): IAutoMovieCubicBezierCurve64 =>
          normalized(
            bundle.reports[n.section]!.open[n.arc]!.curve,
            reversals[i]!,
          ),
      );
      const guides: Set<number> = new Set([0, 1]);
      for (const course of courses) {
        let phase: number = 0;
        for (const width of course.phaseIntervals) {
          phase += width;
          guides.add(phase);
        }
      }
      const grid: ReturnType<typeof AutoMovieEngineCurveGrid64.tessellate> =
        AutoMovieEngineCurveGrid64.tessellate({
          name: id,
          topologyDomain: id,
          stations: nodes.map(
            (n: Node): number => bundle.loft.sections[n.section]!.coordinateMm,
          ),
          courses,
          resolutionMm: graph.resolutionMm,
          guides: [...guides].sort((a: number, b: number): number => a - b),
          maxVertices: graph.maxVerticesPerRun,
        });
      base.model.parts.push({
        id,
        name: null,
        geometry: { type: "mesh", mesh: grid.mesh },
        material: null,
        attachedBone: null,
        transform: null,
      });
      for (const line of grid.construction.lines) construction.push(line);
      record.generated = true;
      record.vertices = grid.counts.vertices;
      record.triangles = grid.counts.triangles;
      record.omittedZeroAreaTriangles = grid.counts.omittedZeroAreaTriangles;
      openReports.generatedRuns++;
      record.unresolvedVertexNormals = grid.counts.unresolvedVertexNormals;
      record.isolatedVertices = grid.counts.isolatedVertices;
      record.nonfiniteNormalSums = grid.counts.nonfiniteNormalSums;
      if (record.unresolvedVertexNormals)
        diagnostics.push(
          `${id}: ${record.unresolvedVertexNormals} vertex normals remain unqualified, including ${record.isolatedVertices} isolated vertices and ${record.nonfiniteNormalSums} nonfinite normal sums; finite geometry remains displayed`,
        );
      for (let i: number = 0; i < nodes.length; i++) {
        const n: Node = nodes[i]!,
          sign: 1 | -1 | null = graph.orientations[n.section]![n.arc]!;
        if (sign === null || sign < 0 !== reversals[i])
          diagnostics.push(
            `${id}: source material orientation is unqualified at saved open arc ${key(n)}; geometry remains displayed`,
          );
      }
    } catch (failure: unknown) {
      record.reason =
        failure instanceof Error ? failure.message : String(failure);
      diagnostics.push(`${id}: open grid unresolved: ${record.reason}`);
    }
    openReports.runs.push(record);
  }
  return { ...base, construction, diagnostics, openReports };
}
