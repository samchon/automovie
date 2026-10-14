

/**
 * A visible ATX heading record carries depth, original line, title and an optional explicit anchor.
 *
 * @evidence contracts/common.md#principled-implementation A visible ATX heading record carries depth, original line, title and an optional explicit anchor.
 * @evidence contracts/common.md#clear-and-simple-design Extraction is separate from identity admission so H1 through H6 remain representable before validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An absent anchor remains undefined instead of being synthesized from a title.
 * @evidence contracts/common.md#meaningful-documentation line is one-based and title omits terminal anchor syntax.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This declaration is erased; markdownHeadings creates visible heading records for identity admission, which owns the runtime algorithm and allocation cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no effects; markdownHeadings creates visible heading records for identity admission, which owns any valid reuse or recomputation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema acquires no resources; markdownHeadings creates visible heading records for identity admission, while the caller or module owns the lifetime of its values.
 *
 * @author Samchon
 */
export interface IAutoMovieEvidenceMarkdownHeading {
  /** Terminal explicit anchor, or undefined before identity admission. */
  anchor: string | undefined;

  /** ATX heading depth before the owning topology validator narrows it. */
  depth: 1 | 2 | 3 | 4 | 5 | 6;

  /** One-based source line retained through hidden-syntax projection. */
  line: number;

  /** Visible title with any terminal explicit anchor removed. */
  title: string;
}
