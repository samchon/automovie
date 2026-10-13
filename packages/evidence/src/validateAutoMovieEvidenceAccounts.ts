import type { AutoMovieAuthoredDocumentLayer } from "./AutoMovieAuthoredDocumentLayer";
import type { AutoMovieEvidenceStage } from "./AutoMovieEvidenceStage";
import type { AutoMoviePopulationScope } from "./AutoMoviePopulationScope";
import type { AutoMovieProductionContractClaim } from "./AutoMovieProductionContractClaim";
import type { AutoMovieProductionContractLayer } from "./AutoMovieProductionContractLayer";
import type { AutoMovieProductionContractPass } from "./AutoMovieProductionContractPass";
import type { IAutoMovieEvidenceConfigProps } from "./IAutoMovieEvidenceConfigProps";
import type { ITtscEvidenceGraphMarkdownReference } from "@ttsc/evidence";
import { DOCS } from "./DOCS";
import { MARKDOWN } from "./MARKDOWN";
import { createAutoMovieAuthoredPopulationFiles } from "./createAutoMovieAuthoredPopulationFiles";
import { createAutoMoviePopulationAccountClaims } from "./createAutoMoviePopulationAccountClaims";
import { populationObligations } from "./populationObligations";
import { requiresEvidence } from "./requiresEvidence";
import { validateAutoMoviePopulationAccountHosts } from "./validateAutoMoviePopulationAccountHosts";

/**
 * Checks the declared shared and local account population through supplied reads.
 *
 * The graph factory supplies its physical file walker and Markdown H2 reader; pure callers can supply the same boundary facts without creating a project.
 *
 * @evidence contracts/common.md#principled-implementation Derive all shared and admitted local aggregate addresses, then validate resident account hosts through supplied boundary reads.
 * @evidence contracts/common.md#clear-and-simple-design Physical walking stays with the graph factory while this function builds account declarations for the common host gate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The brief and library story-subject account is a declared supplemental duty; local binding metadata is assumed already reconstructed by admission.
 * @evidence contracts/common.md#meaningful-documentation Residents are docs-relative while readH2Count receives project-relative target paths; missing reads remain undefined.
 * @evidence contracts/performance.md#efficient-algorithms Work follows fixed authored branches plus local claims, selected obligations and delegated resident or H2 validation.
 * @evidence contracts/performance.md#reuse-equivalent-work Canonical account constructors are reused; supplied reads remain synchronous and are not cached here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary account arrays are call-local and callbacks remain caller-owned; the function retains no filesystem handle.
 */
export function validateAutoMovieEvidenceAccounts(graph: IAutoMovieEvidenceConfigProps, input: {
    /** Docs-relative physical account files discovered by the population owner. */
    residents: readonly string[];
    /** Synchronous target read using a project-relative path; undefined means missing. */
    readH2Count: (projectRelative: string) => number | undefined;
  }): void {
  const accounts: Parameters<
    typeof validateAutoMoviePopulationAccountHosts
  >[0]["accounts"][number][] = [];
  for (const layer of Object.keys(MARKDOWN) as AutoMovieAuthoredDocumentLayer[]) {
    const claims: ReturnType<typeof createAutoMoviePopulationAccountClaims> = createAutoMoviePopulationAccountClaims({
layer,
populationFiles: createAutoMovieAuthoredPopulationFiles(
        layer,
        graph[layer] === "disabled"
          ? { mode: "complete-production" }
          : graph.populationScope,
      ),
obligationFiles: populationObligations(graph, layer),
enabled: requiresEvidence(graph[layer])
});
    for (const claim of claims) {
      const obligation: ITtscEvidenceGraphMarkdownReference = claim.reference[0];
      accounts.push({
        layer,
        stage: graph[layer],
        account: claim.files[0]!,
        target: `${DOCS}/${obligation.files[0]!}`,
        enabled: claim.disabled !== true,
      });
    }
  }
  for (const raw of graph.claims ?? []) {
    const claim: Partial<AutoMovieProductionContractClaim> = raw as Partial<AutoMovieProductionContractClaim>;
    const binding: { layer: AutoMovieProductionContractLayer; pass: AutoMovieProductionContractPass; populationScope: AutoMoviePopulationScope; stage: AutoMovieEvidenceStage; disposition: "binding" | "inapplicable"; account?: string; } | undefined = claim.autoMovieBinding;
    if (binding?.account === undefined) continue;
    // Declaration validation has already reconstructed this obligation reference.
    const reference: ITtscEvidenceGraphMarkdownReference = (
      raw.reference as ITtscEvidenceGraphMarkdownReference[]
    )[0]!;
    accounts.push({
      layer: binding.layer,
      stage: binding.stage,
      account: binding.account,
      target: `${reference.root!}/${reference.files[0]!}`,
      enabled: raw.disabled !== true,
    });
  }
  validateAutoMoviePopulationAccountHosts({
    accounts,
    supplemental:
      graph.kind === "film"
        ? []
        : [
            {
              file: "accounts/settings/story-subjects.md",
              stage: graph.settings,
            },
          ],
    ...input,
  });
}
