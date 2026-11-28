import { AutoMovieEngineCurveGrid64 } from "@automovie/engine";
import type {
  IAutoMovieCubicBezierCurve64,
  IAutoMovieReconstructRecovery,
  IAutoMovieRecoveryOpenArcAddress,
  IAutoMovieRecoveryOpenContinuationEdge,
  IAutoMovieRecoveryOpenReconstructionOperation,
  IAutoMovieRecoveryOpenRunDescriptionOperation,
} from "@automovie/interface";

import { describeRecoveryOpenRun } from "./describeRecoveryOpenRun";
import { normalizeRecoveryCourse } from "./normalizeRecoveryCourse";
import { prepareRecoveryLocalContinuation } from "./prepareRecoveryLocalContinuation";
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
  const {
    key,
    incoming,
    outgoing,
    pairs,
    unsupportedGroups,
  }: ReturnType<typeof prepareRecoveryLocalContinuation> =
    prepareRecoveryLocalContinuation(bundle, graph);
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
  for (const edge of outgoing.values()) {
    if (incoming.has(key(edge.before))) continue;
    const nodes: IAutoMovieRecoveryOpenArcAddress[] = [edge.before];
    const reversals: boolean[] = [
      graph.orientations[edge.before.section]![edge.before.arc] === -1,
    ];
    let current: IAutoMovieRecoveryOpenContinuationEdge | undefined = edge;
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
        (
          n: IAutoMovieRecoveryOpenArcAddress,
          i: number,
        ): IAutoMovieCubicBezierCurve64 =>
          normalizeRecoveryCourse(
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
            (n: IAutoMovieRecoveryOpenArcAddress): number =>
              bundle.loft.sections[n.section]!.coordinateMm,
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
        const n: IAutoMovieRecoveryOpenArcAddress = nodes[i]!,
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
