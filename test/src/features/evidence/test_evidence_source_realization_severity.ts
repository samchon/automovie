import { createAutoMovieSourceRealizationReferences } from "../../../../packages/evidence/src/createAutoMovieSourceRealizationReferences";
import { TestValidator } from "@nestia/e2e";
import type { ITtscEvidenceGraphMarkdownReference } from "@ttsc/evidence";

/**
 * Source realization retains native target selectors and cardinality while applying error severity without companion review requirements.
 *
 * Scenarios:
 *
 * 1. File, H2 and H3 references retain ordered positive/negative selectors and structural policy in a new record.
 * 2. A frozen input remains unchanged and its selector array stays caller-owned.
 * 3. Empty selectors remain empty for the graph admission boundary to reject when active; the constructor creates no substitute target.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the real source-reference constructor and checks its returned native records, catching target omission, cardinality weakening, non-error severity or a reintroduced companion requirement.
 * @evidence contracts/testing.md#independent-expectations Native realization policy requires error severity and requireReview false while the explicitly authored root, selector order and ownership flags remain unchanged; expectations are written from those input facts rather than a constructor snapshot.
 * @evidence contracts/testing.md#distinguishing-cases File, H2 and H3 populations exercise the supported address levels, including subtractive selectors, frozen inputs and an empty selector population; full active-graph admission owns malformed or missing physical targets.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_evidence_source_realization_severity unit imports its production source directly and evaluates portable record transformation without an installed production, native evaluator, process or render host.
 */
export function test_evidence_source_realization_severity(): void {
  for (const symbol of ["file", "h2", "h3"] as const) {
    const reference: Omit<ITtscEvidenceGraphMarkdownReference, "severity" | "requireReview"> = {
      type: "markdown",
      root: "docs",
      files: ["models/**/*.md", "!models/excluded.md"],
      symbol,
      noEvidenceExclude: true,
      uniqueEvidence: true,
      singleEvidencePerSymbol: true,
      checklist: true,
    };
    const before: string = JSON.stringify(reference);
    Object.freeze(reference);
    const output: ITtscEvidenceGraphMarkdownReference[] = createAutoMovieSourceRealizationReferences({ reference });
    TestValidator.equals(`${symbol} retains strict structural policy`, output, [{ ...reference, severity: "error", requireReview: false }]);
    TestValidator.equals("input fields remain unchanged", JSON.stringify(reference), before);
    TestValidator.predicate("the output owns a new policy record", output[0] !== reference);
    TestValidator.predicate("selector ownership stays with the caller", output[0]!.files === reference.files);
  }
  const empty: Omit<ITtscEvidenceGraphMarkdownReference, "severity" | "requireReview"> = { type: "markdown", root: "docs", files: [], symbol: "h2" };
  TestValidator.equals("no replacement target is invented", createAutoMovieSourceRealizationReferences({ reference: empty }), [{ ...empty, severity: "error", requireReview: false }]);
}
