import type {
  AutoMovieRecoveryCurveData,
  AutoMovieRecoveryCurveFormat,
  IAutoMovieMeshPlaneCut,
  IAutoMovieMeshSectionOrientation,
  IAutoMoviePlaneFrameConstruction,
  IAutoMovieRecoveryMeshIncidencePreparationOperation,
  IAutoMovieRecoveryObservationOptions,
  IAutoMovieRecoveryResult,
  IAutoMovieRecoveryScalarIndex,
  IAutoMovieRecoverySectionObservationOperation,
  IAutoMovieRecoverySections,
  IAutoMovieRecoverySectionsInput,
  IAutoMovieRecoverySlabObservation,
  IAutoMovieRecoverySlabPair,
  IAutoMovieRecoverySourceLineage,
  IAutoMovieRecoverySourceTerminal,
  IAutoMovieRecoverySourceTerminalsObservationOperation,
  IAutoMovieRecoveryTerminalSeed,
} from "@automovie/interface";

import { convertAutoMovieRecoveryCurves } from "../../curves/internal/convertAutoMovieRecoveryCurves";
import { RecoveryScalarIndex } from "../../geometry/RecoveryScalarIndex";
import { prepareCutExact } from "../../internal/mesh-observations/prepareCutExact";
import { planeFrame } from "../../geometry/internal/planeFrame";
import { sourceOrientation } from "../../geometry/internal/sourceOrientation";
import { observeRecoverySection } from "../../geometry/internal/observeRecoverySection";
import { observeRecoverySourceSlabs } from "../../geometry/internal/observeRecoverySourceSlabs";
import { observeRecoverySourceTerminals } from "../../geometry/internal/observeRecoverySourceTerminals";
import { prepareRecoveryMeshIncidence } from "../../geometry/internal/prepareRecoveryMeshIncidence";

/*
 * Observe all source contours at a finite collection of caller-defined physical
 * planes. Admission, scalar face indexing, incidence, cutting and material
 * orientation are prepared once for the collection. Original coordinates and
 * request order survive. Optional terminalSeeds follow existing source-loop
 * incidence toward increasing coordinates and append actual source critical
 * coordinates and brackets; default requests add no planes. Semantic component
 * selection and between-plane continuation are not inferred. Hermite selection
 * uses the official algebraic converter. Delivered lineage records remain
 * provisional until the terminal result; observer exceptions fail the
 * collection and cancellation is checked at each plane and lineage callback.
 */
export function observeAutoMovieRecoverySections<
  Format extends AutoMovieRecoveryCurveFormat,
>(
  input: IAutoMovieRecoverySectionsInput,
  options: Pick<
    IAutoMovieRecoveryObservationOptions<Format>,
    | "curveFormat"
    | "cancelled"
    | "onProgress"
    | "onSourceLineage"
    | "onSourceSlab"
  >,
): IAutoMovieRecoveryResult<
  AutoMovieRecoveryCurveData<IAutoMovieRecoverySections, Format>
