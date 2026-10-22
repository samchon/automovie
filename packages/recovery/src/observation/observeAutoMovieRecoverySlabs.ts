import { RecoveryScalarIndex } from "../internal/RecoveryScalarIndex";
import { bindRecoverySavedSectionCuts } from "../internal/bindRecoverySavedSectionCuts";
import { cutExact } from "../internal/mesh-observations/cutExact";
import { planeFrame } from "../internal/mesh-observations/planeFrame";
import { observeRecoverySourceSlabs } from "../internal/observeRecoverySourceSlabs";
import { prepareRecoveryMeshIncidence } from "../internal/prepareRecoveryMeshIncidence";
import type { IAutoMovieRecoverySavedSection } from "../structures/mesh/IAutoMovieRecoverySavedSection";
import type { IAutoMovieRecoverySlabs } from "../structures/mesh/IAutoMovieRecoverySlabs";
import type { IAutoMovieRecoverySlabsInput } from "../structures/mesh/IAutoMovieRecoverySlabsInput";
import type { IAutoMovieRecoverySlabObservation } from "../structures/observation/IAutoMovieRecoverySlabObservation";
import type { IAutoMovieRecoveryOptions } from "../structures/operation/IAutoMovieRecoveryOptions";
import type { IAutoMovieRecoveryResult } from "../typings/IAutoMovieRecoveryResult";

/** Observe exact source slabs without reading, converting or fitting coefficients.
 * One prepared source/scalar chart recuts every saved endpoint plane and binds
 * its complete raw-contour population to caller-attested saved publications.
 * Source identities, selected original ordinal space, registration and artifact
 * byte commitments must already be verified by the caller. Matching strings,
 * frames, raw addresses and admitted closure do not verify a curve's geometry,
 * physical phase, direction, approximation error or transverse jets. All source
 * components and unsupported contacts survive. Failed curve resume is absent.
 *
 * Source arrays and saved records must remain unchanged during this synchronous
 * call. Progress and slab observers are cooperative checkpoints; throwing fails
 * the operation without a value. Slab callbacks receive independent copies,
 * provisional until success; callback abort stops later work/delivery. No timer,
 * listener, filesystem, host, source normal or coefficient payload is involved.
 *
 * @evidence contracts/common.md#principled-implementation Existing frame normalization, exact-zero cutter, canonical source incidence, indexed source-cell topology and PL critical/bracket observers share one binary64 scalar authority. Every source contour is checked against its saved ordinal, incidence sets and supported closure before any slab is delivered; binary64 predicates are not certified exact arithmetic.
 * @evidence contracts/common.md#clear-and-simple-design This additive operator separates raw source topology from coefficient observation and reuses the existing slab owner. Saved frames/aliases and caller provenance identities form admission, while one private binding helper owns contour identity checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fitter, coefficient converter, source-specific selection, nearest-point bridge, source mesh/normal fallback or regenerated normal curve appears. Caller names stay symbolic references; all-component source evidence never claims coefficient, phase or jet qualification.
 * @evidence contracts/common.md#meaningful-documentation States millimetre projection, original direction and address ownership, caller hash/selection responsibilities, exact comparison scope, unchanged coefficient lifetime, unsupported failed-fit resume and callback exception/cancellation effects.
 * @evidence contracts/performance.md#efficient-algorithms For V vertices, T faces and K endpoint planes, source admission and indexing use O(V+T log T) time and O(V+T) storage. Each indexed raw cut visits its A intersecting faces and sorts candidates in O(A log A), with worst-case O(T+A log A); contour binding visits samples and incident faces. The existing slab owner documents source-cell/critical costs. Optional callback cloning is linear in each delivered metadata record; no fitting cost exists.
 * @evidence contracts/performance.md#reuse-equivalent-work One immutable incidence registry, normalized scalar vector, face interval index and cutting closure serve all endpoints and slab pairs. Existing coefficients are not loaded or processed; raw exact supports are reused for port publication without a second cut.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Prepared source references, raw cut points and binding maps expire with the synchronous call. Returned records copy source addresses and measured critical positions only. Callback copies are caller-owned; no source arrays, coefficients, listeners, caches or background tasks transfer.
 */
