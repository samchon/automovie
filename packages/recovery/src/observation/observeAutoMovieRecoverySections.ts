import { convertAutoMovieRecoveryCurves } from "../curves/convertAutoMovieRecoveryCurves";
import { RecoveryScalarIndex } from "../internal/RecoveryScalarIndex";
import { cutExact } from "../internal/mesh-observations/cutExact";
import { planeFrame } from "../internal/mesh-observations/planeFrame";
import { sourceOrientation } from "../internal/mesh-observations/sourceOrientation";
import { observeRecoverySection } from "../internal/observeRecoverySection";
import { observeRecoverySourceSlabs } from "../internal/observeRecoverySourceSlabs";
import { observeRecoverySourceTerminals } from "../internal/observeRecoverySourceTerminals";
import { prepareRecoveryMeshIncidence } from "../internal/prepareRecoveryMeshIncidence";
import type { IAutoMovieRecoverySections } from "../structures/mesh/IAutoMovieRecoverySections";
import type { IAutoMovieRecoverySectionsInput } from "../structures/mesh/IAutoMovieRecoverySectionsInput";
import type { IAutoMovieRecoverySlabPair } from "../structures/mesh/IAutoMovieRecoverySlabPair";
import type { IAutoMovieRecoverySourceTerminal } from "../structures/mesh/IAutoMovieRecoverySourceTerminal";
import type { IAutoMovieRecoveryTerminalSeed } from "../structures/mesh/IAutoMovieRecoveryTerminalSeed";
import type { IAutoMovieRecoverySlabObservation } from "../structures/observation/IAutoMovieRecoverySlabObservation";
import type { IAutoMovieRecoverySourceLineage } from "../structures/observation/IAutoMovieRecoverySourceLineage";
import type { IAutoMovieRecoveryObservationOptions } from "../structures/operation/IAutoMovieRecoveryObservationOptions";
import type { AutoMovieRecoveryCurveData } from "../typings/AutoMovieRecoveryCurveData";
import type { AutoMovieRecoveryCurveFormat } from "../typings/AutoMovieRecoveryCurveFormat";
import type { IAutoMovieRecoveryResult } from "../typings/IAutoMovieRecoveryResult";

/**
 * Observe all source contours at a finite collection of caller-defined physical planes. Admission, scalar face indexing, incidence, cutting and material orientation are prepared once for the collection. Original coordinates and request order survive. Optional terminalSeeds follow existing source-loop incidence toward increasing coordinates and append actual source critical coordinates and brackets; default requests add no planes. Semantic component selection and between-plane continuation are not inferred. Hermite selection uses the official algebraic converter. Delivered lineage records remain provisional until the terminal result; observer exceptions fail the collection and cancellation is checked at each plane and lineage callback.
 *
 * @evidence contracts/common.md#principled-implementation Existing binary64 exact-zero plane cuts, original face incidence, registered side orientation and tangent-constrained physical cubic fitting supply each selected observation; signs are not certified predicates and finite-polyline residuals do not bound an intervening surface.
 * @evidence contracts/common.md#clear-and-simple-design One finite-plane API reuses the observation owners without changing automatic sweep behavior or placing source arrays in the returned coefficients.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every intersected component remains present, open curves stay open, and failures retain diagnostics; no largest-loop choice, source normal, mesh fallback, invented continuation or degree reduction is used.
 * @evidence contracts/common.md#meaningful-documentation States physical plane interpretation, preserved ordering, shared preparation, coverage limitations, callback effects and cancellation checkpoints.
 * @evidence contracts/performance.md#efficient-algorithms For V vertices, T triangles and K actual planes, preparation costs O(V+T log T) time and O(V+T) storage; indexed plane queries sort A intersecting faces in O(A log A), with worst-case O(T+A log A), while the existing cut and fitter own local costs. Optional terminal observation adds source-connectivity and critical-classification work documented by its owner plus the observed event/bracket planes; omitted terminalSeeds performs none of that work.
 * @evidence contracts/performance.md#reuse-equivalent-work One incidence registry, scalar chart, face interval index, cutting closure and orientation witness serve every coordinate of this immutable source; no global or cross-source cache exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrowed source arrays remain stable during the synchronous call; preparation and private supports expire on completion, cancellation or failure. Source-free coefficients transfer to the caller, which also owns any copied lineage retention and callback cost.
 */