> {
  const operator: IAutoMovieRecoveryResult<never>["operator"] =
    "physical-sections-v1";
  let cancellationRequested: boolean = false;
  let probe: (() => boolean) | undefined;
  const cancelled: () => boolean = (): boolean => {
    const requested: boolean | undefined = probe?.();
    cancellationRequested = requested === true;
    return cancellationRequested;
  };
  try {
    probe = options.cancelled;

    if (cancelled())
      return {
        operator,
        status: "cancelled",
        diagnostics: ["Cancelled before section observation"],
      };
    if (
      input.coordinatesMm.length === 0 ||
      new Set(input.coordinatesMm).size !== input.coordinatesMm.length ||
      input.verticesMm.length === 0 ||
      input.triangles.length === 0 ||
      !Array.from(input.triangles).every((t: number[]): boolean =>
        [0, 1, 2].every(
          (i: number): boolean => t[i]! >= 0 && t[i]! < input.verticesMm.length,
        ),
      ) ||
      !(input.toleranceMm > 0) ||
      input.maxSpans < 1 ||
      !(input.cornerDegrees > 0 && input.cornerDegrees < 180) ||
      (input.terminalSeeds !== undefined &&
        !Array.from(input.terminalSeeds).every(
          (seed: IAutoMovieRecoveryTerminalSeed): boolean =>
            input.coordinatesMm.includes(seed.coordinateMm) &&
            seed.loopIndex >= 0,
        )) ||
      (input.slabPairs !== undefined &&
        !Array.from(input.slabPairs).every(
          (pair: IAutoMovieRecoverySlabPair): boolean =>
            pair.beforeMm < pair.afterMm &&
            input.coordinatesMm.includes(pair.beforeMm) &&
            input.coordinatesMm.includes(pair.afterMm),
        ))
    )
      return {
        operator,
        status: "refused",
        diagnostics: [
          "Named distinct finite plane coordinates, registered triangles, physical frame, supported basis and valid fit policy are required",
        ],
      };

    const frame: ReturnType<IAutoMoviePlaneFrameConstruction.Operation> =
      planeFrame([0, 0, 0], input.axis, input.reference);
    if (
      ![frame.n, frame.u, frame.v].every(
        (axis: [number, number, number]): boolean => Math.hypot(...axis) > 0,
      )
    )
      throw new Error("Section frame has no nonzero axis");
    options.onProgress?.("fixed-sections", 0, input.coordinatesMm.length);
    if (cancelled()) throw new Error("Section observation cancelled");
    const prepared: ReturnType<IAutoMovieRecoveryMeshIncidencePreparationOperation.Operation> =
      prepareRecoveryMeshIncidence(input, input.verticesMm);
    const heights: number[] = input.verticesMm.map(
      (p: [number, number, number]): number =>
        p[0] * frame.n[0] + p[1] * frame.n[1] + p[2] * frame.n[2],
    );
    const index: ReturnType<IAutoMovieRecoveryScalarIndex.Create> =
      RecoveryScalarIndex.create(input.triangles, heights);
    const slice: ReturnType<IAutoMovieMeshPlaneCut.Prepare> = prepareCutExact(
      prepared.mesh,
      heights,
      input.includeExactSourceLineage === true ||
        (input.slabPairs?.length ?? 0) > 0,
    );
    const orientation: ReturnType<IAutoMovieMeshSectionOrientation.Operation> =
      sourceOrientation(prepared.mesh, input.sourceOrientationSign);
    const sections: IAutoMovieRecoverySections["sections"] = [];
    const reports: IAutoMovieRecoverySections["reports"] = [];
    const seedObservations: Parameters<IAutoMovieRecoverySourceTerminalsObservationOperation.Operation>[0]["seeds"][number][] =
      [];
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
      if (cancelled()) throw new Error("Section observation cancelled");
      const plane: ReturnType<IAutoMoviePlaneFrameConstruction.Operation> = {
        ...frame,
        origin: [
          frame.n[0] * coordinateMm,
          frame.n[1] * coordinateMm,
          frame.n[2] * coordinateMm,
        ],
      };
      const observed: ReturnType<IAutoMovieRecoverySectionObservationOperation.Operation> =
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
                  if (cancelled())
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
                  if (cancelled())
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
            if (cancelled()) throw new Error("Terminal observation cancelled");
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
          if (cancelled()) throw new Error("Source slab observation cancelled");
        },
        observe: (slab: IAutoMovieRecoverySlabObservation): void => {
          if (cancelled()) throw new Error("Source slab observation cancelled");
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
          if (cancelled()) throw new Error("Source slab observation cancelled");
        },
      });
    }
    if (cancelled()) throw new Error("Section observation cancelled");
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
      status: cancellationRequested ? "cancelled" : "failed",
      diagnostics: [error instanceof Error ? error.message : String(error)],
    };
  }
}
