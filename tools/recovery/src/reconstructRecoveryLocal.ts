import { createHash } from "node:crypto";
import path from "node:path";

import type { IAutoMovieCurve64 as C } from "../../../packages/engine/src/geometry/curve/IAutoMovieCurve64.ts";
import { tessellateAutoMovieLocalHermite64 as T } from "../../../packages/engine/src/geometry/curve/tessellateAutoMovieLocalHermite64.ts";
import { RecoveryAnalyticDomains } from "./RecoveryAnalyticDomains.ts";
import { RecoveryLocalArtifact } from "./RecoveryLocalArtifact.ts";
import type { RecoveryLocalResult } from "./RecoveryLocalResult.ts";
import type { RecoveryLocalRunReport } from "./RecoveryLocalRunReport.ts";
import { RecoveryMeshSpool } from "./RecoveryMeshSpool.ts";
import type { RecoveryOpenContinuation as O } from "./RecoveryOpenContinuation.ts";
import type { RecoveryTensorFamilies } from "./RecoveryTensorFamilies.ts";
import { normalizeRecoveryCourse } from "./normalizeRecoveryCourse.ts";
import { prepareRecoveryLocalContinuation } from "./prepareRecoveryLocalContinuation.ts";
import { reconstructRecovery } from "./reconstructRecovery.ts";

/**
 * Generate saved tensor ordinary domains, retained closed domains and bounded open surfaces.
 * Explicit ruled or local quadratic interpolation differs from coefficientwise PCHIP.
 * Its exact source edges and conforming local cells share actual global mesh indices.
 * Spool-backed checkpoints retain all emitted finite geometry and explicit incompletion.
 * The immutable analytic-and-retained-closed base is published before the first open chunk,
 * even when repeated standalone open checkpoints are disabled. Joint spool frontiers
 * persist channel bindings and source-free run cursors independently of rendering.
 *
 * @evidence contracts/common.md#principled-implementation One analytic realization owns its declared closed and open occurrences; the closed adapter dispatches tensor families and retained curve-only domains. Declared ordinary open-arc transport fixes maximal runs and orientation; cubic controls feed the local Hermite engine, whose shared global indices are appended unchanged.
 * @evidence contracts/common.md#clear-and-simple-design Graph admission, run ownership, engine streaming and immutable artifact publication are separate stages. Generated triangle ranges retain run, saved curves and local patch ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source geometry, positional weld, hidden closure, hand-selected station, nonlinear limiter or sample reduction enters reconstruction. Analytic domains own explicitly delegated occurrences; all other unsupported branches remain graph records.
 * @evidence contracts/common.md#meaningful-documentation States the changed operator, coefficient authority, approximation budget, streamed indexing and independent qualification of coverage, regularity and source fidelity.
 * @evidence contracts/performance.md#efficient-algorithms Graph admission is O(P+A); each supported arc belongs to one maximal run. The engine uses local four-course partitions, while disk assembly is linear in emitted data per publication; checkpoints explicitly incur rereads of earlier chunks.
 * @evidence contracts/performance.md#reuse-equivalent-work Each shared station edge and its analytic normal are generated once. The same immutable engine fragments supply unfinished checkpoints and final model, without repeated fitting or reconstruction for camera changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Source-free bundle and graph remain caller-owned. Open output retention is bounded by plans, one chunk and spool staging; closed, analytic and tensor meshes and scalar reports remain retained until publication. Completed open chunks transfer to disk, and cancellation releases local state on exceptions.
 */
