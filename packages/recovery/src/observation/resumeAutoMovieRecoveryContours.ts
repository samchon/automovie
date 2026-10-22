import { convertAutoMovieRecoveryCurves } from "../curves/convertAutoMovieRecoveryCurves";
import { RecoveryScalarIndex } from "../internal/RecoveryScalarIndex";
import { bindRecoverySavedSectionCuts } from "../internal/bindRecoverySavedSectionCuts";
import { cutExact } from "../internal/mesh-observations/cutExact";
import { planeFrame } from "../internal/mesh-observations/planeFrame";
import { sourceOrientation } from "../internal/mesh-observations/sourceOrientation";
import { observeRecoverySection } from "../internal/observeRecoverySection";
import { prepareRecoveryMeshIncidence } from "../internal/prepareRecoveryMeshIncidence";
import { validateRecoveryContourResume } from "../internal/validateRecoveryContourResume";
import type { IAutoMovieRecoveryCurveFit } from "../structures/curve/IAutoMovieRecoveryCurveFit";
import type { IAutoMovieRecoveryContourResume } from "../structures/mesh/IAutoMovieRecoveryContourResume";
import type { IAutoMovieRecoveryContourResumeInput } from "../structures/mesh/IAutoMovieRecoveryContourResumeInput";
import type { IAutoMovieRecoveryContourResumePolicy } from "../structures/mesh/IAutoMovieRecoveryContourResumePolicy";
import type { IAutoMovieRecoverySavedSection } from "../structures/mesh/IAutoMovieRecoverySavedSection";
import type { IAutoMovieRecoveryObservationOptions } from "../structures/operation/IAutoMovieRecoveryObservationOptions";
import type { AutoMovieRecoveryCurveFormat } from "../typings/AutoMovieRecoveryCurveFormat";
import type { IAutoMovieRecoveryResult } from "../typings/IAutoMovieRecoveryResult";

/** Fit only explicitly failed, rebound raw source contours into a new patch.
 * Original coefficient artifacts are opaque external references. The caller
 * verifies their bytes and actual tolerance/corner/orientation policy before
 * supplying identities. All saved populations and target eligibility are
 * checked before any fit. Raw ordinals never become patch coefficient indices.
 *
 * A contour with E observed edges needs at most E adaptive spans: every split
 * partitions a positive integer edge range. Each exact source triangle emits
 * at most three cut edges, giving a conservative preplan bound 3F. The new
 * budget is actual E, without forcing one span per edge; this prevents budget
 * exhaustion but cannot guarantee finite conditioning or tolerance success.
 * Original policy and measured E/F/bounds survive every requested outcome.
 * Only newly fitted cubics pass through the official selected-basis converter.
 *
 * Inputs stay unchanged during the synchronous call. Progress callbacks run
 * before/after raw planes and target fits; throwing fails without a value and
 * abort stops later work. A synchronous numeric fit cannot be interrupted from
 * inside its solve. No timer, host, source normal or original coefficient is
 * read. Complete qualifies requested patch tolerance only, not original curves,
 * surface error, continuation, phase correspondence or transverse jets.
 *
 * @evidence contracts/common.md#principled-implementation The existing frame, canonical incidence, indexed exact cutter, complete saved-cut binder, material-side orientation and section fitter define the same raw problem. Actual positive-edge subdivision proves E and exact emitted face provenance proves 3F; binary64 geometry and residuals retain their existing limits.
 * @evidence contracts/common.md#clear-and-simple-design A separate additive operator preflights every binding, fits one raw target at a time through the established owner and returns distinct original artifact references and patch-local fit indices. Normal observation behavior remains unchanged.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Successful and unresolved-tolerance publications cannot be targeted. No original coefficient traversal, high-degree/rational conversion, source polyline replacement, relaxed policy, source-specific fit, mesh/normal fallback or coordinate correction occurs.
 * @evidence contracts/common.md#meaningful-documentation States original artifact/policy commitments, source-only binding scope, E and 3F proof, physical phase/units, index namespaces, quality limits, borrowed lifetime and callback/cancellation effects.
 * @evidence contracts/performance.md#efficient-algorithms For V vertices, T triangles and K saved planes, preparation costs O(V+T log T) time and O(V+T) storage. Each indexed cut sorts A intersecting faces in O(A log A), worst-case O(T+A log A), and binding visits samples and incident faces. Retained cuts cost O(sum P) space. For each target with N observations and S at most E spans, the existing adaptive fitter costs O(N log S) for balanced splits and O(N squared) worst case with O(N+S) live storage. Conversion costs O(S); orientations are prepared at most once per sign.
 * @evidence contracts/performance.md#reuse-equivalent-work One incidence registry, scalar index and exact cutter serve all planes. Bound cuts supply targets without recutting; only failed targets are fitted and only new fits converted. Original coefficient artifacts incur zero loading, fitting or conversion work.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Source references, raw cuts, orientation closures and maps expire with the synchronous call. Returned coefficients and copied address/publication/policy metadata belong to the caller; no source mesh, original coefficients, listeners, tasks or persistent cache transfer.
 */
