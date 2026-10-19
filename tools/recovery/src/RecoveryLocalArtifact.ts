import path from "node:path";

import type { RecoveryMeshSpool } from "./RecoveryMeshSpool.ts";
import type { RecoveryOpenContinuation as O } from "./RecoveryOpenContinuation.ts";
import type { RecoveryTensorFamilies } from "./RecoveryTensorFamilies.ts";
import type { reconstructRecovery } from "./reconstructRecovery.ts";

/**
 * Build the current recovery artifact metadata around already generated geometry.
 * Tensor, contour and open completion remain separate; construction and ownership
 * come from the same engine outputs. This operation changes no geometry or report.
 *
 * @evidence contracts/common.md#principled-implementation Saved input hashes, actual engine reports and current publication counters expose the same generated artifact and partial status without inferring source fidelity.
 * @evidence contracts/common.md#clear-and-simple-design Artifact shape and provenance have one owner; source observation, generation and disk-spool writing remain separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No copied source geometry, quality promotion, geometry filtering or missing-region substitution enters metadata assembly.
 * @evidence contracts/common.md#meaningful-documentation States current-report ownership and the separate tensor, open, source and geometry qualifications.
 * @evidence contracts/performance.md#efficient-algorithms Assembly visits interval diagnostics and tensor reports in linear passes; exact planned and observed family-ID sets use O(F) transient storage. Bulk geometry and report arrays are referenced rather than copied. The publication writer owns serialization costs.
 * @evidence contracts/performance.md#reuse-equivalent-work The existing model, spool construction and ownership arrays feed checkpoints and final publication without regeneration.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One returned plain record belongs to the publication invocation. This helper owns no handles, cache or retained geometry beyond its caller's arrays.
 */
