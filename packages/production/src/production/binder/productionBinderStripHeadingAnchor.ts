/**
 * Remove one trailing authored heading anchor and trim the title.
 *
 * @evidence contracts/common.md#principled-implementation Removes one trailing brace-hash anchor spelling and trims the title, matching the authored evidence-heading profile rather than interpreting arbitrary inline Markdown.
 * @evidence contracts/common.md#clear-and-simple-design One title projection serves flat/grouped document titles and rebased body headings.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Interior text and nonmatching suffixes remain present; no reader title is inferred from a filename or expected content.
 * @evidence contracts/common.md#meaningful-documentation Documents trailing-anchor removal and whitespace trim, without claiming full Markdown inline parsing.
 * @evidence contracts/performance.md#efficient-algorithms Regex search/replacement and trimming scan title length and create an output string; no document population is traversed.
 * @evidence contracts/performance.md#reuse-equivalent-work The same rule is shared by current title consumers without retaining title results across reads.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a string transfers and no handle, source buffer inventory or running task is acquired.
 */
export function productionBinderStripHeadingAnchor(title: string): string {
    return title.replace(/\s*\{#[^{}\s]+\}\s*$/u, "").trim();
}
