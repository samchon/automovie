/**
 * Borrowed text reader used with the revision resolver to hash loaded source.
 *
 * @evidence contracts/common.md#principled-implementation A borrowed source-text reader exposes current contents or undefined so revision hashing can represent unreadable dependencies.
 * @evidence contracts/common.md#clear-and-simple-design Text access remains separate from module resolution and graph traversal, keeping filesystem behavior with the adapter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The reader supplies actual dependency text and does not substitute fixture digests or skip chosen source modules.
 * @evidence contracts/common.md#meaningful-documentation Documentation states current source-text delivery and the undefined unreadable-file outcome.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The source-reader signature does not choose hashing, traversal or file-read buffering strategies.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Text memoization is not promised by this seam; createHumanViewerRevisions invalidates its own text entries after edits.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned strings hold no open read handle; underlying filesystem access remains owned by the reader implementation.
 *
 * @author Samchon
 */
export interface IHumanViewerRevisionReadIo {
  /**
   * Return current source text, or undefined when this file cannot be read.
   *
   * @evidence contracts/common.md#principled-implementation Reading current text gives dependency hashing the bytes' textual source representation; unreadability remains explicit as undefined.
   * @evidence contracts/common.md#clear-and-simple-design The source-text operation does not duplicate import resolution or graph ownership.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No fallback source text is supplied for chosen missing modules by this capability contract.
   * @evidence contracts/common.md#meaningful-documentation The comment documents the unreadable-file outcome as well as current-text delivery.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The reader declaration specifies no file buffering or text-decoding algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The callback itself promises no text cache; callers invalidate their memoized source text on recorded edits.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only a string or absence is returned, leaving read-handle cleanup with the adapter.
   */
  read(file: string): string | undefined;
}