export function RecoveryLocalArtifact(input: {
  base: ReturnType<typeof reconstructRecovery>;
  spool: ReturnType<typeof RecoveryMeshSpool>;
  bundle: RecoveryTensorFamilies.Input;
  graph: O.Continuation;
  binding: {
    sourceEpoch: string;
    curveBundleSha256: string;
    continuationSha256: string;
    operator: "quadratic" | "ruled";
    publishCheckpoints?: boolean;
    analyticPublicationSha256?: string;
  };
  runs: readonly object[];
  pairs: number;
  completedPairs: number;
  failedRunPairs: number;
  omittedIntervals: number;
  unsupportedGroups: number;
  unsupportedGroupsWithOpenArcs: number;
  publishedPairs: number;
  complete: boolean;
  started: number;
  output: string;
  counts: () => { vertices: number; triangles: number };
  memory: () => NodeJS.MemoryUsage;
  peaks: () => { heap: number; rss: number };
}): {
  [key: string]: unknown;
  coverage: {
    [key: string]: unknown;
    attemptComplete: boolean;
    processingComplete: boolean;
    retainedDomainComplete: boolean;
    generatedTriangles: number;
  };
} {
  const {
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
    peaks,
  }: typeof input = input;
  const generated: ReturnType<typeof counts> = counts();
  const plannedTensorFamilies: number = bundle.tensorFamilies?.length ?? 0;
  const plannedTensorIds: Set<string> = new Set(
    (bundle.tensorFamilies ?? []).map(
      (family: NonNullable<typeof bundle.tensorFamilies>[number]): string =>
        family.id,
    ),
  );
  const observedTensorIds: Set<string> = new Set(
    base.tensorReports.map(
      (report: (typeof base.tensorReports)[number]): string => report.id,
    ),
  );
  const plannedAnalyticIds: Set<string> = new Set(
    (bundle.analyticDomains ?? []).map(
      (domain: NonNullable<typeof bundle.analyticDomains>[number]): string =>
        domain.id,
    ),
  );
  const analyticComplete: boolean =
    plannedAnalyticIds.size === (bundle.analyticDomains?.length ?? 0) &&
    base.analyticReports.length === plannedAnalyticIds.size &&
    base.analyticReports.every(
      (report: (typeof base.analyticReports)[number]): boolean =>
        plannedAnalyticIds.has(report.id) &&
        report.admitted &&
        report.complete &&
        report.observationComplete &&
        report.unrepresentedDomains.length === 0,
    );
  const retainedDomainComplete: boolean =
    analyticComplete &&
    complete &&
    generated.triangles > 0 &&
    completedPairs === pairs &&
    failedRunPairs === 0 &&
    omittedIntervals === 0 &&
    unsupportedGroups === 0 &&
    base.unresolved.length === 0 &&
    base.tensorReports.length === plannedTensorFamilies &&
    plannedTensorIds.size === plannedTensorFamilies &&
    observedTensorIds.size === plannedTensorFamilies &&
    base.tensorReports.every(
      (report: (typeof base.tensorReports)[number]): boolean =>
        plannedTensorIds.has(report.id) && report.complete,
    );
  return {
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
    tensorReports: base.tensorReports,
    analyticReports: base.analyticReports,
    analyticOwnership: (bundle.analyticDomains ?? []).map(
      (domain: NonNullable<typeof bundle.analyticDomains>[number]): object => ({
        id: domain.id,
        admitted: base.analyticReports.some(
          (report: (typeof base.analyticReports)[number]): boolean =>
            report.id === domain.id && report.admitted,
        ),
        closedGroups: domain.closedGroups,
        openPairs: domain.openPairs,
        openUnresolved: domain.openUnresolved,
        polygonalBoundaryConformityQualified: false,
      }),
    ),
    coefficientPublication: bundle.coefficientPublication ?? null,
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
      attemptComplete: complete,
      processingComplete: retainedDomainComplete,
      retainedDomainComplete,
      generatedTriangles: generated.triangles,
      plannedAnalyticDomains: plannedAnalyticIds.size,
      observedAnalyticDomains: base.analyticReports.length,
      analyticDomainsComplete: analyticComplete,
      plannedTensorFamilies,
      observedTensorFamilies: base.tensorReports.length,
      unresolvedClosedGroups: base.unresolved.length,
      sourceFitQualified: false,
      tensorFamilies: base.tensorReports.length,
      completeTensorFamilies: base.tensorReports.filter(
        (report: (typeof base.tensorReports)[number]): boolean =>
          report.complete,
      ).length,
      approximationQualifiedTensorFamilies: base.tensorReports.filter(
        (report: (typeof base.tensorReports)[number]): boolean =>
          report.approximationQualified,
      ).length,
      openPairs: pairs,
      visitedOpenPairs: completedPairs,
      publishedOpenPairs: publishedPairs,
      generatedOpenIntervals: completedPairs - omittedIntervals,
      omittedIntervals,
      failedRunPairs,
      qualification:
        "Explicit analytic domains own their declared saved occurrences. Other branches, mixed events and unrepresented groups remain unsupported; analytic end-curve sharing does not qualify polygonal conformity or transverse continuity; all-source surface recovery is unverified.",
    },
    counts: generated,
    provenance: {
      ...binding,
      sourceCommit: binding.sourceEpoch,
      inputKeys: [
        "curveBundle",
        "openContinuation",
        ...(binding.analyticPublicationSha256 ? ["analyticPublication"] : []),
      ],
      inputHashes: {
        curveBundle: binding.curveBundleSha256,
        openContinuation: binding.continuationSha256,
        ...(binding.analyticPublicationSha256
          ? { analyticPublication: binding.analyticPublicationSha256 }
          : {}),
      },
      operator:
        binding.operator === "ruled"
          ? "two-course-ruled-v1"
          : "local-linear-physical-hermite-v1",
      phaseConvention:
        "Retained open curves use normalized saved span widths; independent fitting and Newton correspondence do not establish material transport or true arc length. Optional ordinary tensors consume their published common phase directly and never re-enter contour DP.",
      approximation: {
        toleranceMm: bundle.policy.toleranceMm,
        bound:
          "binary64 Taylor Hessian upper estimate for analytic-field-to-PL distance only; not source distance",
      },
      engineOperators: [
        "tessellateAutoMovieContourLoft64",
        ...(base.tensorReports.length || base.analyticReports.length
          ? ["realizeAutoMovieBicubicAtlas64"]
          : []),
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
        closed:
          "explicit analytic domains where admitted, retained contour engine otherwise",
        openOrdinary:
          binding.operator === "ruled"
            ? "two-course ruled, station C0 only; shared normals right-sided, final station left-sided"
            : "local Hermite",
        openSplitMergeCavity:
          "explicit analytic ownership where admitted; otherwise unsupported and preserved in graph",
        mixedOpenClosed:
          "explicit analytic ownership where admitted; otherwise unsupported",
      },
      publicationOrder:
        "descending total physical span of supported open-only intervals; stable saved section/arc tie break",
      checkpointPolicy: {
        enabled: binding.publishCheckpoints !== false,
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
        observedPeakHeapBytes: peaks().heap,
        observedPeakRssBytes: peaks().rss,
        processMaximumRssKiB: process.resourceUsage().maxRSS,
      },
      spoolDirectory: path.resolve(`${output}.spool`),
      observeWork: true,
    },
  };
}
