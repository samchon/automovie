import type {
  AutoMovieVector3Tuple,
  IAutoMovieContourLoft64,
  IAutoMovieMeshCriticalPoints,
  IAutoMovieMeshPlaneCut,
  IAutoMovieMeshSectionOrientation,
  IAutoMoviePlaneFrameConstruction,
  IAutoMovieRecoveryCriticalBracketsPreparationOperation,
  IAutoMovieRecoveryInput,
  IAutoMovieRecoveryMeshIncidencePreparationOperation,
  IAutoMovieRecoveryMeshSections,
  IAutoMovieRecoveryScalarIndex,
  IAutoMovieRecoverySlabConnectivityGroup,
  IAutoMovieRecoverySlabGraph,
  IAutoMovieRecoverySourceLineage,
} from "@automovie/interface";

import { RecoveryScalarIndex as S } from "../../internal/RecoveryScalarIndex";
import { RecoverySlabGraph as G } from "../../internal/RecoverySlabGraph";
import { createRecoveryObservationPolicy } from "../../internal/createRecoveryObservationPolicy";
import { critical } from "./critical";
import { cutExact } from "../../internal/mesh-observations/cutExact";
import { planeFrame } from "./planeFrame";
import { sourceOrientation } from "./sourceOrientation";
import { observeRecoverySection } from "./observeRecoverySection";
import { prepareRecoveryCriticalBrackets } from "./prepareRecoveryCriticalBrackets";
import { prepareRecoveryMeshIncidence } from "./prepareRecoveryMeshIncidence";

/**
 * Extract every section component with automatic stations, feature corners and
 * PL critical brackets. Physical ties remain explicit; cutting and PL topology
 * share one immutable scalar chart. The optional progress observer reports
 * completed plane and slab populations without changing geometry. An explicit
 * sectionLimit publishes an incomplete sorted-station prefix; coverage records
 * the full omission. The optional lineage observer receives copied incident
 * face IDs per contour, including local failures and degenerate contacts;
 * callback exceptions escape the local fitting catch and fail extraction.
 */
