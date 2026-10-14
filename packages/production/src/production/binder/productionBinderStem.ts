/**
 * Project a reader title into its Unicode letter/number filename stem.
 *
 * @evidence contracts/common.md#principled-implementation Locale-independent lowercasing and Unicode letter/number runs form a hyphen-joined filename stem, with automovie when no run exists; distinct titles may intentionally collide and publication then requires exact bytes.
 * @evidence contracts/common.md#clear-and-simple-design Keeps stable filename projection separate from title validation and existing-edition refusal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No content-specific title is privileged; the fallback names an empty-token stem and does not replace the reader-facing title or silently overwrite collisions.
 * @evidence contracts/common.md#meaningful-documentation States Unicode token profile, shared fallback and collision behavior for stable filenames rather than claiming an injective title encoding.
 * @evidence contracts/performance.md#efficient-algorithms Lowercasing, regex matching and joining process all title text and token strings, with O(L) text/token storage for title length L.
 * @evidence contracts/performance.md#reuse-equivalent-work Constructor computes one stem for its stable filename; no separate global title cache is maintained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Token arrays are local and the returned stem joins the instance's filename, with no native resource or task.
 */
export function productionBinderStem(title: string): string {
    return (title
        .toLowerCase()
        .match(/\p{L}+|\p{N}+/gu)
        ?.join("-") ?? "automovie");
}