export function resumeAutoMovieRecoveryContours<
  Format extends AutoMovieRecoveryCurveFormat,
>(
  input: IAutoMovieRecoveryContourResumeInput,
  options: Pick<
    IAutoMovieRecoveryObservationOptions<Format>,
    "curveFormat" | "signal" | "onProgress"
  >,
): IAutoMovieRecoveryResult<IAutoMovieRecoveryContourResume<Format>> {
  const operator: IAutoMovieRecoveryResult<never>["operator"] =
    "contour-resume-v1";
  if (options?.signal?.aborted)
    return {
      operator,
      status: "cancelled",
      diagnostics: ["Cancelled before contour resume"],
    };
  if (
    !validateRecoveryContourResume(input) ||
    !options ||
    !["bezier", "hermite"].includes(options.curveFormat) ||
    (options.onProgress !== undefined &&
      typeof options.onProgress !== "function")
  )
    return {
      operator,
      status: "refused",
      diagnostics: [
        "Complete saved source bindings, distinct failed raw targets, caller-bound actual original policies and a supported basis are required",
      ],
    };
  try {
    const checkpoint: () => void = (): void => {
      if (options.signal?.aborted) throw new Error("Contour resume cancelled");
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
        diagnostics: ["Contour resume frame is unresolved"],
      };
    const physicalFrame: IAutoMovieRecoveryContourResume["frame"] = {
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
    progress("contour-resume-cuts", 0, input.savedSections.length);
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
    const cuts: Map<number, ReturnType<typeof cut>> = new Map();
    const sections: IAutoMovieRecoveryContourResume["sections"] = [];
    for (const [sectionIndex, saved] of input.savedSections.entries()) {
      checkpoint();
      const origin: [number, number, number] = frame.n.map(
        (value: number): number => value * saved.coordinateMm,
      ) as [number, number, number];
      if (!finiteVector(origin))
        throw new Error(
          "Contour resume origin exceeds finite millimetre coordinates",
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
      cuts.set(saved.coordinateMm, contours);
      sections.push(bound.value);
      progress(
        "contour-resume-cuts",
        sectionIndex + 1,
        input.savedSections.length,
      );
    }
    const sectionMap: Map<number, (typeof sections)[number]> = new Map(
      sections.map(
        (section: (typeof sections)[number]): [number, typeof section] => [
          section.coordinateMm,
          section,
        ],
      ),
    );
    const policies: Map<string, IAutoMovieRecoveryContourResumePolicy> =
      new Map(
        input.fitPolicies.map(
          (
            policy: IAutoMovieRecoveryContourResumePolicy,
          ): [string, IAutoMovieRecoveryContourResumePolicy] => [
            policy.observationIdentity,
            policy,
          ],
        ),
      );
    const targets: IAutoMovieRecoveryContourResume["targets"] = [];
    const selected: Set<string> = new Set();
    const usedPolicies: Set<string> = new Set();
    for (const request of input.targets) {
      const section: (typeof sections)[number] | undefined = sectionMap.get(
        request.coordinateMm,
      );
      const lineage:
        | (typeof sections)[number]["sourceLineage"][number]
        | undefined = section?.sourceLineage[request.contourIndex];
      if (!section || !lineage || lineage.publication.kind !== "failed")
        return {
          operator,
          status: "refused",
          diagnostics: [
            `Target ${request.coordinateMm}/${request.contourIndex} is not an original failed raw contour`,
          ],
        };
      const policy: IAutoMovieRecoveryContourResumePolicy | undefined =
        policies.get(section.observationIdentity);
      if (!policy)
        return {
          operator,
          status: "refused",
          diagnostics: [
            `Target artifact ${section.observationIdentity} has no caller-bound actual original policy`,
          ],
        };
      const raw: ReturnType<typeof cut>[number] = cuts.get(
        request.coordinateMm,
      )![request.contourIndex]!;
      const edges: number = raw.closed
        ? raw.pts.length
        : Math.max(0, raw.pts.length - 1);
      const faces: number = lineage.exactSourceTriangleIds!.length;
      const upper: number = 3 * faces;
      if (!Number.isSafeInteger(upper) || edges > upper)
        throw new Error(
          "Exact cut edge count exceeds its source-triangle emission bound",
        );
      targets.push({
        coordinateMm: request.coordinateMm,
        originalRawContourIndex: request.contourIndex,
        observationIdentity: section.observationIdentity,
        previousFailureDiagnostic: lineage.publication.diagnostic,
        originalPolicy: { ...policy },
        closed: raw.closed,
        actualObservationCount: raw.pts.length,
        actualRawEdgeCount: edges,
        exactSourceFaceCount: faces,
        plannedSpanUpperBound: upper,
        maxSpans: edges,
        outcome: {
          kind: "failed",
          diagnostic: "Target has not been fitted",
          diagnostics: [],
        },
      });
      selected.add(address(request.coordinateMm, request.contourIndex));
      usedPolicies.add(policy.observationIdentity);
    }
    if (usedPolicies.size !== policies.size)
      return {
        operator,
        status: "refused",
        diagnostics: ["Unused original artifact policies are not admitted"],
      };
    const preservedOriginals: IAutoMovieRecoveryContourResume["preservedOriginals"] =
      sections.flatMap(
        (
          section: (typeof sections)[number],
        ): IAutoMovieRecoveryContourResume["preservedOriginals"] =>
          section.sourceLineage
            .filter(
              (record: (typeof section.sourceLineage)[number]): boolean =>
                !selected.has(
                  address(section.coordinateMm, record.contourIndex),
                ),
            )
            .map(
              (
                record: (typeof section.sourceLineage)[number],
              ): IAutoMovieRecoveryContourResume["preservedOriginals"][number] => ({
                coordinateMm: section.coordinateMm,
                originalRawContourIndex: record.contourIndex,
                observationIdentity: section.observationIdentity,
                publication: { ...record.publication },
              }),
            ),
      );
    const fits: IAutoMovieRecoveryContourResume<Format>["fits"] = [];
    const orientations: Map<
      1 | -1,
      ReturnType<typeof sourceOrientation>
    > = new Map();
    progress("contour-resume-fit", 0, targets.length);
    for (const [targetIndex, target] of targets.entries()) {
      checkpoint();
      const raw: ReturnType<typeof cut>[number] = cuts.get(
        target.coordinateMm,
      )![target.originalRawContourIndex]!;
      if (raw.pts.length < (raw.closed ? 3 : 2)) {
        target.outcome = {
          kind: "failed",
          diagnostic:
            "Failed raw contour is a degenerate contact; fitting is unsupported",
          diagnostics: [],
        };
      } else {
        const sign: 1 | -1 = target.originalPolicy.sourceOrientationSign;
        if (!orientations.has(sign))
          orientations.set(sign, sourceOrientation(prepared.mesh, sign));
        const observed: ReturnType<typeof observeRecoverySection> =
          observeRecoverySection({
            coordinateMm: target.coordinateMm,
            plane: {
              ...frame,
              origin: frame.n.map(
                (value: number): number => value * target.coordinateMm,
              ) as [number, number, number],
            },
            contours: [raw],
            faceEdges: prepared.faceEdges,
            vertexFaces: prepared.vertexFaces,
            orientation: orientations.get(sign)!,
            policy: {
              toleranceMm: target.originalPolicy.toleranceMm,
              cornerDegrees: target.originalPolicy.cornerDegrees,
              maxSpans: target.maxSpans,
            },
            name: `${input.name}.patch.${targetIndex}.raw.${target.originalRawContourIndex}`,
          });
        checkpoint();
        const loop: (typeof observed.section.loops)[number] | undefined =
          observed.section.loops[0];
        const quality: (typeof observed.report.fits)[number] | undefined =
          observed.report.fits[0];
        const fitted: IAutoMovieRecoveryCurveFit | undefined =
          loop && quality
            ? { curve: loop.curve, ...quality }
            : observed.report.open[0];
        if (fitted) {
          const patchCurveIndex: number = fits.length;
          fits.push(
            convertAutoMovieRecoveryCurves(fitted, options.curveFormat),
          );
          target.outcome = {
            kind: "fitted",
            patchCurveIndex,
            ...(loop ? { winding: loop.winding } : {}),
            diagnostics: [...observed.report.diagnostics],
          };
        } else
          target.outcome = {
            kind: "failed",
            diagnostic:
              observed.report.diagnostics.join("; ") ||
              "Failed raw contour produced no fitted curve",
            diagnostics: [...observed.report.diagnostics],
          };
      }
      progress("contour-resume-fit", targetIndex + 1, targets.length);
    }
    checkpoint();
    const partial: boolean = targets.some(
      (target: (typeof targets)[number]): boolean =>
        target.outcome.kind === "failed" ||
        !fits[target.outcome.patchCurveIndex]!.toleranceMet,
    );
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
        originalCurveCoefficientsRead: false,
        sections,
        preservedOriginals,
        fits,
        targets,
      },
      diagnostics: [
        "Caller source/selection/artifact identities were compared, not hashed; actual original policies remain caller-attested",
        "Original publication indices remain in original artifacts; patchCurveIndex addresses only the new fits array",
        "Only failed targets were fitted; original coefficient degrees, rational weights, actual phase widths, units and directions remain untouched external byte references",
        "Complete qualifies requested patch tolerance only; normal curve correctness, material correspondence, smooth surface error and transverse jets are not inferred",
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

function address(coordinateMm: number, contourIndex: number): string {
  return `${coordinateMm}/${contourIndex}`;
}

function finiteVector(value: unknown): value is [number, number, number] {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    [0, 1, 2].every((index: number): boolean => Number.isFinite(value[index]))
  );
}

function sameFrame(
  saved: IAutoMovieRecoverySavedSection["frame"],
  actual: IAutoMovieRecoveryContourResume["frame"],
): boolean {
  return (["originMm", "n", "u", "v"] as const).every(
    (key: keyof typeof actual): boolean =>
      saved[key].every(
        (value: number, index: number): boolean => value === actual[key][index],
      ),
  );
}
