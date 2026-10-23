import {
  EvidenceFileGlob,
  type IEvidenceCheckAnalysis,
  type IEvidenceClaim,
  type IEvidenceConfig,
  type IEvidenceDiagnostic,
  type IEvidenceGraphClaim,
  type IEvidenceGraphReference,
  type IEvidenceGraphResolution,
  type IEvidenceGraphReviewResolution,
  type IEvidenceReference,
} from "@wrtnlabs/evidence";

import type { IProductionClaimOwner } from "./IProductionClaimOwner";
import type { IProductionGateKey } from "./IProductionGateKey";
import type { IProductionPassValidation } from "./IProductionPassValidation";
import type { IProductionPassValidationScope } from "./IProductionPassValidationScope";
import { getProductionEvidenceConfigProps } from "./getProductionEvidenceConfigProps";
import { pendingNaturalnessTransfers } from "./internal/pendingNaturalnessTransfers";
import { passId } from "./passId";
import { resolveProductionPassValidationScope } from "./resolveProductionPassValidationScope";

// Only known policy findings can belong exclusively to a frozen downstream duty.
// Unknown codes and extraction/config/inventory findings fail closed.
const POLICY: Set<string> = new Set([
  "graph-missing-acknowledgement",
  "graph-checklist-missing",
  "graph-single-evidence-per-symbol",
  "graph-unique-evidence",
  "graph-duplicate-evidence",
  "graph-conflicting-acknowledgements",
  "graph-duplicate-exclusion",
  "graph-forbidden-exclusion",
  "graph-checklist-aggregate",
  "graph-missing-review",
  "graph-missing-review-fingerprint",
  "graph-stale-review",
  "graph-duplicate-review",
  "graph-orphan-review",
  "graph-review-kind",
  "graph-unhosted-checklist",
  "target-missing-file",
  "target-missing-member",
  "target-out-of-population",
]);

