import {
  AUTOMOVIE_AUTHORED_DOCUMENT_LAYERS,
  createAutoMovieAuthoredFileClaims,
} from "@automovie/evidence";
import { TestValidator } from "@nestia/e2e";
import type { ITtscEvidenceGraphReference } from "@ttsc/evidence";

/**
 *
 * File parentage belongs to narrative and delivery documents; technical design
 * consumes foundations through its H2 owners without a duplicate file duty.
 *
 * Scenarios:
 * 1. Every authored role receives the same inherited targets; only narrative and
 *    delivery roles produce a file claim.
 * 2. Enabled and disabled claims retain the supplied population and references.
 * 3. An empty reference population produces no file claim for any role.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `createAutoMovieAuthoredFileClaims` for every authored layer, enabled and disabled, with two parent references and with none, and asserts the claim count and each claim's type, root, symbol, files, disabled flag and projected references; it catches a design or foundation layer given a duplicate whole-file parent duty, a narrative or brief layer that loses it, a disabled flag inverted or ignored, a population replaced or reordered, and a claim emitted with no parent to answer.
 * @evidence contracts/testing.md#independent-expectations The four whole-document roles come from the documented split that narrative and delivery documents own file parentage while design consumes foundations through H2 owners; the expected claim carries the caller's own population and references with `requireReview` cleared, as the native projection documents, and the `uniqueEvidence` flag is expected to pass through untouched.
 * @evidence contracts/testing.md#distinguishing-cases Positive treatments, scripts, screenplays and briefs; negative settings, research and every design layer; enabled and disabled twins; boundary of an empty reference list for every layer; contract applicability per layer belongs to `test_evidence_authored_contract_applicability`, and claim lowering to native records to `test_evidence_native_claim_projection`.
 */
export const test_evidence_authored_file_parentage = (): void => {
  const population = ["design/one.md", "design/two.md"];
  const references: ITtscEvidenceGraphReference[] = [
    {
      type: "markdown",
      root: "docs",
      files: ["settings/**/*.md"],
      symbol: "h2",
      requireReview: true,
    },
    {
      type: "markdown",
      root: "docs",
      files: ["scripts/**/*.md"],
      symbol: "file",
      uniqueEvidence: true,
    },
  ];
  const wholeDocumentRoles = new Set([
    "treatments",
    "scripts",
    "screenplays",
    "briefs",
  ]);
  for (const layer of AUTOMOVIE_AUTHORED_DOCUMENT_LAYERS)
    for (const enabled of [false, true]) {
      const claims = createAutoMovieAuthoredFileClaims(
        layer,
        population,
        references,
        enabled,
      );
      TestValidator.equals(
        `${layer} file ownership`,
        claims.length,
        wholeDocumentRoles.has(layer) ? 1 : 0,
      );
      for (const claim of claims)
        TestValidator.equals(
          `${layer} inherited relationships`,
          {
            type: claim.type,
            root: claim.root,
            symbol: claim.symbol,
            files: claim.files,
            disabled: claim.disabled,
            reference: claim.reference,
          },
          {
            type: "markdown",
            root: "docs",
            symbol: "file",
            files: population,
            disabled: !enabled,
            reference: references.map((reference) => ({
              ...reference,
              requireReview: false,
            })),
          },
        );
      TestValidator.equals(
        `${layer} empty parents`,
        createAutoMovieAuthoredFileClaims(layer, population, [], enabled),
        [],
      );
    }
};
