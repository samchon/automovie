import path from "node:path";

import type { IAutoMovieCurve64 as C } from "../../../packages/engine/src/geometry/curve/IAutoMovieCurve64.ts";
import { tessellateAutoMovieLocalHermite64 as T } from "../../../packages/engine/src/geometry/curve/tessellateAutoMovieLocalHermite64.ts";
import type { RecoveryMeshSections as R } from "./RecoveryMeshSections.ts";
import { RecoveryMeshSpool } from "./RecoveryMeshSpool.ts";
import type { RecoveryOpenContinuation as O } from "./RecoveryOpenContinuation.ts";
import { prepareRecoveryOpenRuns } from "./prepareRecoveryOpenRuns.ts";
import { reconstructRecovery } from "./reconstructRecovery.ts";

/**
 * Generate a bounded open surface from saved coefficients and explicit graph transport, using ruled or local quadratic interpolation instead of coefficientwise PCHIP. Shared global mesh indices and spool-backed checkpoints preserve finite geometry and explicit incompletion.
 *
 * @evidence contracts/common.md#principled-implementation Declared ordinary arc transport fixes maximal runs and orientation; complete cubic controls feed the engine's local Hermite operator, while its shared global indices are appended unchanged to the interface mesh.
 * @evidence contracts/common.md#clear-and-simple-design Graph admission, run ownership, engine streaming and immutable artifact publication are separate stages. Generated triangle ranges retain run, saved curves and local patch ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source geometry, positional weld, hidden closure, hand-selected station, nonlinear limiter or sample reduction enters reconstruction. Unsupported branches remain explicit graph records.
 * @evidence contracts/common.md#meaningful-documentation States the changed operator, coefficient authority, approximation budget, streamed indexing and independent qualification of coverage, regularity and source fidelity.
 * @evidence contracts/performance.md#efficient-algorithms Graph admission is O(P+A); each supported arc belongs to one maximal run. The engine uses local four-course partitions, while disk assembly is linear in emitted data per publication; checkpoints explicitly incur rereads of earlier chunks.
 * @evidence contracts/performance.md#reuse-equivalent-work Each shared station edge and its analytic normal are generated once. The same immutable engine fragments supply unfinished checkpoints and final model, without repeated fitting or reconstruction for camera changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Source-free bundle and graph remain caller-owned. Output numeric retention is bounded by engine plans, one chunk and spool staging; closed-engine buffers and scalar run reports remain retained. Completed open chunks transfer to disk, and generator cancellation releases local state on exceptions.
 */
