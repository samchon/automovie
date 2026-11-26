import type {
  IAutoMovieMeshPlaneCut,
  IAutoMoviePlaneFrameConstruction,
  IAutoMovieRecoveryMeshIncidencePreparationOperation,
  IAutoMovieRecoveryOptions,
  IAutoMovieRecoveryResult,
  IAutoMovieRecoverySavedSection,
  IAutoMovieRecoverySavedSectionCutsBindingOperation,
  IAutoMovieRecoveryScalarIndex,
  IAutoMovieRecoverySlabObservation,
  IAutoMovieRecoverySlabs,
  IAutoMovieRecoverySlabsInput,
} from "@automovie/interface";

import { RecoveryScalarIndex } from "../../internal/RecoveryScalarIndex";
import { bindRecoverySavedSectionCuts } from "../../geometry/internal/bindRecoverySavedSectionCuts";
import { cutExact } from "../../internal/mesh-observations/cutExact";
import { planeFrame } from "../../geometry/internal/planeFrame";
import { observeRecoverySourceSlabs } from "../../geometry/internal/observeRecoverySourceSlabs";
import { prepareRecoveryMeshIncidence } from "../../geometry/internal/prepareRecoveryMeshIncidence";

/**
 * Observe exact source slabs without reading, converting or fitting
 * coefficients. One prepared source/scalar chart recuts every saved endpoint
 * plane and binds its complete raw-contour population to caller-attested saved
 * publications. Source identities, selected original ordinal space,
 * registration and artifact byte commitments must already be verified by the
 * caller. Matching strings, frames, raw addresses and admitted closure do not
 * verify a curve's geometry, physical phase, direction, approximation error or
 * transverse jets. All source components and unsupported contacts survive.
 * Failed curve resume is absent.
 *
 * Source arrays and saved records must remain unchanged during this synchronous
 * call. Progress and slab observers are cooperative checkpoints; throwing fails
 * the operation without a value. Slab callbacks receive independent copies,
 * provisional until success; callback-requested cancellation stops later
 * work/delivery. No timer, listener, filesystem, host, source normal or
 * coefficient payload is involved.
 */
