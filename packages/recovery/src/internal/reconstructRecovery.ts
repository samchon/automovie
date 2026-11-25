import { tessellateAutoMovieContourLoft64 } from "@automovie/engine";
import type {
  IAutoMovieContourLoft64,
  IAutoMovieModel,
  IAutoMovieReconstructRecovery,
  IAutoMovieRecoveryAnalyticRealization,
  IAutoMovieRecoveryMeshSections,
  IAutoMovieRecoveryTensorRealization,
} from "@automovie/interface";

import { realizeAutoMovieRecoveryAnalyticDomains } from "../reconstruction/realizeAutoMovieRecoveryAnalyticDomains";
import { realizeAutoMovieRecoveryTensorFamilies } from "../reconstruction/realizeAutoMovieRecoveryTensorFamilies";

/**
 * Generate saved ordinary tensor families and retained curve-only event or
 * legacy domains. Delegated groups have one tensor owner and are not also tiled
 * by the contour operator. Shared analytic end-curve coefficients are admitted
 * before engine dispatch; their polygonal conformity and transverse continuity
 * remain independently unqualified. The contour engine shares each retained
 * generating boundary across incident slabs. Unmet fitting tolerances and
 * strip-quality failures remain visible and unqualified. An actual missing
 * incidence or unrepresentable primitive remains a local gap rather than a
 * quality warning. Optional work observation changes timing records only; saved
 * generating inputs are immutable.
 */
export function reconstructRecovery(
  bundle: Parameters<IAutoMovieReconstructRecovery.Operation>[0],
  options: Parameters<IAutoMovieReconstructRecovery.Operation>[1] = {},
): ReturnType<IAutoMovieReconstructRecovery.Operation> {
  if (
    bundle.reports.length !== bundle.loft.sections.length ||
    !bundle.loft.intervals
  )
    throw new Error(
      "A generic cubic bundle with explicit curve continuation is required",
    );
  const diagnostics: string[] = [...bundle.diagnostics];
  for (let i: number = 0; i < bundle.loft.sections.length; i++) {
    const report: IAutoMovieRecoveryMeshSections["reports"][number] =
      bundle.reports[i]!;
    const section: IAutoMovieContourLoft64.ISection = bundle.loft.sections[i]!;
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
  const generated: IAutoMovieContourLoft64.IResult =
    tessellateAutoMovieContourLoft64({
      ...bundle.loft,
      intervals: bundle.loft.intervals.map(
        (
          interval: IAutoMovieContourLoft64.IInterval,
          i: number,
        ): IAutoMovieContourLoft64.IInterval => ({
          ...interval,
          groups: interval.groups.map(
            (
              group: IAutoMovieContourLoft64.IInterval["groups"][number],
              j: number,
            ): IAutoMovieContourLoft64.IInterval["groups"][number] =>
              replacements.has(`${i}:${j}`)
                ? {
                    ...group,
                    supported: false,
                    reason: `Saved domain delegated to analytic owner ${replacements.get(`${i}:${j}`)}`,
                  }
                : group,
          ),
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
  const unresolved: IAutoMovieContourLoft64.IResult["unresolved"] =
    generated.unresolved.filter(
      (
        record: IAutoMovieContourLoft64.IResult["unresolved"][number],
      ): boolean =>
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