export function reconstructRecoveryLocal(
  bundle: R.Bundle,
  graph: O.Continuation,
  output: string,
  binding: {
    sourceEpoch: string;
    curveBundleSha256: string;
    continuationSha256: string;
    operator: "quadratic" | "ruled";
  },
): {
  sha256: string;
  bytes: number;
  counts: { vertices: number; triangles: number };
  checkpoints: { path: string; sha256: string; bytes: number }[];
} {
  type Node = { section: number; arc: number };
  type Edge = {
    before: Node;
    after: Node;
    reverse: boolean;
    pairOrdinal: number;
  };
  const key: (n: Node) => string = (n: Node): string => `${n.section}:${n.arc}`;
  const prepared: ReturnType<typeof prepareRecoveryOpenRuns> =
    prepareRecoveryOpenRuns(bundle, graph, binding.operator);
  const outgoing: Map<string, Edge> = prepared.outgoing,
    incoming: Map<string, Edge> = prepared.incoming;
  const pairs: number = prepared.pairs,
    unsupportedGroups: number = prepared.unsupportedGroups,
    unsupportedGroupsWithOpenArcs: number =
      prepared.unsupportedGroupsWithOpenArcs;
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
    { observeWork: true },
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
  type RunReport = {
    id: string;
    firstSection: number;
    lastSection: number;
    curves: string[];
    generated: boolean;
    reason: string | null;
    intervals: number;
    omittedIntervals: number;
    vertices: number;
    triangles: number;
    unqualifiedSourceOrientations: number;
    fitTargetMisses: number;
    fitPolylineUpperEstimateMaximumMm: number;
  };
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
  ) => { sha256: string; bytes: number } = (
    file: string,
    complete: boolean,
  ): { sha256: string; bytes: number } =>
    spool.publish(file, {
      schema: "human-reference-engine-model-v1",
      model: base.model,
      construction: { units: "m", lines: spool.construction },
      diagnostics: base.diagnostics,
      unresolved: base.unresolved,
      unresolvedScope:
        "Closed-only observations retained independently of open surfaces; they are not an additive whole-model hole count.",
      stripObservations: base.stripObservations,
      primitiveRanges: base.primitiveRanges,
      interactionObservations: base.interactionObservations,
      openPrimitiveOwnership: spool.ownership,
      openReports: {
        runs,
        pairs,
        visitedPairs: completedPairs,
        failedRunPairs,
        omittedIntervals,
        unsupportedGroups,
        unsupportedGroupsWithOpenArcs,
        zeroOpenArcObservationGroups:
          unsupportedGroups - unsupportedGroupsWithOpenArcs,
        unresolved: graph.intervals.map(
          (row: O.Continuation["intervals"][number]): object => ({
            beforeSection: row.beforeSection,
            afterSection: row.afterSection,
            groups: row.unresolved,
          }),
        ),
      },
      coverage: {
        complete: false,
        observation: bundle.coverage ?? {
          complete: true,
          sections: bundle.reports.length,
        },
        processingComplete: complete,
        openPairs: pairs,
        visitedOpenPairs: completedPairs,
        publishedOpenPairs: publishedPairs,
        generatedOpenIntervals: completedPairs - omittedIntervals,
        omittedIntervals,
        failedRunPairs,
        qualification:
          "Open branches, mixed events and unrepresented groups remain unsupported; all-source surface recovery is unverified.",
      },
      counts: counts(),
      provenance: {
        ...binding,
        sourceCommit: binding.sourceEpoch,
        inputKeys: ["curveBundle", "openContinuation"],
        inputHashes: {
          curveBundle: binding.curveBundleSha256,
          openContinuation: binding.continuationSha256,
        },
        operator:
          binding.operator === "ruled"
            ? "two-course-ruled-v1"
            : "local-linear-physical-hermite-v1",
        phaseConvention:
          "Normalized saved span widths; independent fitting and Newton correspondence do not establish material transport or true arc-length parameterization.",
        approximation: {
          toleranceMm: bundle.policy.toleranceMm,
          bound:
            "binary64 Taylor Hessian upper estimate for analytic-field-to-PL distance only; not source distance",
        },
        engineOperators: [
          "tessellateAutoMovieContourLoft64",
          "AutoMovieLocalHermiteField64.prepare",
          "tessellateAutoMovieLocalHermite64",
        ],
        callPath: [
          "recoveryLocal",
          "reconstructRecoveryLocal",
          "IAutoMovieCurve64.Cubic + source-free ordinary continuation",
          "AutoMovieLocalHermiteField64.prepare",
          "tessellateAutoMovieLocalHermite64",
          "RecoveryMeshSpool",
          "IAutoMovieModel.parts[].geometry.mesh",
          "viewer input",
        ],
        support: {
          closed: "existing contour engine",
          openOrdinary:
            binding.operator === "ruled"
              ? "two-course ruled, station C0 only; shared normals right-sided, final station left-sided"
              : "local Hermite",
          openSplitMergeCavity: "unsupported and preserved in graph",
          mixedOpenClosed: "unsupported",
        },
        publicationOrder:
          "descending total physical span of supported open-only intervals; stable saved section/arc tie break",
        checkpointPolicy: {
          firstCompletedGraphPairs: 5,
          followingChunkThreshold: "2048 then doubling",
          publishedPairs,
        },
        resourcePolicy: {
          maxCellsPerInterval: 200_000,
          maxVerticesPerChunk: 32_768,
          legacyGraphMaxVerticesPerRun: graph.maxVerticesPerRun,
          legacyGraphRunBudgetApplied: false,
          note: "This explicit streamed operator bounds interval planning and chunk retention; output fragments grow on disk rather than enforcing the former whole-grid vertex allocation limit.",
        },
        generatedAt: new Date().toISOString(),
        elapsedMs: performance.now() - started,
        memory: {
          current: memory(),
          observedPeakHeapBytes: peakHeap,
          observedPeakRssBytes: peakRss,
          processMaximumRssKiB: process.resourceUsage().maxRSS,
        },
        spoolDirectory: path.resolve(`${output}.spool`),
        observeWork: true,
      },
    });
  const normalized: (curve: C.Cubic, reverse: boolean) => C.Cubic = (
    curve: C.Cubic,
    reverse: boolean,
  ): C.Cubic => {
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
    if (!(total > 0 && Number.isFinite(total)))
      throw new Error("Open curve phase cannot be normalized");
    let prefix: number = 0;
    const phaseIntervals: number[] = widths.map(
      (width: number, i: number): number => {
        const value: number =
          i + 1 === widths.length ? 1 - prefix : width / total;
        if (!(value > 0 && Number.isFinite(value)))
          throw new Error(
            "Normalized open phase interval is not representable",
          );
        prefix += value;
        return value;
      },
    );
    const spans: C.Span[] = reverse
      ? [...curve.spans]
          .reverse()
          .map((span: C.Span): C.Span => [span[3], span[2], span[1], span[0]])
      : [...curve.spans];
    return {
      ...curve,
      closed: false,
      phaseUnit: "normalized",
      phaseIntervals,
      spans,
    };
  };
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
          normalized(
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
        outputOperation = false;
        record.vertices += chunk.counts.vertices;
        record.triangles += chunk.counts.triangles;
        record.generated ||= chunk.counts.triangles > 0;
        result = iterator.next();
        if (result.done || result.value.interval !== chunk.interval)
          publishedPairs++;
        if (
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
  const saved: ReturnType<typeof publish> = publish(output, true);
  return { ...saved, counts: counts(), checkpoints };
}