export function observeAutoMovieRecoverySlabs(
  input: IAutoMovieRecoverySlabsInput,
  options: Pick<
    IAutoMovieRecoveryOptions,
    "cancelled" | "onProgress" | "onSourceSlab"
  > = {},
): IAutoMovieRecoveryResult<IAutoMovieRecoverySlabs> {
  const operator: IAutoMovieRecoveryResult<never>["operator"] =
    "source-slabs-v1";
  let cancellationRequested: boolean = false;
  const cancelled: () => boolean = (): boolean => {
    cancellationRequested = options.cancelled?.() === true;
    return cancellationRequested;
  };
  try {
    if (cancelled())
      return {
        operator,
        status: "cancelled",
        diagnostics: ["Cancelled before source slab observation"],
      };

    const checkpoint: () => void = (): void => {
      if (cancelled()) throw new Error("Source slab observation cancelled");
    };
    const progress: (phase: string, done: number, total: number) => void = (
      phase: string,
      done: number,
      total: number,
    ): void => {
      checkpoint();
      options.onProgress?.(phase, done, total);
      checkpoint();
    };
    const frame: ReturnType<IAutoMoviePlaneFrameConstruction.Operation> =
      planeFrame([0, 0, 0], input.axis, input.reference);
    if (
      ![frame.n, frame.u, frame.v].every(
        (axis: [number, number, number]): boolean => Math.hypot(...axis) > 0,
      )
    )
      return {
        operator,
        status: "refused",
        diagnostics: ["Source slab frame is unresolved"],
      };
    const physicalFrame: IAutoMovieRecoverySlabs["frame"] = {
      originMm: [...frame.origin],
      n: [...frame.n],
      u: [...frame.u],
      v: [...frame.v],
    };
    for (const saved of input.savedSections)
      if (
        saved.sourceIdentity !== input.sourceIdentity ||
        saved.sourceSelectionIdentity !== input.sourceSelectionIdentity ||
        saved.exactCoordinateAliases !== input.exactCoordinateAliases ||
        !sameFrame(saved.frame, physicalFrame)
      )
        return {
          operator,
          status: "refused",
          diagnostics: [
            `Saved section ${saved.coordinateMm} has a different caller source, selection, exact-alias policy or physical frame`,
          ],
        };
    progress("source-slab-cuts", 0, input.savedSections.length);
    const prepared: ReturnType<IAutoMovieRecoveryMeshIncidencePreparationOperation.Operation> =
      prepareRecoveryMeshIncidence(input, input.verticesMm);
    const heights: number[] = input.verticesMm.map(
      (point: [number, number, number]): number =>
        point[0] * frame.n[0] + point[1] * frame.n[1] + point[2] * frame.n[2],
    );
    const index: ReturnType<IAutoMovieRecoveryScalarIndex.Create> =
      RecoveryScalarIndex.create(input.triangles, heights);
    const cut: ReturnType<IAutoMovieMeshPlaneCut.Prepare> = cutExact.prepare(
      prepared.mesh,
      heights,
      true,
    );
    const sections: IAutoMovieRecoverySlabs["sections"] = [];
    for (const [sectionIndex, saved] of input.savedSections.entries()) {
      checkpoint();
      const origin: [number, number, number] = [
        frame.n[0] * saved.coordinateMm,
        frame.n[1] * saved.coordinateMm,
        frame.n[2] * saved.coordinateMm,
      ];
      const contours: ReturnType<typeof cut> = cut(
        { ...frame, origin },
        saved.coordinateMm,
        index.cut(saved.coordinateMm),
      );
      const bound: ReturnType<IAutoMovieRecoverySavedSectionCutsBindingOperation.Operation> =
        bindRecoverySavedSectionCuts({ saved, contours, prepared, checkpoint });
      if (bound.status === "refused")
        return { operator, status: "refused", diagnostics: [bound.diagnostic] };
      sections.push(bound.value);
      progress(
        "source-slab-cuts",
        sectionIndex + 1,
        input.savedSections.length,
      );
    }
    let partial: boolean = sections.some(
      (section: IAutoMovieRecoverySlabs["sections"][number]): boolean =>
        section.sourceLineage.some(
          (record: (typeof section.sourceLineage)[number]): boolean =>
            record.publication.kind !== "closed",
        ),
    );
    let completed: number = 0;
    progress("source-slabs", 0, input.slabPairs.length);
    const slabs: IAutoMovieRecoverySlabObservation[] =
      observeRecoverySourceSlabs({
        prepared,
        heights,
        axis: frame.n,
        exactCoordinateAliases: input.exactCoordinateAliases,
        index,
        pairs: input.slabPairs,
        sectionCoordinatesMm: sections.map(
          (section: IAutoMovieRecoverySlabs["sections"][number]): number =>
            section.coordinateMm,
        ),
        publications: sections.flatMap(
          (
            section: IAutoMovieRecoverySlabs["sections"][number],
          ): typeof section.sourceLineage => section.sourceLineage,
        ),
        checkpoint,
        observe: (record: IAutoMovieRecoverySlabObservation): void => {
          checkpoint();
          partial ||=
            record.issues.length > 0 ||
            record.events.some(
              (event: (typeof record.events)[number]): boolean =>
                !event.qualified,
            ) ||
            record.ports.some(
              (port: (typeof record.ports)[number]): boolean =>
                port.status === "missing" || port.status === "ambiguous",
            ) ||
            record.components.some(
              (component: (typeof record.components)[number]): boolean =>
                !component.topology.manifold ||
                component.topology.orientable !== true,
            );
          options.onSourceSlab?.(structuredClone(record));
          checkpoint();
          progress("source-slabs", ++completed, input.slabPairs.length);
        },
      });
    checkpoint();
    return {
      operator,
      status: partial ? "partial" : "complete",
      value: {
        name: input.name,
        sourceIdentity: input.sourceIdentity,
        sourceSelectionIdentity: input.sourceSelectionIdentity,
        axis: [...input.axis],
        reference: [...input.reference],
        frame: physicalFrame,
        bindingAuthority: "raw-cut-addresses-and-closure-only",
        callerBindingRequired: true,
        curveCoefficientsRead: false,
        sections,
        slabs,
      },
      diagnostics: [
        "Caller source/selection/artifact identities were compared, not hashed; the caller owns byte and registration verification",
        "Raw contour ordinals, source face sets and admitted closure were verified; symbolic curve names do not verify coefficients, degree, phase, direction, fit error or transverse jets",
        "No coefficient was read or fitted; failed coefficient resume and generated-surface authorization remain unsupported",
      ],
    };
  } catch (failure: unknown) {
    return {
      operator,
      status: cancellationRequested ? "cancelled" : "failed",
      diagnostics: [
        failure instanceof Error ? failure.message : String(failure),
      ],
    };
  }
}

/** Whether a saved section's frame equals the observed plane frame exactly. */
function sameFrame(
  saved: IAutoMovieRecoverySavedSection["frame"],
  actual: IAutoMovieRecoverySlabs["frame"],
): boolean {
  return FRAME_KEYS.every((key: FrameKey): boolean =>
    saved[key].every(
      (value: number, index: number): boolean => value === actual[key][index],
    ),
  );
}

/** A plane frame's member: its origin or one of its three axes. */
type FrameKey = keyof IAutoMovieRecoverySlabs["frame"];

/** The plane frame's members, compared one by one. */
const FRAME_KEYS: readonly FrameKey[] = ["originMm", "n", "u", "v"];
