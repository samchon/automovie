/** Host-only adaptation of the retained reference-experiments realization, SHA-256 5859b65144d933c1393344f3834e60582b6b8a0e8b70fb947dc3a7895905c13b. Numerical owners, options, ordering and coefficient evaluation are unchanged. */
import { type IAutoMovieCurve64 as C, tessellateAutoMovieLocalHermite64 as T } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";
import { restoreRecoveryCurveBasis, prepareRecoveryLocalContinuation, normalizeRecoveryCourse, describeRecoveryOpenRun, describeRecoveryNamedDomains, reconstructRecovery, realizeAutoMovieRecoveryAnalyticDomains, type IAutoMovieRecoveryTensorFamiliesInput, type IAutoMovieRecoveryOpenContinuation, type IAutoMovieRecoveryTensorConstruction, type RecoveryLocalRunReport } from "@automovie/recovery";

/** Browser consumer policy; mathematical limits remain the official Node limits. */
interface Options {
  /** Explicit ruled operator; legacy closed reconstruction alone is not ruled. */
  operator: "ruled";
  /** Retain actual engine construction, default true; never recreate it from a mesh. */
  construction?: boolean;
  /** Optional caller scheduling boundary, awaited before base and after chunks/runs. */
  yieldControl?: () => Promise<void>;
  /** Progress only; callback failures abort rather than becoming geometry failures. */
  onProgress?: (progress: { runs: number; chunks: number; vertices: number; triangles: number }) => void;
}
/** Source-free graph addresses retain the official run direction and ordering. */
type Node = { section: number; arc: number };
/** Closed diagnostic messages kept verbatim in the summary; the rest are counted. */
const DIAGNOSTIC_EXAMPLES: number = 32;
/** Same explicit graph edge accepted by prepareRecoveryLocalContinuation. */
type Edge = ReturnType<typeof prepareRecoveryLocalContinuation>["outgoing"] extends Map<string, infer E> ? E : never;

/**
 * Realize the official saved-coefficient recoveryLocal ruled path in memory.
 * This existing-program browser adapter reuses the same basis restoration,
 * analytic ownership, closed reconstruction, continuation admission, maximal-run
 * ordering, course normalization and local Hermite tessellator as the Node host.
 * The engine already emits model-metre positions/construction and analytic normals;
 * like its spool, this consumer appends them unchanged and preserves global open
 * indices across chunks/runs. It never reconverts mm, welds or substitutes normals.
 *
 * The caller binds the parsed curves/graph to exact saved byte SHA receipts before
 * invoking this function. Source vertices are not an input. Large primitive,
 * interaction, spool-ownership and checkpoint ledgers are not constructed here;
 * generated closed detail is reduced to complete counts/reason histograms and
 * bounded diagnostic examples. Full run failures/fit qualification survive.
 * Geometry is retained in memory, so its storage remains proportional to output.
 * Yielding occurs between engine chunks; existing synchronous basis/closed/analytic
 * kernels and individual bounded engine planning calls cannot yield internally.
 * Processing completion does not qualify source fit, anatomical correspondence,
 * global embedding or missing branch/critical geometry.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Existing Recovery owners and the same ruled local Hermite engine, limits, station ordering and reversal accumulation produce the closed base and open mesh without a new numerical algorithm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One in-memory consumer replaces only disk spooling/publication; the main program owns recipe binding, camera display and capture.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No source mesh, normal fallback, changed curve order/phase, hand-selected station, parameter correction, legacy-as-ruled label or invented branch closure is used.
 * @evidence contracts/development/common.md#meaningful-documentation States metre/global-index authority, explicit scheduling boundaries, synchronous limitations, metadata reduction, construction omission and independent geometric qualifications.
 * @evidence contracts/development/implementation.md#efficient-algorithms Existing kernels own numerical work; appending is linear in emitted scalars. Graph preparation and maximal-run traversal retain the Node host's ordering and expected linear incidence cost.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Saved curves are restored once and each analytic/closed/open domain is generated once. The same retained model serves subsequent camera renders without serialization or regeneration.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Mesh arrays and optional construction remain caller-owned output; large closed ledgers are summarized and released before open generation. Generator finally blocks release local plans and no files, process handles or global caches are acquired.
 */
