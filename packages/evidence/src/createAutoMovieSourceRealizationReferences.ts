import type { ITtscEvidenceGraphMarkdownReference } from "@ttsc/evidence";

/**
 * Keep exact realization coverage and cardinality blocking for every source.
 *
 * Native realization keeps actual acknowledgement and cardinality; physical observation and final-delivery gates own rendered evidence. This constructor applies one policy to the supplied reference without ignored source-family or review inputs.
 *
 * @evidence contracts/common.md#principled-implementation A shallow copy preserves the supplied target selector and cardinality while applying blocking severity and no native review requirement.
 * @evidence contracts/common.md#clear-and-simple-design One policy boundary serves every source family without ignored branch or review inputs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact acknowledgment, exclusions and uniqueness settings supplied by callers remain intact; no missing target is invented here.
 * @evidence contracts/common.md#meaningful-documentation The constructor returns one reference, leaves the input untouched and shares its nested selector arrays.
 * @evidence contracts/performance.md#efficient-algorithms Object spread costs the reference's field count and creates one array; selected files are not traversed.
 * @evidence contracts/performance.md#reuse-equivalent-work Nested input data is deliberately shared because this constructor does not mutate it; each output policy record is fresh.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains ownership of both nested arrays and returned reference; no files or tasks are acquired.
 */
export function createAutoMovieSourceRealizationReferences(props: {
  /** Native target selector and cardinality fields preserved by the policy copy. */
  reference: Omit<
    ITtscEvidenceGraphMarkdownReference,
    "severity" | "requireReview"
  >;
}): ITtscEvidenceGraphMarkdownReference[] {
  return [{ ...props.reference, severity: "error", requireReview: false }];
}
