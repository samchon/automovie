import type { IEvidenceConfig } from "@wrtnlabs/evidence";
import path from "node:path";

import { parseProductionCheckArgs } from "./internal/parseProductionCheckArgs";
import type { IProductionGateKey } from "./narrative/IProductionGateKey";
import type { IProductionPassValidation } from "./narrative/IProductionPassValidation";
import { analyzeProductionPass } from "./narrative/analyzeProductionPass";
import { getProductionEvidenceConfigProps } from "./narrative/getProductionEvidenceConfigProps";

/**
 * Evaluates the original narrative config and writes its structural JSON report.
 *
 * Return the resulting status as the command's exit code. Package failure and
 * incomplete approval structure return nonzero even when a reread is ready.
 * This command records no creative verdict and changes no authored files.
 *
 * @evidence contracts/common.md#principled-implementation Validates explicit flags, obtains the original factory owner's location and evaluates the full native graph once; the JSON preserves native diagnostics and separates reread readiness from structural completion.
 * @evidence contracts/common.md#clear-and-simple-design The package owns parsing/evaluation/reporting while the project's tiny entry supplies its exact config and arguments and assigns the returned process status.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No filtered report or synthetic approval replaces native failure; engineering-only and cloned configs are rejected by the same original-owner boundary.
 * @evidence contracts/common.md#meaningful-documentation The comment states output, status, creative limits and lack of authored writes; props state argument and config-file ownership.
 * @evidence contracts/performance.md#efficient-algorithms Performs one complete graph analysis and serializes its reported diagnostics; time and memory are dominated by selected file capture, extraction and graph validation, with one linear-size output string.
 * @evidence contracts/performance.md#reuse-equivalent-work The same returned analysis supplies every output field; no second evaluation or stale report is used.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Analysis and serialized output are local to the awaited command; weak snapshot ownership is released with that analysis. The caller owns process lifetime and the shared stdout stream.
 */
export async function runProductionCheck(props: {
  /** Original config returned by this package's narrative factory. */
  config: IEvidenceConfig;

  /** Command arguments after the executable and entry filename. */
  args: string[];

  /** Absolute authored config path; defaults to location/evidence.config.ts. */
  configFile?: string;
}): Promise<number> {
  const key: IProductionGateKey = parseProductionCheckArgs(props.args);
  const location: string = getProductionEvidenceConfigProps(
    props.config,
  ).location;
  const result: IProductionPassValidation = await analyzeProductionPass(
    props.config,
    props.configFile ?? path.join(location, "evidence.config.ts"),
    key,
  );
  process.stdout.write(
    `${JSON.stringify(
      {
        packageSuccess: result.packageSuccess,
        packageReport: result.analysis.report,
        requiredPasses: result.scope.requiredPasses,
        scopeIssues: result.scope.issues,
        blockingDiagnostics: result.blockingDiagnostics,
        reviewRefreshDiagnostics: result.reviewRefreshDiagnostics,
        frozenDownstreamDiagnostics: result.frozenDownstreamDiagnostics,
        missingReviewClaims: result.missingReviewClaims,
        pendingNaturalnessTransfers: result.pendingNaturalnessTransfers,
        rereadReady: result.rereadReady,
        approvalStructureReady: result.approvalStructureReady,
      },
      null,
      2,
    )}\n`,
  );
  return (
    result.analysis.report.exitCode || (result.approvalStructureReady ? 0 : 1)
  );
}