export function observeAutoMovieRecoverySlabs(
  input: IAutoMovieRecoverySlabsInput,
  options: Pick<
    IAutoMovieRecoveryOptions,
    "signal" | "onProgress" | "onSourceSlab"
  > = {},
): IAutoMovieRecoveryResult<IAutoMovieRecoverySlabs> {
  const operator: IAutoMovieRecoveryResult<never>["operator"] =
    "source-slabs-v1";
  if (options?.signal?.aborted)
    return {
      operator,
      status: "cancelled",
      diagnostics: ["Cancelled before source slab observation"],
    };
  if (
    !valid(input) ||
    !options ||
    (options.onProgress !== undefined &&
      typeof options.onProgress !== "function") ||
    (options.onSourceSlab !== undefined &&
      typeof options.onSourceSlab !== "function")
  )
    return {
      operator,
      status: "refused",
      diagnostics: [
        "Registered triangles, caller source/selection identities, complete saved endpoint publications, finite slab pairs and valid observers are required",
      ],
    };
  try {
    const checkpoint: () => void = (): void => {
      if (options.signal?.aborted)
        throw new Error("Source slab observation cancelled");
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
    const frame: ReturnType<typeof planeFrame> = planeFrame(
      [0, 0, 0],
      input.axis,
      input.reference,
    );
    if (
      ![frame.n, frame.u, frame.v].every(
        (axis: [number, number, number]): boolean =>
          finiteVector(axis) && Math.hypot(...axis) > 0,
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
    const prepared: ReturnType<typeof prepareRecoveryMeshIncidence> =
      prepareRecoveryMeshIncidence(input, input.verticesMm);
    const heights: number[] = input.verticesMm.map(
      (point: [number, number, number]): number =>
        point[0] * frame.n[0] + point[1] * frame.n[1] + point[2] * frame.n[2],
    );
    const index: ReturnType<typeof RecoveryScalarIndex.create> =
      RecoveryScalarIndex.create(input.triangles, heights);
    const cut: ReturnType<typeof cutExact.prepare> = cutExact.prepare(
      prepared.mesh,
      heights,
      true,
    );
    const sections: IAutoMovieRecoverySlabs["sections"] = [];
    for (const [sectionIndex, saved] of input.savedSections.entries()) {
      checkpoint();
      const origin: [number, number, number] = frame.n.map(
        (value: number): number => value * saved.coordinateMm,
      ) as [number, number, number];
      if (!finiteVector(origin))
        throw new Error(
          "Source slab section origin exceeds finite millimetre coordinates",
        );
      const contours: ReturnType<typeof cut> = cut(
        { ...frame, origin },
        saved.coordinateMm,
        index.cut(saved.coordinateMm),
      );
      const bound: ReturnType<typeof bindRecoverySavedSectionCuts> =
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
      status: options.signal?.aborted ? "cancelled" : "failed",
      diagnostics: [
        failure instanceof Error ? failure.message : String(failure),
      ],
    };
  }
}

function finiteVector(value: unknown): value is [number, number, number] {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    [0, 1, 2].every((index: number): boolean => Number.isFinite(value[index]))
  );
}

function text(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function sameFrame(
  saved: IAutoMovieRecoverySavedSection["frame"],
  actual: IAutoMovieRecoverySlabs["frame"],
): boolean {
  return ["originMm", "n", "u", "v"].every((key: string): boolean => {
    const name: keyof IAutoMovieRecoverySlabs["frame"] =
      key as keyof IAutoMovieRecoverySlabs["frame"];
    return (
      finiteVector(saved[name]) &&
      saved[name].every(
        (value: number, index: number): boolean =>
          value === actual[name][index],
      )
    );
  });
}

function valid(input: IAutoMovieRecoverySlabsInput): boolean {
  if (
    !input ||
    !text(input.name) ||
    !text(input.sourceIdentity) ||
    !text(input.sourceSelectionIdentity) ||
    !finiteVector(input.axis) ||
    !finiteVector(input.reference) ||
    typeof input.exactCoordinateAliases !== "boolean" ||
    !Array.isArray(input.verticesMm) ||
    input.verticesMm.length === 0 ||
    !Array.from(input.verticesMm).every(finiteVector) ||
    !Array.isArray(input.triangles) ||
    input.triangles.length === 0 ||
    !Array.from(input.triangles).every(
      (triangle: number[]): boolean =>
        Array.isArray(triangle) &&
        triangle.length === 3 &&
        [0, 1, 2].every(
          (index: number): boolean =>
            Number.isSafeInteger(triangle[index]) &&
            triangle[index]! >= 0 &&
            triangle[index]! < input.verticesMm.length,
        ),
    )
  )
    return false;
  if (
    !Array.isArray(input.savedSections) ||
    input.savedSections.length === 0 ||
    !Array.from(input.savedSections).every(
      (saved: IAutoMovieRecoverySavedSection): boolean =>
        !!saved &&
        Number.isFinite(saved.coordinateMm) &&
        text(saved.sourceIdentity) &&
        text(saved.sourceSelectionIdentity) &&
        text(saved.observationIdentity) &&
        typeof saved.exactCoordinateAliases === "boolean" &&
        !!saved.frame &&
        [
          saved.frame.originMm,
          saved.frame.n,
          saved.frame.u,
          saved.frame.v,
        ].every(finiteVector) &&
        Array.isArray(saved.sourceLineage),
    )
  )
    return false;
  const coordinates: Set<number> = new Set(
    input.savedSections.map(
      (saved: IAutoMovieRecoverySavedSection): number => saved.coordinateMm,
    ),
  );
  if (
    coordinates.size !== input.savedSections.length ||
    !Array.isArray(input.slabPairs) ||
    input.slabPairs.length === 0
  )
    return false;
  return Array.from(input.slabPairs).every(
    (pair: IAutoMovieRecoverySlabsInput["slabPairs"][number]): boolean =>
      !!pair &&
      Number.isFinite(pair.beforeMm) &&
      Number.isFinite(pair.afterMm) &&
      pair.beforeMm < pair.afterMm &&
      Number.isFinite(pair.afterMm - pair.beforeMm) &&
      coordinates.has(pair.beforeMm) &&
      coordinates.has(pair.afterMm),
  );
}
