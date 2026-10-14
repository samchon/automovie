/**
 * Return exact nonempty trimmed raw-output metadata text or throw its field-labelled refusal. The label is owner-supplied diagnostic text, while the value is neither normalized nor treated as a verified locator.
 *
 * @evidence contracts/common.md#principled-implementation A runtime string check and nonempty/exact trim equality preserve original metadata spelling before returning the same string.
 * @evidence contracts/common.md#clear-and-simple-design Raw planning and boolean admission share one text policy, with field labels supplied by their owning call sites.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Blank/padded/nonstring values refuse without coercion; exact text alone supplies no path containment, secret filtering or media truth.
 * @evidence contracts/common.md#meaningful-documentation Prose states unchanged returned text, labelled throw and the locator-verification boundary.
 * @evidence contracts/performance.md#efficient-algorithms Two trims scan L characters with possible temporary strings; successful return reuses the original string and failure adds only its diagnostic text.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This scalar assertion owns no repeated retention request or value cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary trim/error text is call-local and no input record or filesystem handle is retained.
 */
export const productionRepaintRawExactText: (value: string, label: string) => string = (value: string, label: string): string => {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value !== value.trim()
  )
    throw new Error(
      `Repaint raw output ${label} must be exact non-blank text.`,
    );
  return value;
};
