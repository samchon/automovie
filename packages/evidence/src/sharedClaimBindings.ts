import type { AutoMovieAuthoredDocumentLayer } from "./AutoMovieAuthoredDocumentLayer";
import type { AutoMovieEvidenceStage } from "./AutoMovieEvidenceStage";
import type { IAutoMovieEvidenceBranchClaim } from "./IAutoMovieEvidenceBranchClaim";
import type { IAutoMovieEvidenceConfigProps } from "./IAutoMovieEvidenceConfigProps";
import type { ITtscEvidenceGraphClaim, ITtscEvidenceGraphMarkdownReference, ITtscEvidenceGraphReference } from "@ttsc/evidence";


import { CONTRACTS } from "./CONTRACTS";
import { CONTRACT_INDEX } from "./CONTRACT_INDEX";
import { DOCS } from "./DOCS";
import { MARKDOWN } from "./MARKDOWN";
import { authoredPopulationFiles } from "./authoredPopulationFiles";
import { branchClaims } from "./branchClaims";
import { createAutoMovieAuthoredDiscoveryReferences } from "./createAutoMovieAuthoredDiscoveryReferences";
import { createAutoMovieAuthoredFileClaims } from "./createAutoMovieAuthoredFileClaims";
import { createAutoMovieAuthoredPrincipleReferences } from "./createAutoMovieAuthoredPrincipleReferences";
import { createAutoMoviePopulationAccountClaims } from "./createAutoMoviePopulationAccountClaims";
import { createAutoMovieScreenplayNaturalnessClaims } from "./createAutoMovieScreenplayNaturalnessClaims";
import { populationObligations } from "./populationObligations";
import { referencesPerFile } from "./referencesPerFile";
import { requiresEvidence } from "./requiresEvidence";
import { selectAutoMovieCompletedDesignFoundations } from "./selectAutoMovieCompletedDesignFoundations";
import { sharedDocsRoot } from "./sharedDocsRoot";
import { sourceClaims } from "./sourceClaims";
import { upstreamReference } from "./upstreamReference";

/**
 * Makes one active layer's work-specific contract answer its discovery duties.
 *
 * A retained result is stated by the flat `docs/contracts/*.md` file that adopts the rule. A completed search with no retained result is recorded only by `docs/contracts/index.md`, so every negative a reviewer must audit is in one place. Authored settings, design, narrative, and brief units describe the work and never testify that its contract audit happened.
 */
function discoveryClaim(graph: IAutoMovieEvidenceConfigProps, layer: AutoMovieAuthoredDocumentLayer): ITtscEvidenceGraphClaim {
  return ({
  name: `the ${layer} work-specific contract accounts for its open-world discovery duties`,
  type: "markdown",
  root: DOCS,
  files: [`${CONTRACTS}/*.md`],
  evidenceExcludeCarriers: [CONTRACT_INDEX],
  symbol: "file",
  disabled: graph[layer] === "disabled",
  reference: createAutoMovieAuthoredDiscoveryReferences(graph.kind, layer),
});
}

function designFoundations(graph: IAutoMovieEvidenceConfigProps, host: AutoMovieAuthoredDocumentLayer, review: boolean): ITtscEvidenceGraphReference[] {
  return selectAutoMovieCompletedDesignFoundations(graph, host).flatMap((design: "briefs" | "instances" | "maps" | "materials" | "models" | "motions" | "research" | "screenplays" | "scripts" | "settings" | "spaces" | "systems" | "treatments"): ITtscEvidenceGraphReference[] =>
    referencesPerFile(graph, design, "h2", review),
  );
}

function lineage(graph: IAutoMovieEvidenceConfigProps, layer: "scripts" | "treatments", symbol: "file" | "h2" | "h3" | "h4", review: boolean): ITtscEvidenceGraphReference {
  return ({
  type: "markdown",
  root: DOCS,
  files: authoredPopulationFiles(graph, layer),
  symbol,
  noEvidenceExclude: true,
  uniqueEvidence: true,
  singleEvidencePerSymbol: true,
  requireReview: review,
});
}

function coverage(graph: IAutoMovieEvidenceConfigProps, review: boolean): ITtscEvidenceGraphReference {
  return ({
  type: "markdown",
  root: DOCS,
  files: authoredPopulationFiles(graph, "treatments"),
  symbol: "h2",
  noEvidenceExclude: true,
  requireReview: review,
});
}

