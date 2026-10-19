import { reconstructRecovery } from "./internal/reconstructRecovery";
import type { realizeAutoMovieRecoveryTensorFamilies } from "./internal/realizeAutoMovieRecoveryTensorFamilies";
import type { IAutoMovieRecoveryOperation } from "./IAutoMovieRecoveryOperation";
import type { IAutoMovieRecoveryDomainLedger } from "./IAutoMovieRecoveryDomainLedger";
import { describeRecoveryDomains } from "./internal/describeRecoveryDomains";
import { readRecoveryMetadata as read } from "./internal/readRecoveryMetadata";

/**
 * Reconstruct saved cubic and domain coefficients without access to source geometry.
 * The legacy operator is explicit so another triangulator is not substituted during
 * package migration. Local unsupported incidence remains a partial usable result;
 * strip quality diagnostics do not discard finite geometry or certify smoothness.
 *
 * @evidence contracts/common.md#principled-implementation The saved coefficient authority and explicit incidence dispatch the existing contour and analytic operators.
 * @evidence contracts/common.md#clear-and-simple-design Terminal outcomes wrap the recovery orchestration result; Node admission and publication are separate and existing engine surface computation remains delegated.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source positions, source normals, original topology, rounding or forced closure is accepted.
 * @evidence contracts/common.md#meaningful-documentation Documents version, source-free input, partial domain coverage and numerical quality limits.
 * @evidence contracts/performance.md#efficient-algorithms Delegated contour DP and analytic realization dominate work; the wrapper adds linear declared-domain, range and diagnostic scans.
 * @evidence contracts/performance.md#reuse-equivalent-work One generated model supplies CPU and display consumers; no hidden reconstruction is repeated.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned model and construction arrays transfer to the caller; no I/O or retained cache exists.

 */
export function reconstructAutoMovieRecoveryModel(
  input: realizeAutoMovieRecoveryTensorFamilies.Input,
  options: IAutoMovieRecoveryOperation.Options = {},
): IAutoMovieRecoveryOperation.Result<ReturnType<typeof reconstructRecovery> & { membership: IAutoMovieRecoveryDomainLedger }> {
  const schema: IAutoMovieRecoveryOperation.Result<never>["schema"] = "automovie-recovery-operation-v1";
  const operator: IAutoMovieRecoveryOperation.Result<never>["operator"] = "legacy-contour-v1";
  if (options.signal?.aborted)
    return { schema, operator, status: "cancelled", diagnostics: ["Cancelled before reconstruction"] };
  if (!input || input.schema !== "automovie-recovery-curves-v1" || !Array.isArray(input.loft?.sections) || !Array.isArray(input.loft.intervals))
    return { schema, operator, status: "refused", diagnostics: ["A versioned saved cubic bundle with explicit interval incidence is required"] };
  try {
    options.onProgress?.("reconstruction", 0, 1);
    if (options.signal?.aborted)
      return { schema, operator, status: "cancelled", diagnostics: ["Cancelled before reconstruction"] };
    const value: ReturnType<typeof reconstructRecovery> = reconstructRecovery(input, { observeWork: options.observeWork });
    if (options.signal?.aborted)
      return { schema, operator, status: "cancelled", diagnostics: ["Cancelled before publication"] };
    options.onProgress?.("reconstruction", 1, 1);
    if (options.signal?.aborted)
      return { schema, operator, status: "cancelled", diagnostics: ["Cancelled before publication"] };
    const membership: IAutoMovieRecoveryDomainLedger = describeRecoveryDomains(input, value);
    const diagnostics: string[] = [...value.diagnostics, ...membership.diagnostics];
    let omitted: boolean = false;
    for (const field of ["topologyGaps", "unconsumedEvents"] as const) {
      const inventory: unknown = read(input, [field]);
      if (!Array.isArray(inventory)) {
        diagnostics.push(`Declared ${field} inventory is unavailable; coverage remains unknown`);
        omitted = true;
      } else if (inventory.length > 0) omitted = true;
    }
    for (const [ordinal, report] of input.reports.entries())
      for (const field of ["open", "isolatedContactsMm"] as const) {
        const inventory: unknown = read(report, [field]);
        if (!Array.isArray(inventory)) {
          diagnostics.push(`Section ${ordinal} ${field} inventory is unavailable; coverage remains unknown`);
          omitted = true;
        } else if (inventory.length > 0) omitted = true;
      }
    const coverage: unknown = read(input, ["coverage"]);
    const complete: unknown = read(coverage, ["complete"]);
    if (coverage !== undefined && typeof complete !== "boolean") {
      diagnostics.push("Declared coverage completion is unavailable; coverage remains unknown");
      omitted = true;
    }
    const partial: boolean = complete === false || omitted || membership.diagnostics.length > 0 || membership.unattributed.length > 0 || membership.members.some((member: IAutoMovieRecoveryDomainLedger["members"][number]): boolean => member.admitted !== true) || value.unresolved.length > 0 || value.tensorReports.some((report: (typeof value.tensorReports)[number]): boolean => !report.complete) || value.analyticReports.some((report: (typeof value.analyticReports)[number]): boolean => !report.admitted || !report.complete || !report.observationComplete || report.unrepresentedDomains.length > 0);
    return { schema, operator, status: partial ? "partial" : "complete", value: { ...value, membership }, diagnostics };
  } catch (failure: unknown) {
    return { schema, operator, status: options.signal?.aborted ? "cancelled" : "failed", diagnostics: [failure instanceof Error ? failure.message : String(failure)] };
  }
}
