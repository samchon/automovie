import type { IAutoMovieRecoveryMeshSections } from "../structures/mesh/IAutoMovieRecoveryMeshSections";
import type { IAutoMovieRecoveryTensorFamiliesInput } from "../structures/domain/IAutoMovieRecoveryTensorFamiliesInput";
import type { IAutoMovieRecoveryReconstruction } from "../structures/domain/IAutoMovieRecoveryReconstruction";
import type { IAutoMovieRecoveryTensorRealization } from "../structures/domain/IAutoMovieRecoveryTensorRealization";
import type { IAutoMovieRecoveryAnalyticRealization } from "../structures/domain/IAutoMovieRecoveryAnalyticRealization";
import {
  IAutoMovieContourLoft64 as L,
  tessellateAutoMovieContourLoft64,
} from "@automovie/engine/geometry/curve";
import type { IAutoMovieModel } from "@automovie/interface";

import { realizeAutoMovieRecoveryAnalyticDomains } from "../reconstruction/realizeAutoMovieRecoveryAnalyticDomains";
import { realizeAutoMovieRecoveryTensorFamilies } from "../reconstruction/realizeAutoMovieRecoveryTensorFamilies";

/**
 * Generate saved ordinary tensor families and retained curve-only event or legacy domains.
 * Delegated groups have one tensor owner and are not also tiled by the contour operator.
 * Shared analytic end-curve coefficients are admitted before engine dispatch; their
 * polygonal conformity and transverse continuity remain independently unqualified.
 * The contour engine shares each retained generating boundary across incident slabs. Unmet fitting
 * tolerances and strip-quality failures remain visible and unqualified. An actual missing
 * incidence or unrepresentable primitive remains a local gap rather than a quality warning.
 * Optional work observation changes timing records only; saved generating inputs are immutable.
 *
 * @evidence contracts/common.md#principled-implementation Complete cubics, observed incidence and saved tensor recipes generate independent geometry through their engine owners. A unique group-to-family partition prevents duplicate surface ownership; tensor endpoint coefficients share the admitted curve authority.
 * @evidence contracts/common.md#clear-and-simple-design Tensor-family admission and realization have one owner; the contour invocation owns the remaining groups. This adapter combines parts and actual construction while preserving separate completion and quality reports.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source geometry, source normals or source addresses are admitted. Numerical target misses and strip topology/link/orientation warnings never remove returned finite geometry. Actual unresolved incidence remains explicit without fallback or forced closure.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes displayability from qualification, work observations, shared curve authority, actual local gaps and source-independent engine generation.
 * @evidence contracts/performance.md#efficient-algorithms Saved section and report gathering are O(K+P), and delegated-group lookup is O(G). Engine owners report tensor and contour realization costs; all retained parts and construction remain in the result.
 * @evidence contracts/performance.md#reuse-equivalent-work Each family and retained contour invocation supplies its model, construction and report once; camera changes need no regeneration.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Generated model buffers, actual construction and diagnostics transfer to the caller; the adapter retains no source mesh, cache or handle.
 */
export function reconstructRecovery(
  bundle: IAutoMovieRecoveryTensorFamiliesInput,
  options: {
    observeWork?: boolean;
    analytic?: IAutoMovieRecoveryAnalyticRealization;
  } = {},
): IAutoMovieRecoveryReconstruction {
  if (
    bundle.reports.length !== bundle.loft.sections.length ||
    !bundle.loft.intervals
  )
    throw new Error(
      "A generic cubic bundle with explicit curve continuation is required",
    );
  const diagnostics: string[] = [...bundle.diagnostics];
  for (let i: number = 0; i < bundle.loft.sections.length; i++) {
    const report: IAutoMovieRecoveryMeshSections["reports"][number] = bundle.reports[i]!;
    const section: L.ISection = bundle.loft.sections[i]!;
    if (
      report.coordinateMm !== section.coordinateMm ||
      report.fits.length !== section.loops.length
    )
      throw new Error(
        "Recovery quality reports are not aligned with their curve authority",
      );
    for (const diagnostic of report.diagnostics)
      diagnostics.push(`${section.coordinateMm} mm: ${diagnostic}`);
  }
  const tensor: IAutoMovieRecoveryTensorRealization =
    realizeAutoMovieRecoveryTensorFamilies(bundle);
  const analytic: IAutoMovieRecoveryAnalyticRealization =
    options.analytic ?? realizeAutoMovieRecoveryAnalyticDomains(bundle);
  const replacements: Map<string, string> = new Map(tensor.replacements);
  for (const [key, id] of analytic.closedGroups) replacements.set(key, id);
  const generated: L.IResult = tessellateAutoMovieContourLoft64({
    ...bundle.loft,
    intervals: bundle.loft.intervals.map(
      (interval: L.IInterval, i: number): L.IInterval => ({
        ...interval,
        groups: Array.isArray(interval.groups)
          ? interval.groups.map(
              (
                group: L.IInterval["groups"][number],
                j: number,
              ): L.IInterval["groups"][number] =>
                replacements.has(`${i}:${j}`)
                  ? {
                      ...group,
                      supported: false,
                      reason: `Saved domain delegated to analytic owner ${replacements.get(`${i}:${j}`)}`,
                    }
                  : group,
            )
          : interval.groups,
      }),
    ),
    observeWork: options.observeWork ?? false,
  });
  const model: IAutoMovieModel = {
    id: "recovered-curves",
    name: null,
    origin: "generated",
    parts: [],
    skeleton: null,
    body: null,
    materials: [],
    asset: null,
  };
  model.parts.push(...tensor.parts, ...analytic.parts);
  const construction: IAutoMovieRecoveryTensorRealization["construction"] = [
    ...generated.construction,
    ...tensor.construction,
    ...analytic.construction,
  ];
  for (const report of [...tensor.reports, ...analytic.reports])
    diagnostics.push(
      ...report.diagnostics.map(
        (message: string): string => `${report.id}: ${message}`,
      ),
    );
  if (generated.mesh.indices!.length > 0)
    model.parts.push({
      id: "recovery.curve-loft",
      name: null,
      geometry: { type: "mesh", mesh: generated.mesh },
      material: null,
      attachedBone: null,
      transform: null,
    });
  const delegationReasons: Set<string> = new Set(
    [...replacements.values()].map(
      (id: string): string => `Saved domain delegated to analytic owner ${id}`,
    ),
  );
  const unresolved: L.IResult["unresolved"] = generated.unresolved.filter(
    (record: L.IResult["unresolved"][number]): boolean =>
      record.reason === undefined || !delegationReasons.has(record.reason),
  );
  return {
    model,
    construction,
    diagnostics,
    unresolved,
    stripObservations: generated.stripObservations ?? [],
    primitiveRanges: generated.primitiveRanges ?? [],
    interactionObservations: generated.interactionObservations ?? [],
    tensorReports: tensor.reports,
    analyticReports: analytic.reports,
  };
}