export function observeAutoMovieRecoverySections<
  Format extends AutoMovieRecoveryCurveFormat,
>(
  input: IAutoMovieRecoverySectionsInput,
  options: Pick<
    IAutoMovieRecoveryObservationOptions<Format>,
    "curveFormat" | "signal" | "onProgress" | "onSourceLineage" | "onSourceSlab"
  >,
): IAutoMovieRecoveryResult<
  AutoMovieRecoveryCurveData<IAutoMovieRecoverySections, Format>
> {
  const operator: IAutoMovieRecoveryResult<never>["operator"] =
    "physical-sections-v1";
  if (options?.signal?.aborted)
    return {
      operator,
      status: "cancelled",
      diagnostics: ["Cancelled before section observation"],
    };
  const vector: (value: unknown) => boolean = (value: unknown): boolean =>
    Array.isArray(value) &&
    value.length === 3 &&
    [0, 1, 2].every((i: number): boolean => Number.isFinite(value[i]));
  if (
    !options ||
    (options.curveFormat !== "bezier" && options.curveFormat !== "hermite") ||
    (options.onSourceLineage !== undefined &&
      typeof options.onSourceLineage !== "function") ||
    (options.onSourceSlab !== undefined &&
      typeof options.onSourceSlab !== "function") ||
    (options.onProgress !== undefined &&
      typeof options.onProgress !== "function") ||
    !input ||
    typeof input.name !== "string" ||
    !input.name.trim() ||
    !Array.isArray(input.coordinatesMm) ||
    !input.coordinatesMm.length ||
    !Array.from(input.coordinatesMm).every(Number.isFinite) ||
    new Set(input.coordinatesMm).size !== input.coordinatesMm.length ||
    !Array.isArray(input.verticesMm) ||
    !input.verticesMm.length ||
    !Array.from(input.verticesMm).every(vector) ||
    !Array.isArray(input.triangles) ||
    !input.triangles.length ||
    !Array.from(input.triangles).every(
      (t: number[]): boolean =>
        Array.isArray(t) &&
        t.length === 3 &&
        [0, 1, 2].every(
          (i: number): boolean =>
            Number.isSafeInteger(t[i]) &&
            t[i]! >= 0 &&
            t[i]! < input.verticesMm.length,
        ),
    ) ||
    !vector(input.axis) ||
    !vector(input.reference) ||
    !(input.toleranceMm > 0 && Number.isFinite(input.toleranceMm)) ||
    !Number.isSafeInteger(input.maxSpans) ||
    input.maxSpans < 1 ||
    typeof input.exactCoordinateAliases !== "boolean" ||
    (input.includeExactSourceLineage !== undefined &&
      typeof input.includeExactSourceLineage !== "boolean") ||
    (input.sourceOrientationSign !== 1 && input.sourceOrientationSign !== -1) ||
    !(input.cornerDegrees > 0 && input.cornerDegrees < 180) ||
    (input.terminalSeeds !== undefined &&
      (!Array.isArray(input.terminalSeeds) ||
        !Array.from(input.terminalSeeds).every(
          (seed: IAutoMovieRecoveryTerminalSeed): boolean =>
            !!seed &&
            Number.isFinite(seed.coordinateMm) &&
            input.coordinatesMm.includes(seed.coordinateMm) &&
            Number.isSafeInteger(seed.loopIndex) &&
            seed.loopIndex >= 0,
        ))) ||
    (input.slabPairs !== undefined &&
      (!Array.isArray(input.slabPairs) ||
        !Array.from(input.slabPairs).every(
          (pair: IAutoMovieRecoverySlabPair): boolean =>
            !!pair &&
            Number.isFinite(pair.beforeMm) &&
            Number.isFinite(pair.afterMm) &&
            pair.beforeMm < pair.afterMm &&
            Number.isFinite(pair.afterMm - pair.beforeMm) &&
            input.coordinatesMm.includes(pair.beforeMm) &&
            input.coordinatesMm.includes(pair.afterMm),
        )))
  )
    return {
      operator,
      status: "refused",
      diagnostics: [
        "Named distinct finite plane coordinates, registered triangles, physical frame, supported basis and valid fit policy are required",
      ],
    };
  try {
    const frame: ReturnType<typeof planeFrame> = planeFrame(
      [0, 0, 0],
      input.axis,
      input.reference,
    );
    if (
      ![frame.n, frame.u, frame.v].every(
        (axis: [number, number, number]): boolean =>
          vector(axis) && Math.hypot(...axis) > 0,
      )
    )
      throw new Error("Section frame has no finite nonzero axis");
    options.onProgress?.("fixed-sections", 0, input.coordinatesMm.length);
    if (options.signal?.aborted)
      throw new Error("Section observation cancelled");
    const prepared: ReturnType<typeof prepareRecoveryMeshIncidence> =
      prepareRecoveryMeshIncidence(input, input.verticesMm);
    const heights: number[] = input.verticesMm.map(
      (p: [number, number, number]): number =>
        p[0] * frame.n[0] + p[1] * frame.n[1] + p[2] * frame.n[2],
    );
    const index: ReturnType<typeof RecoveryScalarIndex.create> =
      RecoveryScalarIndex.create(input.triangles, heights);
    const slice: ReturnType<typeof cutExact.prepare> = cutExact.prepare(
      prepared.mesh,
      heights,
      input.includeExactSourceLineage === true ||
        (input.slabPairs?.length ?? 0) > 0,
    );
    const orientation: ReturnType<typeof sourceOrientation> = sourceOrientation(
      prepared.mesh,
      input.sourceOrientationSign,
    );
    const sections: IAutoMovieRecoverySections["sections"] = [];
    const reports: IAutoMovieRecoverySections["reports"] = [];
    const seedObservations: Parameters<
      typeof observeRecoverySourceTerminals
    >[0]["seeds"][number][] = [];
    const publications: IAutoMovieRecoverySourceLineage[] = [];
    let observations: number = 0,
      spans: number = 0;
    const coordinates: number[] = [...input.coordinatesMm];
    let terminals: IAutoMovieRecoverySourceTerminal[] | undefined;
    for (
      let planeIndex: number = 0;
      planeIndex < coordinates.length;
      planeIndex++
    ) {
      const coordinateMm: number = coordinates[planeIndex]!;
      if (options.signal?.aborted)
        throw new Error("Section observation cancelled");
      const plane: ReturnType<typeof planeFrame> = {
        ...frame,
        origin: frame.n.map((x: number): number => x * coordinateMm) as [
          number,
          number,
          number,
        ],
      };
      if (!vector(plane.origin))
        throw new Error("Section origin exceeds finite millimetre coordinates");
      const observed: ReturnType<typeof observeRecoverySection> =
        observeRecoverySection({
          coordinateMm,
          plane,
          contours: slice(plane, coordinateMm, index.cut(coordinateMm)),
          faceEdges: prepared.faceEdges,
          vertexFaces: prepared.vertexFaces,
          orientation,
          policy: input,
          name: input.name,
          onSourceLineage:
            options.onSourceLineage === undefined &&
            input.slabPairs === undefined
              ? undefined
              : (record: IAutoMovieRecoverySourceLineage): void => {
                  if (options.signal?.aborted)
                    throw new Error("Section observation cancelled");
                  if (input.slabPairs !== undefined)
                    publications.push({
                      ...record,
                      sourceTriangleIds: [...record.sourceTriangleIds],
                      ...(record.exactSourceTriangleIds === undefined
                        ? {}
                        : {
                            exactSourceTriangleIds: [
                              ...record.exactSourceTriangleIds,
                            ],
                          }),
                      publication: { ...record.publication },
                    });
                  options.onSourceLineage?.(record);
                  if (options.signal?.aborted)
                    throw new Error("Section observation cancelled");
                },
        });
      sections.push(observed.section);
      reports.push(observed.report);
      observations += observed.observations;
      spans += observed.spans;
      for (const seed of input.terminalSeeds ?? [])
        if (seed.coordinateMm === coordinateMm) {
          const loop: (typeof observed.section.loops)[number] | undefined =
            observed.section.loops[seed.loopIndex];
          if (!loop)
            throw new Error(
              "Terminal seed refers to no published closed source loop",
            );
          seedObservations.push({
            coordinateMm,
            loopIndex: seed.loopIndex,
            curveName: loop.curve.name,
            faces: observed.faces[seed.loopIndex]!,
          });
        }
      options.onProgress?.(
        "fixed-sections",
        sections.length,
        coordinates.length,
      );
      if (
        input.terminalSeeds !== undefined &&
        planeIndex === input.coordinatesMm.length - 1
      ) {
        terminals = observeRecoverySourceTerminals({
          prepared,
          heights,
          axis: frame.n,
          seeds: seedObservations,
          checkpoint: (): void => {
            if (options.signal?.aborted)
              throw new Error("Terminal observation cancelled");
          },
        });
        const present: Set<number> = new Set(coordinates);
        const extra: number[] = [];
        for (const terminal of terminals)
          for (const coordinate of terminal.coordinatesMm)
            if (!present.has(coordinate)) {
              present.add(coordinate);
              extra.push(coordinate);
            }
        extra.sort((a: number, b: number): number => a - b);
        coordinates.push(...extra);
      }
    }
    let slabPartial: boolean = false;
    if (input.slabPairs !== undefined) {
      observeRecoverySourceSlabs({
        prepared,
        heights,
        axis: frame.n,
        exactCoordinateAliases: input.exactCoordinateAliases,
        index,
        pairs: input.slabPairs,
        sectionCoordinatesMm: coordinates,
        publications,
        checkpoint: (): void => {
          if (options.signal?.aborted)
            throw new Error("Source slab observation cancelled");
        },
        observe: (slab: IAutoMovieRecoverySlabObservation): void => {
          if (options.signal?.aborted)
            throw new Error("Source slab observation cancelled");
          slabPartial ||=
            slab.issues.length > 0 ||
            slab.events.some(
              (event: (typeof slab.events)[number]): boolean =>
                !event.qualified,
            ) ||
            slab.ports.some(
              (port: (typeof slab.ports)[number]): boolean =>
                port.status === "missing" || port.status === "ambiguous",
            ) ||
            slab.components.some(
              (component: (typeof slab.components)[number]): boolean =>
                !component.topology.manifold ||
                component.topology.orientable !== true,
            );
          options.onSourceSlab?.(slab);
          if (options.signal?.aborted)
            throw new Error("Source slab observation cancelled");
        },
      });
    }
    if (options.signal?.aborted)
      throw new Error("Section observation cancelled");
    const partial: boolean =
      slabPartial ||
      reports.some(
        (report: IAutoMovieRecoverySections["reports"][number]): boolean =>
          report.open.length > 0 ||
          report.isolatedContactsMm.length > 0 ||
          report.diagnostics.length > 0,
      ) ||
      (terminals?.some(
        (terminal: IAutoMovieRecoverySourceTerminal): boolean =>
          !terminal.singleTipQualified,
      ) ??
        false);
    const value: IAutoMovieRecoverySections = {
      name: input.name,
      axis: [...input.axis],
      reference: [...input.reference],
      frame: {
        originMm: [...frame.origin],
        n: [...frame.n],
        u: [...frame.u],
        v: [...frame.v],
      },
      sections,
      reports,
      policy: {
        toleranceMm: input.toleranceMm,
        maxSpans: input.maxSpans,
        exactCoordinateAliases: input.exactCoordinateAliases,
        sourceOrientationSign: input.sourceOrientationSign,
        cornerDegrees: input.cornerDegrees,
      },
      summary: { sections: sections.length, observations, spans },
      ...(terminals === undefined ? {} : { terminals }),
    };
    return {
      operator,
      status: partial ? "partial" : "complete",
      value: convertAutoMovieRecoveryCurves(value, options.curveFormat),
      diagnostics: [
        "Selected plane observations only; no intervening topology, source surface fidelity or anatomical correspondence is established",
        ...reports.flatMap(
          (report: IAutoMovieRecoverySections["reports"][number]): string[] =>
            report.diagnostics,
        ),
        ...(terminals?.flatMap(
          (terminal: IAutoMovieRecoverySourceTerminal): string[] =>
            terminal.diagnostics,
        ) ?? []),
      ],
    };
  } catch (error: unknown) {
    return {
      operator,
      status: options.signal?.aborted ? "cancelled" : "failed",
      diagnostics: [error instanceof Error ? error.message : String(error)],
    };
  }
}