export function reconstructRecoveryLocal(
  bundle: RecoveryTensorFamilies.Input,
  graph: O.Continuation,
  output: string,
  binding: {
    sourceEpoch: string;
    curveBundleSha256: string;
    continuationSha256: string;
    operator: "quadratic" | "ruled";
    publishCheckpoints?: boolean;
    analyticPublicationSha256?: string;
  },
): RecoveryLocalResult {
  if (
    (binding.operator !== "quadratic" && binding.operator !== "ruled") ||
    !(
      bundle.policy.toleranceMm > 0 &&
      Number.isFinite(bundle.policy.toleranceMm)
    )
  )
    throw new Error(
      "Explicit interpolation and a positive physical approximation budget required",
    );
  if (
    graph.schema !== "automovie-recovery-open-continuation-v1" ||
    graph.intervals.length !== bundle.reports.length - 1 ||
    graph.orientations.length !== bundle.reports.length ||
    !(graph.resolutionMm > 0 && Number.isFinite(graph.resolutionMm)) ||
    !Number.isSafeInteger(graph.maxVerticesPerRun) ||
    graph.maxVerticesPerRun < 4
  )
    throw new Error(
      "A complete source-free open-continuation sidecar is required",
    );
  const analytic: ReturnType<typeof RecoveryAnalyticDomains> =
    RecoveryAnalyticDomains(bundle, graph);
  type Node = { section: number; arc: number };
  type Edge = {
    before: Node;
    after: Node;
    reverse: boolean;
    pairOrdinal: number;
  };
  const {
    key,
    outgoing,
    incoming,
    pairs,
    unsupportedGroups,
    unsupportedGroupsWithOpenArcs,
  }: ReturnType<typeof prepareRecoveryLocalContinuation> =
    prepareRecoveryLocalContinuation(bundle, graph, analytic);
  const started: number = performance.now();
  console.error(
    JSON.stringify({
      phase: "local-closed-control-start",
      pairs,
      memory: process.memoryUsage(),
    }),
  );
  const base: ReturnType<typeof reconstructRecovery> = reconstructRecovery(
    bundle,
    { observeWork: true, analytic },
  );
  for (const diagnostic of graph.diagnostics) base.diagnostics.push(diagnostic);
  console.error(
    JSON.stringify({
      phase: "local-closed-control-complete",
      elapsedMs: performance.now() - started,
      memory: process.memoryUsage(),
    }),
  );
  const spool: ReturnType<typeof RecoveryMeshSpool> = RecoveryMeshSpool(
    `${output}.spool`,
    base.construction,
  );
  base.construction.length = 0;
  const closedCounts: { vertices: number; triangles: number } = {
    vertices: 0,
    triangles: 0,
  };
  for (const part of base.model.parts)
    if (part.geometry.type === "mesh") {
      closedCounts.vertices += part.geometry.mesh.positions.length / 3;
      closedCounts.triangles += part.geometry.mesh.indices!.length / 3;
    }
  base.model.parts.push({
    id: "recovery.local-open",
    name: null,
    geometry: { type: "mesh", mesh: spool.mesh },
    material: null,
    attachedBone: null,
    transform: null,
  });
  type RunReport = RecoveryLocalRunReport;
  const runs: RunReport[] = [],
    checkpoints: { path: string; sha256: string; bytes: number }[] = [];
  let completedPairs: number = 0,
    publishedPairs: number = 0,
    nextCheckpoint: number = 2048,
    omittedIntervals: number = 0,
    failedRunPairs: number = 0,
    peakHeap: number = process.memoryUsage().heapUsed,
    peakRss: number = process.memoryUsage().rss;
  const memory: () => NodeJS.MemoryUsage = (): NodeJS.MemoryUsage => {
    const value: NodeJS.MemoryUsage = process.memoryUsage();
    peakHeap = Math.max(peakHeap, value.heapUsed);
    peakRss = Math.max(peakRss, value.rss);
    return value;
  };
  const counts: () => { vertices: number; triangles: number } = (): {
    vertices: number;
    triangles: number;
  } => ({
    vertices: closedCounts.vertices + spool.counts.vertices,
    triangles: closedCounts.triangles + spool.counts.triangles,
  });
  const publish: (
    file: string,
    complete: boolean,
    role?: string,
  ) => {
    sha256: string;
    bytes: number;
    completion: ReturnType<typeof RecoveryLocalArtifact>["coverage"];
  } = (
    file: string,
    complete: boolean,
    role: string = "generated-prefix",
  ): {
    sha256: string;
    bytes: number;
    completion: ReturnType<typeof RecoveryLocalArtifact>["coverage"];
  } => {
    const artifact: ReturnType<typeof RecoveryLocalArtifact> =
      RecoveryLocalArtifact({
        base,
        spool,
        bundle,
        graph,
        binding,
        runs,
        pairs,
        completedPairs,
        failedRunPairs,
        omittedIntervals,
        unsupportedGroups,
        unsupportedGroupsWithOpenArcs,
        publishedPairs,
        complete,
        started,
        output,
        counts,
        memory,
        peaks: (): { heap: number; rss: number } => ({
          heap: peakHeap,
          rss: peakRss,
        }),
      });
    return {
      ...spool.publish(file, { ...artifact, publicationRole: role }),
      completion: artifact.coverage,
    };
  };
  const baseFile: string = `${output}.base.json`;
  const baseSaved: ReturnType<typeof publish> = publish(
    baseFile,
    false,
    "analytic-and-retained-closed-base",
  );
  const baseCheckpoint: { path: string; sha256: string; bytes: number } = {
    path: path.resolve(baseFile),
    sha256: baseSaved.sha256,
    bytes: baseSaved.bytes,
  };
  let frontier: ReturnType<typeof spool.commit> = spool.commit(
    `${output}.frontier-0.json`,
    {
      binding,
      baseCheckpoint,
      runs: [],
      completedPairs,
      publishedPairs,
      failedRunPairs,
      omittedIntervals,
      currentRun: null,
    },
  );
  let nextFrontier: number = 2048;
  console.log(
    JSON.stringify({
      phase: "local-base-checkpoint",
      ...baseCheckpoint,
      counts: counts(),
      frontier,
      processingComplete: false,
    }),
  );
  const starters: { edge: Edge; openOnlySpanMm: number }[] = [];
  for (const edge of outgoing.values()) {
    if (incoming.has(key(edge.before))) continue;
    let probe: Edge | undefined = edge,
      openOnlySpanMm: number = 0;
    while (probe) {
      if (
        !bundle.loft.sections[probe.before.section]!.loops.length &&
        !bundle.loft.sections[probe.after.section]!.loops.length
      )
        openOnlySpanMm +=
          bundle.loft.sections[probe.after.section]!.coordinateMm -
          bundle.loft.sections[probe.before.section]!.coordinateMm;
      probe = outgoing.get(key(probe.after));
    }
    starters.push({ edge, openOnlySpanMm });
  }
  // Publication order favors the largest declared open-only observation gap; it changes no field or station.
  starters.sort(
    (a: (typeof starters)[number], b: (typeof starters)[number]): number =>
      b.openOnlySpanMm - a.openOnlySpanMm ||
      a.edge.before.section - b.edge.before.section ||
      a.edge.before.arc - b.edge.before.arc,
  );
  for (const { edge } of starters) {
    const pairOrdinals: number[] = [];
    const nodes: Node[] = [edge.before],
      reversals: boolean[] = [
        graph.orientations[edge.before.section]![edge.before.arc] === -1,
      ];
    let current: Edge | undefined = edge;
    while (current) {
      const previous: boolean = reversals.at(-1)!;
      nodes.push(current.after);
      pairOrdinals.push(current.pairOrdinal);
      reversals.push(previous !== current.reverse);
      current = outgoing.get(key(current.after));
    }
    const id: string = `recovery.local.${key(nodes[0]!)}`;
    const record: RunReport = {
      id,
      firstSection: nodes[0]!.section,
      lastSection: nodes.at(-1)!.section,
      curves: nodes.map(
        (n: Node): string => bundle.reports[n.section]!.open[n.arc]!.curve.name,
      ),
      generated: false,
      reason: null,
      intervals: nodes.length - 1,
      omittedIntervals: 0,
      vertices: 0,
      triangles: 0,
      unqualifiedSourceOrientations: nodes.filter(
        (n: Node, i: number): boolean =>
          graph.orientations[n.section]![n.arc] === null ||
          graph.orientations[n.section]![n.arc]! < 0 !== reversals[i],
      ).length,
      fitTargetMisses: nodes.filter(
        (n: Node): boolean =>
          !bundle.reports[n.section]!.open[n.arc]!.toleranceMet,
      ).length,
      fitPolylineUpperEstimateMaximumMm: nodes.reduce(
        (maximum: number, n: Node): number =>
          Math.max(
            maximum,
            bundle.reports[n.section]!.open[n.arc]!.polylineUpperEstimateMm,
          ),
        0,
      ),
    };
    runs.push(record);
    const runStartChunks: number = spool.counts.chunks,
      preRunVertexOffset: number = spool.counts.vertices;
    const runDigest: ReturnType<typeof createHash> = createHash("sha256");
    if (runs.length === 1 || runs.length % 128 === 0)
      console.error(
        JSON.stringify({
          phase: "local-run-start",
          run: id,
          sections: [record.firstSection, record.lastSection],
          rangeMm: [
            bundle.loft.sections[record.firstSection]!.coordinateMm,
            bundle.loft.sections[record.lastSection]!.coordinateMm,
          ],
          sourceSpans: nodes.reduce(
            (n: number, node: Node): number =>
              n +
              bundle.reports[node.section]!.open[node.arc]!.curve.spans.length,
            0,
          ),
          memory: memory(),
          elapsedMs: performance.now() - started,
        }),
      );
    let iterator: Generator<T.Chunk, T.Summary, void> | undefined;
    let outputOperation: boolean = false;
    try {
      const courses: C.Cubic[] = nodes.map(
        (n: Node, i: number): C.Cubic =>
          normalizeRecoveryCourse(
            bundle.reports[n.section]!.open[n.arc]!.curve,
            reversals[i]!,
          ),
      );
      iterator = T({
        name: id,
        topologyDomain: id,
        stations: nodes.map(
          (n: Node): number => bundle.loft.sections[n.section]!.coordinateMm,
        ),
        courses,
        stationInterpolation: binding.operator,
        toleranceMm: bundle.policy.toleranceMm,
        maxCellsPerInterval: 200_000,
        maxVerticesPerChunk: 32_768,
        vertexOffset: spool.counts.vertices,
      });
      let result: IteratorResult<T.Chunk, T.Summary> = iterator.next();
      while (!result.done) {
        const chunk: T.Chunk = result.value;
        outputOperation = true;
        spool.append(chunk, {
          run: id,
          firstSection: record.firstSection,
          curves: record.curves,
          pairs: pairOrdinals,
        });
        runDigest.update(JSON.stringify(chunk));
        outputOperation = false;
        record.vertices += chunk.counts.vertices;
        record.triangles += chunk.counts.triangles;
        record.generated ||= chunk.counts.triangles > 0;
        result = iterator.next();
        if (result.done || result.value.interval !== chunk.interval)
          publishedPairs++;
        if (spool.counts.chunks >= nextFrontier && !result.done) {
          outputOperation = true;
          frontier = spool.commit(
            `${output}.frontier-${spool.counts.chunks}.json`,
            {
              binding,
              baseCheckpoint,
              runs,
              completedPairs,
              publishedPairs,
              failedRunPairs,
              omittedIntervals,
              currentRun: {
                id,
                firstSection: record.firstSection,
                curves: record.curves,
                nodes,
                reversals,
                pairOrdinals,
                emittedRunChunks: spool.counts.chunks - runStartChunks,
                preRunVertexOffset,
                emittedChunkSha256: runDigest.copy().digest("hex"),
                iteratorDone: false,
              },
            },
          );
          outputOperation = false;
          console.log(
            JSON.stringify({
              phase: "local-spool-frontier",
              ...frontier,
              counts: counts(),
              processingComplete: false,
            }),
          );
          nextFrontier = spool.counts.chunks + 2048;
        }
        if (
          binding.publishCheckpoints !== false &&
          spool.counts.triangles > 0 &&
          ((!checkpoints.length && publishedPairs >= 5) ||
            spool.counts.chunks >= nextCheckpoint)
        ) {
          outputOperation = true;
          const file: string = `${output}.checkpoint-${spool.counts.chunks}.json`,
            saved: ReturnType<typeof publish> = publish(file, false);
          outputOperation = false;
          checkpoints.push({ path: path.resolve(file), ...saved });
          console.log(
            JSON.stringify({
              phase: "local-checkpoint",
              file,
              ...saved,
              counts: counts(),
              memory: memory(),
              elapsedMs: performance.now() - started,
            }),
          );
          if (spool.counts.chunks >= nextCheckpoint) nextCheckpoint *= 2;
        }
        if (spool.counts.chunks % 32 === 0)
          console.error(
            JSON.stringify({
              phase: "local-mesh-spool",
              run: id,
              interval: chunk.interval,
              chunks: spool.counts.chunks,
              counts: counts(),
              memory: memory(),
              elapsedMs: performance.now() - started,
            }),
          );
      }
      completedPairs += result.value.intervals;
      omittedIntervals += result.value.omittedIntervals;
      record.omittedIntervals = result.value.omittedIntervals;
      if (result.value.diagnostics.length)
        record.reason = result.value.diagnostics.join("; ");
    } catch (failure: unknown) {
      if (outputOperation) throw failure;
      record.reason =
        failure instanceof Error ? failure.message : String(failure);
      failedRunPairs += record.intervals;
      console.error(
        JSON.stringify({
          phase: "local-run-failure",
          run: id,
          reason: record.reason,
          retainedTriangles: record.triangles,
          memory: memory(),
        }),
      );
    } finally {
      iterator?.return({
        intervals: 0,
        omittedIntervals: 0,
        vertices: 0,
        triangles: 0,
        diagnostics: [],
      });
    }
  }
  frontier = spool.commit(`${output}.frontier-final.json`, {
    binding,
    baseCheckpoint,
    runs,
    completedPairs,
    publishedPairs,
    failedRunPairs,
    omittedIntervals,
    currentRun: null,
  });
  const saved: ReturnType<typeof publish> = publish(
    output,
    true,
    "final-attempt",
  );
  return { ...saved, counts: counts(), checkpoints, baseCheckpoint, frontier };
}
