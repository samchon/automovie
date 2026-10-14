/**
 * What the reference resolver may ask of the local reference folder.
 *
 * @evidence contracts/common.md#principled-implementation Closed folder and resource names constrain reference resolution to the local face/body directories and their known JSON metadata.
 * @evidence contracts/common.md#clear-and-simple-design Listing names and reading unknown JSON separate filesystem access from document-to-photograph resolution without exposing image-byte operations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The seam expresses actual reference storage operations; it contains no document-specific fixtures or replacement of filesystem methods.
 * @evidence contracts/common.md#meaningful-documentation Comments specify the two folders, missing-directory empty arrays and undefined JSON resources; malformed metadata is not certified by the type.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This I/O signature selects no filesystem traversal strategy; the reference route implements listing and JSON reading.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The resolver contract does not memoize mutable reference files; each caller decides when to request fresh metadata.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only returned names and parsed values cross this seam; file handles and streams are not transferred to its consumer.
 *
 * @author Samchon
 */
export interface IHumanViewerReferenceIo {
  /**
   * File names in `references` (`""`) or `references/body` (`"body"`), empty when absent.
   *
   * @evidence contracts/common.md#principled-implementation The folder union restricts listing to face references or body references; missing folders yield an empty list.
   * @evidence contracts/common.md#clear-and-simple-design Returning names supplies exactly what photograph matching needs without loading image bytes.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Reference discovery uses the real directory's files instead of a subject catalogue hardcoded in the resolver.
   * @evidence contracts/common.md#meaningful-documentation The comment spells out empty-string and body folder meanings plus missing-directory behavior.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The listing signature does not prescribe traversal or sorting; the filesystem adapter enumerates regular files.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This folder query has no freshness cache; resolving another request may observe changed local images.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned filenames transfer no open directory handle or image buffer to the resolver.
   */
  list(folder: "" | "body"): string[];

  /**
   * A parsed JSON resource, or undefined when it is absent.
   *
   * @evidence contracts/common.md#principled-implementation Closed metadata names select poses, landmarks or the body manifest; unknown results require consumer validation.
   * @evidence contracts/common.md#clear-and-simple-design A single parsed-resource operation hides filesystem paths while preserving absence as undefined.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The adapter reads actual local JSON resources and does not synthesize cameras for chosen documents.
   * @evidence contracts/common.md#meaningful-documentation The member documents parsed JSON and the undefined result when the resource is absent.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The JSON reader contract chooses no parser or byte-buffer strategy; its adapter performs synchronous reading and parsing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Parsed resource delivery defines no memoization, so callers cannot assume metadata remains unchanged across reads.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only parsed values escape this operation; the filesystem adapter owns and closes its read handles.
   */
  readJson(name: "poses" | "landmarks" | "manifest"): unknown;
}
