import type { ITtscEvidenceGraphReference } from "@ttsc/evidence";
import { isDeepStrictEqual } from "node:util";
import { AUTOMOVIE_AUTHORED_DOCUMENT_LAYERS } from "./AUTOMOVIE_AUTHORED_DOCUMENT_LAYERS";
import type { IAutoMovieEvidenceConfigProps } from "./IAutoMovieEvidenceConfigProps";
import type { AutoMovieProductionContractClaim } from "./AutoMovieProductionContractClaim";
import { createAutoMovieProductionObligationClaim } from "./createAutoMovieProductionObligationClaim";
import { createAutoMovieProductionPrincipleClaim } from "./createAutoMovieProductionPrincipleClaim";


/**
 * Refuses a local binding whose native claim disagrees with its typed owner.
 *
 * Principle and account policy are reconstructed through their public factories so a caller cannot retain admission metadata while narrowing or disabling its duty, including through native claim-level severity. Native claims with no AutoMovie binding remain additive native claims.
 *
 * @evidence contracts/common.md#principled-implementation Binding layer, stage, pass, scope and disposition must agree with the graph, then canonical factories reconstruct principle or obligation references for exact structural comparison.
 * @evidence contracts/common.md#clear-and-simple-design Typed AutoMovie ownership is validated before native projection; unbound additive native claims remain outside this product-specific policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A caller cannot retain admission metadata while weakening severity, targets or host population; malformed bound declarations refuse rather than being rewritten.
 * @evidence contracts/common.md#meaningful-documentation The comment states canonical reconstruction and native severity protection; all refusal messages name the conflicting declaration.
 * @evidence contracts/performance.md#efficient-algorithms For C claims and R references, traversal and structural equality scan their complete fields, with one small canonical factory result per bound claim.
 * @evidence contracts/performance.md#reuse-equivalent-work Public factories serve both authoring and validation, reusing policy rather than a separate expected-field implementation; declarations are revalidated every call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only temporary reconstructed records and comparisons are retained; the caller keeps its graph unchanged and no filesystem resource is acquired.
 */
export function validateAutoMovieLocalContractClaims(
  graph: IAutoMovieEvidenceConfigProps,
): void {
  for (const raw of graph.claims ?? []) {
    const claim: Partial<AutoMovieProductionContractClaim> = raw as Partial<AutoMovieProductionContractClaim>;
    if (claim.autoMovieBinding === undefined) continue;
    const binding: AutoMovieProductionContractClaim["autoMovieBinding"] = claim.autoMovieBinding;
    if (
      raw.type !== "markdown" ||
      binding === null ||
      typeof binding !== "object" ||
      !(AUTOMOVIE_AUTHORED_DOCUMENT_LAYERS as readonly unknown[]).includes(
        binding.layer,
      ) ||
      (binding.pass !== "construction" && binding.pass !== "naturalness") ||
      binding.stage !==
        (binding.pass === "naturalness"
          ? graph.naturalness.screenplays
          : graph[binding.layer]) ||
      !isDeepStrictEqual(binding.populationScope, graph.populationScope) ||
      (binding.disposition !== "binding" &&
        binding.disposition !== "inapplicable") ||
      (raw.disabled === true) !==
        (binding.stage === "disabled" ||
          binding.stage === "draft" ||
          binding.disposition === "inapplicable") ||
      (binding.disposition === "inapplicable" &&
        binding.populationScope?.mode !== "first-pilot") ||
      (binding.pass === "naturalness" && binding.layer !== "screenplays")
    )
      throw new Error(
        `Production-local claim ${JSON.stringify(raw.name)} does not match its declared layer, stage, population scope, or disposition.`,
      );
    const references: ITtscEvidenceGraphReference[] = Array.isArray(raw.reference)
      ? raw.reference
      : [raw.reference];
    if (binding.account === undefined) {
      const first: ITtscEvidenceGraphReference = references[0];
      if (first?.type !== "markdown")
        throw new Error(
          `Production-local principle ${JSON.stringify(raw.name)} requires a nonempty Markdown contract reference inventory.`,
        );
      const documents: string[] = references.map((reference: ITtscEvidenceGraphReference) : string => {
        if (reference.type !== "markdown" || reference.files.length !== 1)
          throw new Error(
            `Production-local principle ${JSON.stringify(raw.name)} requires one contract document per Markdown reference.`,
          );
        return reference.files[0]!;
      });
      const expected: AutoMovieProductionContractClaim = createAutoMovieProductionPrincipleClaim({
        name: raw.name ?? "",
        document: documents,
        documentRoot: first.root,
        files: raw.files,
        symbol: raw.symbol,
        layer: binding.layer,
        pass: binding.pass,
        stage: binding.stage,
        populationScope: binding.populationScope,
        inapplicable: binding.disposition === "inapplicable",
      });
      if (
        raw.severity !== expected.severity ||
        raw.root !== expected.root ||
        !isDeepStrictEqual(references, expected.reference)
      )
        throw new Error(
          `Production-local principle ${JSON.stringify(raw.name)} must retain its canonical claim severity, authored heading hosts, and complete no-exclusion H2 checklist references without companion-review requirements.`,
        );
      continue;
    }
    const obligation: ITtscEvidenceGraphReference = references[0];
    if (obligation?.type !== "markdown" || obligation.files.length !== 1)
      throw new Error(
        `Production-local account ${binding.account} requires one obligation document reference.`,
      );
    const expected: AutoMovieProductionContractClaim = createAutoMovieProductionObligationClaim({
      name: raw.name ?? "",
      account: binding.account,
      document: obligation.files[0]!,
      documentRoot: obligation.root,
      layer: binding.layer,
      stage: binding.stage,
      pass: binding.pass,
      populationScope: binding.populationScope,
      inapplicable: binding.disposition === "inapplicable",
    });
    if (
      !isDeepStrictEqual(
        {
          severity: raw.severity,
          root: raw.root,
          files: raw.files,
          symbol: raw.symbol,
          reference: raw.reference,
        },
        {
          severity: expected.severity,
          root: expected.root,
          files: expected.files,
          symbol: expected.symbol,
          reference: expected.reference,
        },
      )
    )
      throw new Error(
        `Production-local account ${binding.account} must retain its canonical claim severity, obligation reference, and complete authored H2 host population.`,
      );
  }
}