function authoredClaims(graph: IAutoMovieEvidenceConfigProps): IAutoMovieEvidenceBranchClaim[] {
  const shared: string = sharedDocsRoot(graph.location);
  const claims: IAutoMovieEvidenceBranchClaim[] = [];
  for (const name of Object.keys(MARKDOWN) as AutoMovieAuthoredDocumentLayer[]) {
    const stage: AutoMovieEvidenceStage = graph[name];
    const review: boolean = false;
    claims.push(...branchClaims(name, discoveryClaim(graph, name)));
    if (MARKDOWN[name].obligation)
      claims.push(
        ...branchClaims(
          name,
          ...createAutoMoviePopulationAccountClaims({
layer: name,
populationFiles: authoredPopulationFiles(graph, name),
obligationFiles: populationObligations(graph, name),
enabled: requiresEvidence(stage)
}),
        ),
      );
    const principles: ITtscEvidenceGraphMarkdownReference[] = createAutoMovieAuthoredPrincipleReferences(graph.kind, name);
    const fileParents: ITtscEvidenceGraphReference[] = [];
    if (!["settings", "research"].includes(name))
      fileParents.push(...referencesPerFile(graph, "settings", "h2", review));
    fileParents.push(...designFoundations(graph, name, review));
    if (name === "scripts") fileParents.push(coverage(graph, review));
    if (name === "screenplays")
      fileParents.push(
        lineage(graph, "scripts", "file", review),
        coverage(graph, review),
      );
    claims.push(
      ...branchClaims(
        name,
        ...createAutoMovieAuthoredFileClaims(
          name,
          authoredPopulationFiles(graph, name),
          fileParents,
          requiresEvidence(stage),
        ),
      ),
    );
    for (const symbol of MARKDOWN[name].headings) {
      const references: ITtscEvidenceGraphReference[] = [...principles];
      if (!["settings", "research"].includes(name))
        references.push(upstreamReference(shared, `${name}.md`, review));
      if (!["settings", "research"].includes(name))
        references.push(...referencesPerFile(graph, "settings", "h2", review));
      references.push(...designFoundations(graph, name, review));
      if (name === "scripts") references.push(coverage(graph, review));
      if (name === "screenplays")
        references.push(
          lineage(graph, "scripts", `h${symbol}` as "h2" | "h3" | "h4", review),
          coverage(graph, review),
        );
      claims.push(
        ...branchClaims(name, {
          name:
            symbol === 2
              ? `${name} H2 units answer their principle checklists and account for inherited work`
              : `${name} H${symbol} units answer their principle checklists and account for inherited work`,
          type: "markdown",
          root: DOCS,
          files: authoredPopulationFiles(graph, name),
          symbol: `h${symbol}` as "h2" | "h3" | "h4",
          disabled: !requiresEvidence(stage),
          reference: references,
        }),
      );
    }
  }

  claims.push(
    ...branchClaims("settings", {
      name: "reviewed research records support the settings decisions that interpret them",
      type: "markdown",
      root: DOCS,
      files: ["settings/**/*.md"],
      symbol: "h2",
      disabled:
        !requiresEvidence(graph.research) || !requiresEvidence(graph.settings),
      reference: {
        type: "markdown",
        root: DOCS,
        files: ["research/**/*.md"],
        symbol: "h2",
        noEvidenceExclude: true,
        requireReview: false,
      },
    }),
  );
  return claims;
}

/**
 * Concatenate authored, screenplay revision and source claims while preserving their owning branch and policy order.
 *
 * @evidence contracts/common.md#principled-implementation Concatenate authored, screenplay revision and source claims while preserving their owning branch and policy order.
 * @evidence contracts/common.md#clear-and-simple-design Both graph publication and route manifests share this assembly after independent admission; foundation references synchronously walk current physical populations through referencesPerFile.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Discovery remains on adopted local contracts or the negative ledger; source cardinality and no-exclusion duties remain explicit.
 * @evidence contracts/common.md#meaningful-documentation Returned records include disabled branches; review freshness is false in current assembled references.
 * @evidence contracts/performance.md#efficient-algorithms Supported branches and depths are fixed, but foundation references can walk physical populations repeatedly; output grows with selected files.
 * @evidence contracts/performance.md#reuse-equivalent-work Canonical applicability and population builders are reused, with no cross-call filesystem memoization.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fresh claims and binding arrays are caller-owned; some selector arrays are shared within a result and no factory task is retained.
 */
export function sharedClaimBindings(graph: IAutoMovieEvidenceConfigProps): IAutoMovieEvidenceBranchClaim[] {
  return [
  ...authoredClaims(graph),
  ...createAutoMovieScreenplayNaturalnessClaims(graph),
  ...sourceClaims(graph),
];
}
