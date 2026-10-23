import path from "node:path";

import config from "../evidence.config";
import type { AuthoredLayer } from "./AuthoredLayer";
import type { IProductionPassValidation } from "./IProductionPassValidation";
import type { ProductionGatePass } from "./ProductionGatePass";
import { analyzeProductionPass } from "./analyzeProductionPass";
import { getProductionEvidenceConfigProps } from "./getProductionEvidenceConfigProps";

/** Checks the original production config without issuing a creative approval. */
async function main(): Promise<void> {
  const args: string[] = process.argv
    .slice(2)
    .filter((value: string): boolean => value !== "--");
  const layer: string | undefined = args[args.indexOf("--layer") + 1];
  const pass: string | undefined = args[args.indexOf("--pass") + 1];
  if (
    args.length !== 4 ||
    args.filter((value: string): boolean => value === "--layer").length !== 1 ||
    args.filter((value: string): boolean => value === "--pass").length !== 1 ||
    !["settings", "treatments", "scripts", "screenplay"].includes(
      layer ?? "",
    ) ||
    !["construction", "naturalness"].includes(pass ?? "")
  )
    throw new Error(
      "Usage: npm run production:check -- --layer <settings|treatments|scripts|screenplay> --pass <construction|naturalness>",
    );

  const location: string = getProductionEvidenceConfigProps(config).location;
  const result: IProductionPassValidation = await analyzeProductionPass(
    config,
    path.join(location, "evidence.config.ts"),
    { layer: layer as AuthoredLayer, pass: pass as ProductionGatePass },
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
  process.exitCode =
    result.analysis.report.exitCode || (result.approvalStructureReady ? 0 : 1);
}

await main();
