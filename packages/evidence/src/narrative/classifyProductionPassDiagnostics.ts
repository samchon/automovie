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
import { pendingNaturalnessTransfers } from "./internal/pendingNaturalnessTransfers";
import { passId } from "./passId";
import { resolveProductionPassValidationScope } from "./resolveProductionPassValidationScope";

/**
 * Known policy findings eligible to belong exclusively to a frozen downstream duty.
 *
 * Unknown codes and extraction, configuration and inventory failures stay blocking.
 */
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

/**
 * Reclassifies an analyzeProductionPass snapshot without filesystem reads.
 *
 * Requires its original factory config and bound native analysis. A different
 * config or an unbound native evaluation throws; report and graph stay intact.
 *
 * @evidence contracts/common.md#principled-implementation The scope prerequisite closure and original owner indices partition native diagnostics into blocking, current-review refresh and exclusively frozen downstream policy findings; unknown codes fail closed, and complete graph/report diagnostic multisets must agree.
 * @evidence contracts/common.md#clear-and-simple-design Classification is a snapshot-only consumer; it derives reread and approval-structure readiness separately from package success and independent creative approval.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The explicit policy-code allowlist permits only known downstream duties to freeze; unsupported findings, missing ownership and incomplete review inputs remain blocking instead of being hidden or rewritten.
 * @evidence contracts/common.md#meaningful-documentation The comment states original config/bound analysis requirements, snapshot-only behavior and intact native report/graph; the result type documents distinct readiness and pending-transfer meanings.
 * @evidence contracts/performance.md#efficient-algorithms Diagnostics are serialized and sorted for multiset comparison, costing O(d log d) string comparisons and serialized diagnostic bytes; per-diagnostic reference lookup and identity checks add reference/resolution scans. Full scope resolution and captured-byte transfer comparison may dominate. Result partitions and graph-input maps grow with the analyzed graph.
 * @evidence contracts/performance.md#reuse-equivalent-work The scope and indexed input claims are reused within classification; saved aliases and bytes avoid repeated capture, while each call recomputes findings from supplied current objects rather than sharing effectful work or stale mutable results.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Result arrays hold references to original diagnostics and analysis rather than rewritten copies; temporary maps/signature arrays expire after return. Weak provenance retains path metadata only with its analysis, and classification opens no handle or task.
 */
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
    pendingNaturalnessTransfers: pendingNaturalnessTransfers(scope, analysis),
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

/**
 * Only a well-formed old target inside this review's authored selector is a refresh reason.
 *
 * Principled implementation: A candidate old review target must have a nonempty safe file spelling and match one actual review-required Markdown selector; this limits refresh classification to the review's authored population.
 * Clear and simple design: The private predicate owns old-target admission, while scope and native diagnostic logic own all other readiness checks.
 * Prohibited implementation shortcuts: Parent traversal, control characters and empty anchors are rejected for every candidate; no arbitrary missing target is relabeled as a review refresh.
 * Meaningful documentation: The comment states well-formed target and authored-selector conditions; the caller uses true only as one condition for current-review refresh.
 * Efficient algorithms: Path normalization/splitting scans target characters; each candidate Markdown review reference constructs a glob and tests it until a match, with work dependent on selector count/length and native glob evaluation.
 * Reuse equivalent work: The predicate coordinates no cross-request cache; a new glob uses the actual selector at the current invocation, so mutable claim references cannot reuse an obsolete compiled selection.
 * Bound retention and release resources: Only temporary target strings, reference arrays and glob objects are owned; no object, descriptor or task is retained after the check.
 */
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

/**
 * Detects whether captured target resolution lost its former file/member population identity.
 *
 * Principled implementation: Known missing-file, missing-member and out-of-population statuses in captured evidence/review resolutions identify changed review targets, without interpreting their content as approval.
 * Clear and simple design: The helper keeps one target-identity status predicate shared by ordinary and review resolution arrays.
 * Prohibited implementation shortcuts: Only the three explicit identity-loss statuses are recognized; unrelated ambiguity or extraction failures are not transformed into a refresh reason.
 * Meaningful documentation: The comment states captured target identity loss; the caller additionally requires the native single-evidence diagnostic and current review context.
 * Efficient algorithms: The two short-circuit some scans cost O(r) in total captured resolutions in the worst case and allocate only the fixed status-list predicate input.
 * Reuse equivalent work: This pure snapshot predicate coordinates no requests or reusable effects; it reads the supplied captured arrays directly.
 * Bound retention and release resources: The helper retains no captured resolution, handle or task beyond the call.
 */
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