export async function ReferenceRuledRealization(savedCurves: unknown, graph: IAutoMovieRecoveryOpenContinuation, options: Options): Promise<{
  model: IAutoMovieModel;
  construction: { units: "m"; lines: IAutoMovieRecoveryTensorConstruction[] };
  summary: {
    operator: "ruled"; processingComplete: boolean; sourceFitQualified: false;
    counts: { vertices: number; triangles: number; openVertices: number; openTriangles: number; chunks: number };
    closed: { diagnostics: number; diagnosticExamples: string[]; unresolved: ReturnType<typeof histogram>; strips: ReturnType<typeof histogram>; primitives: number; interactions: ReturnType<typeof histogram>; tensorReports: ReturnType<typeof reconstructRecovery>["tensorReports"]; analyticReports: ReturnType<typeof reconstructRecovery>["analyticReports"]; named: { members: ReturnType<typeof describeRecoveryNamedDomains>["members"]; diagnostics: string[] } };
    graph: { diagnostics: readonly string[]; pairs: number; completedPairs: number; failedRunPairs: number; omittedIntervals: number; unsupportedGroups: number; unsupportedGroupsWithOpenArcs: number };
    runs: RecoveryLocalRunReport[];
    omittedMetadata: readonly string[];
  };
}> {
  if (options.operator !== "ruled") throw new Error("Explicit recoveryLocal ruled operator required");
  const bundle: IAutoMovieRecoveryTensorFamiliesInput = restoreRecoveryCurveBasis(savedCurves) as IAutoMovieRecoveryTensorFamiliesInput;
  if (!(bundle.policy.toleranceMm > 0 && Number.isFinite(bundle.policy.toleranceMm))) throw new Error("A positive physical approximation budget is required");
  if (graph.intervals.length !== bundle.reports.length - 1 || graph.orientations.length !== bundle.reports.length || !(graph.resolutionMm > 0 && Number.isFinite(graph.resolutionMm)) || !Number.isSafeInteger(graph.maxVerticesPerRun) || graph.maxVerticesPerRun < 4)
    throw new Error("A complete source-free open-continuation sidecar is required");
  const analytic: ReturnType<typeof realizeAutoMovieRecoveryAnalyticDomains> = realizeAutoMovieRecoveryAnalyticDomains(bundle, graph);
  const prepared: ReturnType<typeof prepareRecoveryLocalContinuation> = prepareRecoveryLocalContinuation(bundle, graph, analytic);
  const { key, outgoing, incoming, pairs, unsupportedGroups, unsupportedGroupsWithOpenArcs }: typeof prepared = prepared;
  await pause();
  const base: ReturnType<typeof reconstructRecovery> = reconstructRecovery(bundle, { observeWork:true,analytic });
  const named: ReturnType<typeof describeRecoveryNamedDomains> = describeRecoveryNamedDomains(bundle, base);
  const plannedTensorFamilies: number = named.members.filter((member: (typeof named.members)[number]): boolean => member.kind === "tensor-family").length;
  const analyticComplete: boolean = named.diagnostics.length === 0 && named.members.filter((member: (typeof named.members)[number]): boolean => member.kind === "analytic-domain").every((member: (typeof named.members)[number]): boolean => member.admitted === true) && base.analyticReports.every((report: (typeof base.analyticReports)[number]): boolean => report.admitted && report.complete && report.observationComplete && report.unrepresentedDomains.length === 0);
  const closed: Awaited<ReturnType<typeof ReferenceRuledRealization>>["summary"]["closed"] = {
    diagnostics: base.diagnostics.length, diagnosticExamples: base.diagnostics.slice(0, DIAGNOSTIC_EXAMPLES),
    unresolved: histogram(base.unresolved), strips: histogram(base.stripObservations), primitives: base.primitiveRanges.length,
    interactions: histogram(base.interactionObservations), tensorReports: base.tensorReports, analyticReports: base.analyticReports, named: { members: named.members, diagnostics: named.diagnostics },
  };

  // The closed reconstruction returns full ledgers; once summarized they are released before open generation.
  base.diagnostics.length = 0; base.unresolved.length = 0; base.stripObservations.length = 0; base.primitiveRanges.length = 0; base.interactionObservations.length = 0;
  const lines: IAutoMovieRecoveryTensorConstruction[] = options.construction === false ? [] : base.construction;
  if (options.construction === false) base.construction.length = 0;
  let closedVertices: number = 0, closedTriangles: number = 0;
  for (const part of base.model.parts) if (part.geometry.type === "mesh") {
    closedVertices += part.geometry.mesh.positions.length / 3;
    closedTriangles += part.geometry.mesh.indices!.length / 3;
  }
  const mesh: IAutoMovieMesh = { positions: [], normals: [], indices: [], uvs: null, skin: null };
  base.model.parts.push({ id: "recovery.local-open", name: null, geometry: { type: "mesh", mesh }, material: null, attachedBone: null, transform: null });
  let vertices: number = 0, triangles: number = 0, chunks: number = 0, completedPairs: number = 0, failedRunPairs: number = 0, omittedIntervals: number = 0;
  const runs: RecoveryLocalRunReport[] = [];
  const starters: { edge: Edge; openOnlySpanMm: number }[] = [];
  for (const edge of outgoing.values()) {
    if (incoming.has(key(edge.before))) continue;
    let probe: Edge | undefined = edge, openOnlySpanMm: number = 0;
    while (probe) {
      if (!bundle.loft.sections[probe.before.section]!.loops.length && !bundle.loft.sections[probe.after.section]!.loops.length)
        openOnlySpanMm += bundle.loft.sections[probe.after.section]!.coordinateMm - bundle.loft.sections[probe.before.section]!.coordinateMm;
      probe = outgoing.get(key(probe.after));
    }
    starters.push({ edge, openOnlySpanMm });
  }
  starters.sort((a: (typeof starters)[number], b: (typeof starters)[number]): number => b.openOnlySpanMm - a.openOnlySpanMm || a.edge.before.section - b.edge.before.section || a.edge.before.arc - b.edge.before.arc);
  for (const { edge } of starters) {
    const nodes: Node[] = [edge.before], reversals: boolean[] = [graph.orientations[edge.before.section]![edge.before.arc] === -1];
    let current: Edge | undefined = edge;
    while (current) { const previous:boolean=reversals.at(-1)!;nodes.push(current.after); reversals.push(previous !== current.reverse); current = outgoing.get(key(current.after)); }
    const id: string = "recovery.local." + key(nodes[0]!);
    const metadata: ReturnType<typeof describeRecoveryOpenRun> = describeRecoveryOpenRun(bundle, nodes);
    const record: RecoveryLocalRunReport = {
      id, firstSection: nodes[0]!.section, lastSection: nodes.at(-1)!.section, curves: metadata.curves,
      generated: false, reason: null, intervals: nodes.length - 1, omittedIntervals: 0, vertices: 0, triangles: 0,
      unqualifiedSourceOrientations: nodes.filter((n: Node, i: number): boolean => graph.orientations[n.section]![n.arc] === null || (graph.orientations[n.section]![n.arc]! < 0) !== reversals[i]).length,
      fitTargetMisses: metadata.fitTargetMisses, unqualifiedFitMetadata: metadata.unqualifiedFitMetadata,
      fitPolylineUpperEstimateMaximumMm: metadata.fitPolylineUpperEstimateMaximumMm,
    };
    runs.push(record);
    let iterator: Generator<T.Chunk, T.Summary, void> | undefined;
    let consumerOperation: boolean = false;
    try {
      const courses: C.Cubic[] = nodes.map((n: Node, i: number): C.Cubic => normalizeRecoveryCourse(bundle.reports[n.section]!.open[n.arc]!.curve, reversals[i]!));
      iterator = T({ name: id, topologyDomain: id, stations: nodes.map((n: Node): number => bundle.loft.sections[n.section]!.coordinateMm), courses,
        stationInterpolation: "ruled", toleranceMm: bundle.policy.toleranceMm, maxCellsPerInterval: 200_000, maxVerticesPerChunk: 32_768, vertexOffset: vertices });
      let result: IteratorResult<T.Chunk, T.Summary> = iterator.next();
      while (!result.done) {
        const chunk: T.Chunk = result.value;
        consumerOperation = true;
        append(chunk);
        consumerOperation = false;
        record.vertices += chunk.counts.vertices; record.triangles += chunk.counts.triangles; record.generated ||= chunk.counts.triangles > 0;
        result = iterator.next();
        consumerOperation = true;
        progress(); await pause();
        consumerOperation = false;
      }
      completedPairs += result.value.intervals; omittedIntervals += result.value.omittedIntervals; record.omittedIntervals = result.value.omittedIntervals;
      const messages: string[] = [...metadata.diagnostics, ...result.value.diagnostics];
      if (messages.length) record.reason = messages.join("; ");
    } catch (failure) {
      if (consumerOperation) throw failure;
      record.reason = [failure instanceof Error ? failure.message : String(failure), ...metadata.diagnostics].join("; ");
      failedRunPairs += record.intervals;
    } finally {
      iterator?.return({ intervals: 0, omittedIntervals: 0, vertices: 0, triangles: 0, diagnostics: [] });
    }
    progress(); await pause();
  }
  return {
    model: base.model, construction: { units: "m", lines },
    summary: { operator: "ruled", processingComplete: analyticComplete && completedPairs === pairs && failedRunPairs === 0 && omittedIntervals === 0 && unsupportedGroups === 0 && closed.unresolved.total === 0 && triangles + closedTriangles > 0 && base.tensorReports.length === plannedTensorFamilies && named.members.filter((member: (typeof named.members)[number]): boolean => member.kind === "tensor-family").every((member: (typeof named.members)[number]): boolean => member.admitted === true) && base.tensorReports.every((report: (typeof base.tensorReports)[number]): boolean => report.complete), sourceFitQualified: false,
      counts: { vertices: closedVertices + vertices, triangles: closedTriangles + triangles, openVertices: vertices, openTriangles: triangles, chunks }, closed,
      graph: { diagnostics: graph.diagnostics, pairs, completedPairs, failedRunPairs, omittedIntervals, unsupportedGroups, unsupportedGroupsWithOpenArcs }, runs,
      omittedMetadata: ["Disk spool/checkpoints and per-primitive open ownership are deliberately absent", "Generated physical-vertex identity sidecar is omitted; render positions, analytic normals and global triangle indices are unchanged", "Closed primitive/interaction/strip details are summarized as complete counts/reason histograms; diagnostic text examples are bounded to 32", ...(options.construction === false ? ["Construction omitted by explicit consumer option"] : [])] },
  };

  /** Preserve the Node spool's append admission and unchanged engine units/indexing. */
  function append(chunk: T.Chunk): void {
    const count: number = chunk.positions.length / 3;
    if (chunk.vertexStart !== vertices || !Number.isSafeInteger(count) || chunk.normals.length !== chunk.positions.length || chunk.physicalVertexIds.length !== count || chunk.indices.length % 3 || chunk.positions.some((x: number): boolean => !Number.isFinite(x)) || chunk.normals.some((x: number): boolean => !Number.isFinite(x)) || chunk.indices.some((x: number): boolean => !Number.isSafeInteger(x) || x < 0 || x >= vertices + count))
      throw new Error("Engine stream violated append-only indexed mesh admission");
    for (const value of chunk.positions) mesh.positions.push(value);
    for (const value of chunk.normals) mesh.normals!.push(value);
    for (const value of chunk.indices) mesh.indices!.push(value);
    if (options.construction !== false) for (const line of chunk.construction) lines.push(line);
    vertices += count; triangles += chunk.indices.length / 3; chunks++;
  }
  /** Scheduling alters no iteration order, source coefficient or geometry budget. */
  async function pause(): Promise<void> { if (options.yieldControl) await options.yieldControl(); }
  /** The UI receives lightweight actual output counts rather than mesh JSON. */
  function progress(): void { options.onProgress?.({ runs: runs.length, chunks, vertices: closedVertices + vertices, triangles: closedTriangles + triangles }); }
}

/** Count every generated diagnostic record by its explicit reason/code/type.
 * Unnamed record kinds are counted without guessing a geometric explanation. */
function histogram(records: readonly unknown[]): { total: number; reasons: { reason: string; count: number }[] } {
  const counts: Map<string, number> = new Map();
  for (const record of records) {
    const item: Record<string, unknown> | null = record !== null && typeof record === "object" ? record as Record<string, unknown> : null;
    const reason: unknown = item?.reason ?? item?.code ?? item?.kind ?? item?.type;
    const key: string = typeof reason === "string" ? reason : "No explicit reason/code/kind/type";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return { total: records.length, reasons: [...counts].map(([reason, count]: [string, number]): { reason: string; count: number } => ({ reason, count })) };
}