/** Classifies one full analysis without changing its report, graph, or exit status. */
export function classifyProductionPassDiagnostics(
  config: IEvidenceConfig,
  key: IProductionGateKey,
  analysis: IEvidenceCheckAnalysis,
): IProductionPassValidation {
  const scope: IProductionPassValidationScope =
    resolveProductionPassValidationScope(config, key, analysis);
  const result: IProductionPassValidation = {
    analysis,
    packageSuccess: analysis.report.success,
    scope,
    blockingDiagnostics: [],
    reviewRefreshDiagnostics: [],
    frozenDownstreamDiagnostics: [],
    rereadReady: false,
    approvalStructureReady: false,
    missingReviewClaims: [],
    pendingNaturalnessTransfers: pendingNaturalnessTransfers(
      getProductionEvidenceConfigProps(config).location,
      scope,
      analysis,
    ),
  };
  const required: Set<number> = new Set(scope.requiredClaimIndices);
  const current: string = passId(key);
  const inputs: Map<number | undefined, IEvidenceGraphClaim> = new Map(
    analysis.graphInput.claims.map(
      (
        claim: IEvidenceGraphClaim,
      ): [number | undefined, IEvidenceGraphClaim] => [claim.index, claim],
    ),
  );
  const signature: (diagnostic: IEvidenceDiagnostic) => string = (
    diagnostic: IEvidenceDiagnostic,
  ): string => JSON.stringify(diagnostic);
  const all: string[] = analysis.report.diagnostics
    .map(signature)
    .sort((left: string, right: string): 1 | -1 | 0 =>
      left < right ? -1 : left > right ? 1 : 0,
    );
  if (
    JSON.stringify(all) !==
    JSON.stringify(
      analysis.graph.diagnostics
        .map(signature)
        .sort((left: string, right: string): 1 | -1 | 0 =>
          left < right ? -1 : left > right ? 1 : 0,
        ),
    )
  )
    scope.issues.push(
      "The report does not preserve all original graph diagnostics.",
    );
  for (const diagnostic of analysis.report.diagnostics) {
    const owner: IProductionClaimOwner | undefined =
      diagnostic.claim === undefined
        ? undefined
        : scope.owners[diagnostic.claim];
    const input: IEvidenceGraphClaim | undefined =
      owner === undefined ? undefined : inputs.get(owner.index);
    const reference: IEvidenceGraphReference | undefined =
      diagnostic.reference === undefined
        ? undefined
        : input?.references.find(
            (reference: IEvidenceGraphReference): boolean =>
              reference.index === diagnostic.reference,
          );
    if (
      owner === undefined ||
      owner.kind === "support" ||
      input === undefined ||
      (diagnostic.reference !== undefined && reference === undefined)
    ) {
      result.blockingDiagnostics.push(diagnostic);
      continue;
    }
    // A stale review or changed bijection in the current review is a reason to
    // assign a complete reread, never evidence that the new review passed.
    const nonparticipatingIdentity: boolean =
      owner.kind === "review" &&
      [
        "check-non-participating-acknowledgement",
        "check-non-participating-review",
      ].includes(diagnostic.code) &&
      lineageTarget(config.claims[owner.index], diagnostic.target);
    const refresh: boolean =
      passId(owner) === current &&
      owner.kind === "review" &&
      (nonparticipatingIdentity ||
        (reference?.requireReview === true &&
          (diagnostic.code === "graph-stale-review" ||
            diagnostic.code === "graph-missing-acknowledgement" ||
            diagnostic.code === "target-missing-file" ||
            diagnostic.code === "target-missing-member" ||
            diagnostic.code === "target-out-of-population" ||
            (diagnostic.code === "graph-single-evidence-per-symbol" &&
              identityChanged(
                input.references.find(
                  (entry: IEvidenceGraphReference): boolean =>
                    entry.index === diagnostic.reference,
                )!,
              )))));
    if (refresh) result.reviewRefreshDiagnostics.push(diagnostic);
    else if (
      (!POLICY.has(diagnostic.code) && !nonparticipatingIdentity) ||
      required.has(owner.index)
    )
      result.blockingDiagnostics.push(diagnostic);
    else result.frozenDownstreamDiagnostics.push(diagnostic);
  }
  for (const kind of ["review", "verdict"] as const)
    if (
      !scope.owners.some(
        (owner: IProductionClaimOwner): boolean =>
          passId(owner) === current &&
          owner.kind === kind &&
          required.has(owner.index) &&
          (inputs.get(owner.index)?.unitIds.length ?? 0) > 0,
      )
    )
      result.missingReviewClaims.push(kind);
  // A current naturalness review must finish before promotion. A downstream
  // reader, however, cannot consume its parent's unpromoted working version.
  const upstreamPending: boolean = result.pendingNaturalnessTransfers.some(
    (transfer: {
      layer: "scripts" | "screenplay";
      file: string;
      reason: string;
    }): boolean => transfer.layer !== key.layer || key.pass !== "naturalness",
  );
  result.rereadReady =
    scope.issues.length === 0 &&
    result.blockingDiagnostics.length === 0 &&
    !upstreamPending;
  result.approvalStructureReady =
    result.rereadReady &&
    result.reviewRefreshDiagnostics.length === 0 &&
    result.missingReviewClaims.length === 0 &&
    result.pendingNaturalnessTransfers.length === 0;
  return result;
}

/** Only a well-formed old target inside this review's authored selector is a refresh reason. */
function lineageTarget(
  claim: IEvidenceClaim,
  target: string | undefined,
): boolean {
  if (target === undefined || target.endsWith("#")) return false;
  const file: string = target
    .split("#", 1)[0]
    .replaceAll("\\", "/")
    .replace(/^(?:\.\/)+/, "");
  if (!file || file.split("/").includes("..") || /[\0\r\n]/.test(file))
    return false;
  return (
    Array.isArray(claim.reference) ? claim.reference : [claim.reference]
  ).some(
    (reference: IEvidenceReference): boolean =>
      reference.type === "markdown" &&
      reference.requireReview === true &&
      new EvidenceFileGlob(reference.files).matches(file),
  );
}

function identityChanged(
  reference: IEvidenceCheckAnalysis["graphInput"]["claims"][number]["references"][number],
): boolean {
  const changed: (status: string) => boolean = (status: string): boolean =>
    ["missing-file", "missing-member", "out-of-population"].includes(status);
  return (
    reference.resolutions.some((entry: IEvidenceGraphResolution): boolean =>
      changed(entry.resolution.status),
    ) ||
    (reference.reviewResolutions ?? []).some(
      (entry: IEvidenceGraphReviewResolution): boolean =>
        changed(entry.resolution.status),
    )
  );
}
