import type { ITtscEvidenceGraphClaim, ITtscEvidenceGraphMarkdownReference } from "@ttsc/evidence";


/**
 * Builds ordinary obligation coverage over authored and aggregate owners.
 *
 * Callers validate the shared or production-local path declaration. Each target needs positive evidence from a relevant host in the selected layer. The aggregate account is an available host for a population-wide conclusion.
 *
 * @evidence contracts/common.md#principled-implementation One aggregate account and its authored H2 population collectively cover an obligation's H2 targets.
 * @evidence contracts/common.md#clear-and-simple-design The constructor is shared by required resident obligations and production-local obligation declarations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts noEvidenceExclude remains true and requireReview is false; path validation is owned by the shared or local caller.
 * @evidence contracts/common.md#meaningful-documentation The account is a docs-relative optional aggregate host; disabled follows enabled and does not change cardinality.
 * @evidence contracts/performance.md#efficient-algorithms Copying population selectors is linear in their count; one claim and one reference are allocated.
 * @evidence contracts/performance.md#reuse-equivalent-work The single reference object is reused within the returned claim, without memoizing caller-owned selector arrays.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the fresh claim, reference and files arrays; the constructor opens no files and retains no population.
 */
export function createAutoMoviePopulationAccountClaim(props: {
  /** Diagnostic identity of this collective obligation. */
  name: string;

  /** Docs-relative aggregate host address placed before authored selectors. */
  account: string;

  /** One target document path resolved below documentRoot. */
  document: string;

  /** Native root owning the obligation target document. */
  documentRoot: string;

  /** Docs-relative authored H2 selector population. */
  populationFiles: readonly string[];

  /** Whether this declared collective claim currently enforces coverage. */
  enabled: boolean;
}): Extract<ITtscEvidenceGraphClaim, { type: "markdown" }> & {
  reference: [ITtscEvidenceGraphMarkdownReference];
} {
  const obligation: ITtscEvidenceGraphMarkdownReference = {
    type: "markdown",
    severity: "error",
    root: props.documentRoot,
    files: [props.document],
    symbol: "h2",
    noEvidenceExclude: true,
    requireReview: false,
  };
  return {
    name: props.name,
    type: "markdown",
    root: "docs",
    files: [props.account, ...props.populationFiles],
    symbol: "h2",
    disabled: !props.enabled,
    reference: [obligation],
  };
}
