/**
 * One current reader document's anchor-free title and transformed body.
 *
 * @evidence contracts/common.md#principled-implementation A reader-admitted first H1 supplies title and transformed remaining Markdown supplies body, preserving their distinct edition roles.
 * @evidence contracts/common.md#clear-and-simple-design One internal pair transfers parsed document facts from flat/grouped readers to assembly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The shape does not validate arbitrary text or fabricate a title for a missing H1.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish anchor-free title from author-marker-stripped body and their current-read provenance.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface executes no parsing or transform; reader owners account for bytes and strings.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type defines no cache or equivalence across mutable source reads.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The reading call owns returned strings and their lifetime; the declaration opens no resource.
 * @author Samchon
 */
export interface IAutoMovieProductionBinderAuthoredDocument {
    /** Transformed reader body after the admitted first H1 was removed. */
    body: string;

    /** Current first-H1 title with its trailing authored anchor removed. */
    title: string;
}