export function extractRecoveryMeshSections(
  input: IAutoMovieRecoveryInput,
  progress?: (phase: string, completed: number, total: number) => void,
  sectionLimit?: number,
  onSourceLineage?: (observation: IAutoMovieRecoverySourceLineage) => void,
): IAutoMovieRecoveryMeshSections {
  if (sectionLimit !== undefined && sectionLimit < 2)
    throw new Error("A checkpoint needs at least two automatic stations");
  if (
    !(input.stepMm > 0) ||
    !(input.cornerDegrees > 0 && input.cornerDegrees < 180) ||
    input.maxSections < 2 ||
    (input.sourceOrientationSign !== 1 && input.sourceOrientationSign !== -1)
  )
    throw new Error("Invalid automatic section policy");
  const frame: ReturnType<IAutoMoviePlaneFrameConstruction.Operation> =
    planeFrame([0, 0, 0], input.axis, input.reference);
  const vertices: typeof input.verticesMm = input.verticesMm;
  if (
    !vertices.length ||
    vertices.some(
      (p: Readonly<AutoMovieVector3Tuple>): boolean => p.length !== 3,
    )
  )
    throw new Error("Finite physical mesh positions required");
  if (
    !input.triangles.length ||
    input.triangles.some(
      (t: number[]): boolean =>
        t.length !== 3 ||
        t.some((i: number): boolean => i < 0 || i >= vertices.length),
    )
  )
    throw new Error("Valid source triangle addresses required");
  const {
    aliases,
    canon,
    mesh,
    faceEdges,
    vertexFaces,
  }: ReturnType<IAutoMovieRecoveryMeshIncidencePreparationOperation.Operation> =
    prepareRecoveryMeshIncidence(input, vertices);
  const project: (p: Readonly<AutoMovieVector3Tuple>) => number = (
    p: Readonly<AutoMovieVector3Tuple>,
  ): number => p[0] * frame.n[0] + p[1] * frame.n[1] + p[2] * frame.n[2];
  const scalarHeights: number[] = vertices.map(project);
  const scalarIndex: ReturnType<IAutoMovieRecoveryScalarIndex.Create> =
    S.create(mesh.triangles, scalarHeights);
  const slice: ReturnType<IAutoMovieMeshPlaneCut.Prepare> = cutExact.prepare(
    mesh,
    scalarHeights,
  );
  const observe: ReturnType<IAutoMovieRecoverySlabGraph.Prepare> = G.prepare({
    triangles: mesh.triangles,
    canon,
    heights: scalarHeights,
  });
  const heights: number[] = [...new Set(scalarHeights)].sort(
    (a: number, b: number): number => a - b,
  );
  const low: number = heights[0]!,
    high: number = heights[heights.length - 1]!;
  if (!(high > low))
    throw new Error("Mesh sweep has no representable physical extent");
  if (Math.ceil((high - low) / input.stepMm) > input.maxSections)
    throw new Error("Nominal station budget exhausted");
  const levels: Set<number> = new Set();
  const offset: number = Math.min(input.stepMm / 4, (high - low) / 1000);
  levels.add(low - offset);
  levels.add(high + offset);
  for (let k: number = 0; low + (k + 0.5) * input.stepMm < high; k++) {
    levels.add(low + (k + 0.5) * input.stepMm);
    if (levels.size > input.maxSections)
      throw new Error("Automatic station budget exhausted");
  }
  const diagnostics: string[] = [
    "Cut convention: unmodified binary64 signed distances; exact-zero vertices and coplanar patch boundaries are retained. Signs and intersections are not certified predicates.",
    "Exact positional aliases can join touching components; they establish incidence only and displace no positions.",
    "Face orientation follows the registered material-side sign; mixed shells are not silently repaired.",
    "Within-section estimates do not bound between-section surfaces or certify source embedding.",
  ];
  const topologyGaps: IAutoMovieRecoveryMeshSections["topologyGaps"] = [];
  const criticals: ReturnType<IAutoMovieMeshCriticalPoints.Operation> =
    critical(mesh, frame.n, scalarHeights, input.criticalPolicy);
  const {
    unsupportedVertices,
    bracketed,
  }: ReturnType<IAutoMovieRecoveryCriticalBracketsPreparationOperation.Operation> =
    prepareRecoveryCriticalBrackets(
      criticals,
      heights,
      input.stepMm,
      levels,
      diagnostics,
      topologyGaps,
    );
  if (levels.size > input.maxSections)
    throw new Error("Critical section budget exhausted");
  const orientation: ReturnType<IAutoMovieMeshSectionOrientation.Operation> =
    sourceOrientation(mesh, input.sourceOrientationSign);
  const cache: Map<
    number,
    {
      section: IAutoMovieContourLoft64.ISection;
      report: IAutoMovieRecoveryMeshSections["reports"][number];
      supports: Set<number>[];
      faces: Set<number>[];
      defects: Set<number>[];
    }
  > = new Map();
  let observations: number = 0,
    spans: number = 0;
  const plannedLevels: number[] = [...levels].sort(
    (a: number, b: number): number => a - b,
  );
  const retainedLevels: number[] =
    sectionLimit === undefined
      ? plannedLevels
      : plannedLevels.slice(0, sectionLimit);
  // Automatic extraction calls this observer without binding a receiver.
  const publishSourceLineage:
    | ((observation: IAutoMovieRecoverySourceLineage) => void)
    | undefined = onSourceLineage
    ? (observation: IAutoMovieRecoverySourceLineage): void =>
        onSourceLineage(observation)
    : undefined;
  progress?.("sections", 0, retainedLevels.length);
  for (const coordinateMm of retainedLevels) {
    const plane: ReturnType<IAutoMoviePlaneFrameConstruction.Operation> = {
      ...frame,
      origin: [
        frame.n[0] * coordinateMm,
        frame.n[1] * coordinateMm,
        frame.n[2] * coordinateMm,
      ],
    };
    const contours: ReturnType<typeof slice> = slice(
      plane,
      coordinateMm,
      scalarIndex.cut(coordinateMm),
    );
    const observed = observeRecoverySection({
      coordinateMm,
      plane,
      contours,
      faceEdges,
      vertexFaces,
      orientation,
      policy: input,
      onSourceLineage: publishSourceLineage,
    });
    observations += observed.observations;
    spans += observed.spans;
    cache.set(coordinateMm, observed);
    if (cache.size % 64 === 0 || cache.size === retainedLevels.length)
      progress?.("sections", cache.size, retainedLevels.length);
  }
  const events: IAutoMovieContourLoft64.IEvent[] = bracketed.map(
    (
      { event, before, after }: (typeof bracketed)[number],
      i: number,
    ): IAutoMovieContourLoft64.IEvent => ({
      name: `critical.${i}`,
      coordinateMm: event.level,
      beforeMm: before,
      afterMm: after,
      before:
        cache
          .get(before)
          ?.supports.flatMap((s: Set<number>, k: number): number[] =>
            s.has(event.vertex) ? [k] : [],
          ) ?? [],
      after:
        cache
          .get(after)
          ?.supports.flatMap((s: Set<number>, k: number): number[] =>
            s.has(event.vertex) ? [k] : [],
          ) ?? [],
      kind:
        event.lower === 0
          ? "minimum"
          : event.upper === 0
            ? "maximum"
            : "saddle",
      regular:
        event.manifold &&
        !event.flat &&
        ((event.lower === 0 && event.upper === 1) ||
          (event.lower === 1 && event.upper === 0) ||
          (event.lower === 2 && event.upper === 2)),
      terminal: event.lower === 0 || event.upper === 0 ? event.p : null,
    }),
  );
  const declaredEvents: IAutoMovieContourLoft64.IEvent[] = [];
  const unconsumedEvents: IAutoMovieRecoveryMeshSections["unconsumedEvents"] =
    [];
  for (const event of events) {
    if (!cache.has(event.beforeMm) || !cache.has(event.afterMm))
      unconsumedEvents.push({
        event,
        reason:
          "Incomplete station-prefix checkpoint has not observed both event cuts",
      });
    else if (event.before.length + event.after.length > 0)
      declaredEvents.push(event);
    else
      unconsumedEvents.push({
        event,
        reason:
          "Source critical event has no displayable incident closed curve; its preimage remains unsupported",
      });
  }
  const entries: (typeof cache extends Map<number, infer T> ? T : never)[] = [
    ...cache.values(),
  ];
  const intervals: NonNullable<IAutoMovieContourLoft64["intervals"]>[number][] =
    [];
  progress?.("slabs", 0, entries.length - 1);
  for (let i: number = 1; i < entries.length; i++) {
    const before: (typeof entries)[number] = entries[i - 1]!,
      after: (typeof entries)[number] = entries[i]!;
    const defects: Set<number>[] = [...before.defects, ...after.defects];
    for (const event of criticals)
      if (
        unsupportedVertices.has(event.vertex) &&
        event.level >= before.section.coordinateMm &&
        event.level <= after.section.coordinateMm
      )
        defects.push(vertexFaces.get(event.vertex) ?? new Set());
    const groups: IAutoMovieRecoverySlabConnectivityGroup[] = observe({
      beforeMm: before.section.coordinateMm,
      afterMm: after.section.coordinateMm,
      before: before.faces,
      after: after.faces,
      defects,
      candidates: scalarIndex.slab(
        before.section.coordinateMm,
        after.section.coordinateMm,
      ),
    });
    intervals.push({
      beforeMm: before.section.coordinateMm,
      afterMm: after.section.coordinateMm,
      groups,
    });
    if (i % 64 === 0 || i === entries.length - 1)
      progress?.("slabs", i, entries.length - 1);
  }
  const policy: IAutoMovieRecoveryMeshSections["policy"] =
    createRecoveryObservationPolicy(input);
  const coverage: IAutoMovieRecoveryMeshSections["coverage"] =
    sectionLimit === undefined
      ? undefined
      : {
          complete: false,
          plannedSections: plannedLevels.length,
          retainedSections: retainedLevels.length,
          sourceRangeMm: [low, high],
          observedStationRangeMm: [
            retainedLevels[0]!,
            retainedLevels[retainedLevels.length - 1]!,
          ],
          unobservedStationRangeMm:
            retainedLevels.length < plannedLevels.length
              ? [
                  plannedLevels[retainedLevels.length]!,
                  plannedLevels[plannedLevels.length - 1]!,
                ]
              : null,
          missingSourceRangeMm:
            retainedLevels[retainedLevels.length - 1]! < high
              ? [
                  Math.max(low, retainedLevels[retainedLevels.length - 1]!),
                  high,
                ]
              : null,
        };
  if (coverage)
    diagnostics.push(
      "Incomplete computational station-prefix checkpoint: all unobserved source ranges remain missing; no terminal closure is authorized",
    );
  return {
    loft: {
      sections: entries.map(
        (s: (typeof entries)[number]): IAutoMovieContourLoft64.ISection =>
          s.section,
      ),
      events: declaredEvents,
      intervals,
      chordToleranceMm: input.chordToleranceMm,
    },
    reports: entries.map(
      (
        s: (typeof entries)[number],
      ): IAutoMovieRecoveryMeshSections["reports"][number] => s.report,
    ),
    diagnostics,
    topologyGaps,
    unconsumedEvents,
    policy,
    summary: {
      observations,
      spans,
      sections: cache.size,
      events: events.length,
      aliases: input.exactCoordinateAliases
        ? vertices.length - aliases.size
        : 0,
    },
    ...(coverage ? { coverage } : {}),
  };
}
