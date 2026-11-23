import type {
  AutoMovieRecoveryCurveData,
  IAutoMovieRecoveryDomainLedger,
  IAutoMovieRecoveryOptions,
  IAutoMovieRecoveryReconstructedModel,
  IAutoMovieRecoveryReconstruction,
  IAutoMovieRecoveryResult,
  IAutoMovieRecoveryTensorFamiliesInput,
} from "@automovie/interface";

import { describeRecoveryDomains } from "../internal/describeRecoveryDomains";
import { readRecoveryMetadata as read } from "../internal/readRecoveryMetadata";
import { reconstructRecovery } from "../internal/reconstructRecovery";
import { restoreRecoveryCurveBasis } from "../internal/restoreRecoveryCurveBasis";

/**
 * Reconstruct saved cubic and domain coefficients without access to source geometry.
 * Hermite input is converted to the same Bernstein engine coefficients using its
 * saved phase widths; finite arithmetic may round handles.
 * The legacy operator is explicit so another triangulator is not substituted during
 * package migration. Local unsupported incidence remains a partial usable result;
 * strip quality diagnostics do not discard finite geometry or certify smoothness.
 */
export function reconstructAutoMovieRecoveryModel(
  input:
    | IAutoMovieRecoveryTensorFamiliesInput
    | AutoMovieRecoveryCurveData<
        IAutoMovieRecoveryTensorFamiliesInput,
        "hermite"
      >,
  options: IAutoMovieRecoveryOptions = {},
): IAutoMovieRecoveryResult<IAutoMovieRecoveryReconstructedModel> {
  const operator: IAutoMovieRecoveryResult<never>["operator"] =
    "legacy-contour-v1";
  let cancellationRequested: boolean = false;
  let probe: (() => boolean) | undefined;
  const cancelled: () => boolean = (): boolean => {
    const requested: boolean | undefined = probe?.();
    if (probe !== undefined && typeof requested !== "boolean")
      throw new Error(
        "Cancellation callback must return a boolean synchronously",
      );
    cancellationRequested = requested === true;
    return cancellationRequested;
  };
  try {
    probe = options?.cancelled;
    if (probe !== undefined && typeof probe !== "function")
      return {
        operator,
        status: "refused",
        diagnostics: ["Cancellation callback must be a function"],
      };

    if (cancelled())
      return {
        operator,
        status: "cancelled",
        diagnostics: ["Cancelled before reconstruction"],
      };
    if (
      !input ||
      !Array.isArray(input.loft?.sections) ||
      !Array.isArray(input.loft.intervals)
    )
      return {
        operator,
        status: "refused",
        diagnostics: [
          "A saved cubic bundle with explicit interval incidence is required",
        ],
      };

    const canonical: IAutoMovieRecoveryTensorFamiliesInput =
      restoreRecoveryCurveBasis(input);
    options.onProgress?.("reconstruction", 0, 1);
    if (cancelled())
      return {
        operator,
        status: "cancelled",
        diagnostics: ["Cancelled before reconstruction"],
      };
    const value: IAutoMovieRecoveryReconstruction = reconstructRecovery(
      canonical,
      { observeWork: options.observeWork },
    );
    if (cancelled())
      return {
        operator,
        status: "cancelled",
        diagnostics: ["Cancelled before publication"],
      };
    options.onProgress?.("reconstruction", 1, 1);
    if (cancelled())
      return {
        operator,
        status: "cancelled",
        diagnostics: ["Cancelled before publication"],
      };
    const membership: IAutoMovieRecoveryDomainLedger = describeRecoveryDomains(
      canonical,
      value,
    );
    const diagnostics: string[] = [
      ...value.diagnostics,
      ...membership.diagnostics,
    ];
    let omitted: boolean = false;
    for (const field of ["topologyGaps", "unconsumedEvents"] as const) {
      const inventory: unknown = read(input, [field]);
      if (!Array.isArray(inventory)) {
        diagnostics.push(
          `Declared ${field} inventory is unavailable; coverage remains unknown`,
        );
        omitted = true;
      } else if (inventory.length > 0) omitted = true;
    }
    for (const [ordinal, report] of canonical.reports.entries())
      for (const field of ["open", "isolatedContactsMm"] as const) {
        const inventory: unknown = read(report, [field]);
        if (!Array.isArray(inventory)) {
          diagnostics.push(
            `Section ${ordinal} ${field} inventory is unavailable; coverage remains unknown`,
          );
          omitted = true;
        } else if (inventory.length > 0) omitted = true;
      }
    const coverage: unknown = read(input, ["coverage"]);
    const complete: unknown = read(coverage, ["complete"]);
    if (coverage !== undefined && typeof complete !== "boolean") {
      diagnostics.push(
        "Declared coverage completion is unavailable; coverage remains unknown",
      );
      omitted = true;
    }
    const partial: boolean =
      complete === false ||
      omitted ||
      membership.diagnostics.length > 0 ||
      membership.unattributed.length > 0 ||
      membership.members.some(
        (member: IAutoMovieRecoveryDomainLedger["members"][number]): boolean =>
          member.admitted !== true,
      ) ||
      value.unresolved.length > 0 ||
      value.tensorReports.some(
        (report: (typeof value.tensorReports)[number]): boolean =>
          !report.complete,
      ) ||
      value.analyticReports.some(
        (report: (typeof value.analyticReports)[number]): boolean =>
          !report.admitted ||
          !report.complete ||
          !report.observationComplete ||
          report.unrepresentedDomains.length > 0,
      );
    return {
      operator,
      status: partial ? "partial" : "complete",
      value: { ...value, membership },
      diagnostics,
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
