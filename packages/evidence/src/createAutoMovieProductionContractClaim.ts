import type { AutoMovieProductionContractClaim } from "./AutoMovieProductionContractClaim";
import type { AutoMovieProductionContractPass } from "./AutoMovieProductionContractPass";
import type { IAutoMovieProductionContractClaimProps } from "./IAutoMovieProductionContractClaimProps";
import { AUTOMOVIE_AUTHORED_DOCUMENT_LAYERS } from "./AUTOMOVIE_AUTHORED_DOCUMENT_LAYERS";
import { requirePositivePopulation } from "./requirePositivePopulation";
import { validateAutoMovieProductionContractHosts } from "./validateAutoMovieProductionContractHosts";

/**
 * Builds one validated local Markdown claim in its selected cardinality.
 *
 * @evidence contracts/common.md#principled-implementation Validate stage, authored pass, scoped host selectors and flat contract paths before constructing a local native Markdown claim.
 * @evidence contracts/common.md#clear-and-simple-design Principles and obligations share this constructor while their public entry points retain distinct coverage cardinality.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Inapplicable is restricted to first-pilot declarations; exclusions cannot discharge target duties and no review receipt is fabricated.
 * @evidence contracts/common.md#meaningful-documentation The binding records layer, pass, stage and scope for later admission; draft or disabled claims remain declared but inactive.
 * @evidence contracts/performance.md#efficient-algorithms Host and document validation is linear in selector lengths; one reference is allocated per contract document.
 * @evidence contracts/performance.md#reuse-equivalent-work The admitted files and binding metadata are reused in the returned record; changed declarations are validated anew.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only caller-owned claim records and arrays escape; no file reads or retained graph cache are owned here.
 */
export function createAutoMovieProductionContractClaim(
  props: IAutoMovieProductionContractClaimProps,
  checklist: boolean,
): AutoMovieProductionContractClaim {
  const pass: AutoMovieProductionContractPass = props.pass ?? "construction";
  const name: string = props.name.trim();
  if (name.length === 0)
    throw new Error("A production-local contract claim requires a name.");
  if (
    !(AUTOMOVIE_AUTHORED_DOCUMENT_LAYERS as readonly unknown[]).includes(
      props.layer,
    )
  )
    throw new Error(
      `A production-local contract claim has unsupported layer ${String(props.layer)}.`,
    );

  const files: string[] = [...props.files];
  validateAutoMovieProductionContractHosts({
    root: "docs",
    files,
    layer: props.layer,
    pass,
  });

  const documents: string[] = Array.isArray(props.document)
    ? [...props.document]
    : [props.document];
  requirePositivePopulation(documents, "contract");
  for (const document of documents)
    validateContractPath(props.documentRoot, document);

  if (
    !(["disabled", "draft", "evidence", "review"] as const).includes(
      props.stage,
    )
  )
    throw new Error(
      `A production-local contract claim has unsupported host stage ${JSON.stringify(props.stage)}.`,
    );
  if (
    props.inapplicable === true &&
    props.populationScope.mode !== "first-pilot"
  )
    throw new Error(
      "A production-local contract claim may be inapplicable only to a first-pilot population.",
    );
  if (pass === "naturalness" && props.layer !== "screenplays")
    throw new Error(
      "Production-local naturalness principles may select only final screenplay hosts.",
    );

  return {
    name,
    type: "markdown",
    root: "docs",
    files,
    symbol: props.symbol,
    disabled:
      props.stage === "disabled" ||
      props.stage === "draft" ||
      props.inapplicable === true,
    autoMovieBinding: {
      layer: props.layer,
      pass,
      populationScope: props.populationScope,
      stage: props.stage,
      disposition: props.inapplicable === true ? "inapplicable" : "binding",
    },
    reference: documents.map((document: string): { noEvidenceExclude: true; requireReview: false; checklist?: true | undefined; type: "markdown"; root: string; files: string[]; symbol: "h2"; } => ({
      type: "markdown",
      root: props.documentRoot ?? "docs",
      files: [document],
      symbol: "h2",
      ...(checklist ? { checklist: true } : {}),
      noEvidenceExclude: true,
      requireReview: false,
    })),
  };
}

/** Refuse local contract selectors that do not name one flat target document. */
function validateContractPath(
  root: string | undefined,
  document: string,
): void {
  const raw: string = `${root ?? "docs"}/${document}`;
  const resolved: string = raw.replaceAll("\\", "/");
  if (
    resolved !== raw ||
    resolved.startsWith("/") ||
    /^[A-Za-z]:/u.test(resolved) ||
    resolved
      .split("/")
      .some((part: string): boolean => part === "" || part === "." || part === "..") ||
    !/^docs\/contracts\/[A-Za-z0-9][A-Za-z0-9._-]*\.md$/u.test(resolved) ||
    resolved.endsWith("/index.md")
  )
    throw new Error(
      `A production-local contract claim requires one flat docs/contracts/*.md target, not ${JSON.stringify(resolved)}.`,
    );
}
