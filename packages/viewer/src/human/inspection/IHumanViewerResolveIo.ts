/**
 * The one filesystem question the resolver asks.
 *
 * @evidence contracts/common.md#principled-implementation The resolver asks whether one normalized forward-slash candidate is a regular file before choosing a module path.
 * @evidence contracts/common.md#clear-and-simple-design A single existence operation separates filesystem facts from import-resolution rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Module resolution receives real file existence rather than a caller-specific table of expected import answers.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies regular files and normalized forward-slash paths as the resolver's filesystem boundary.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This existence capability implements no path-search algorithm; resolveHumanViewerImport owns candidate ordering.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The borrowed file question declares no memo policy; the revision owner may cache answers within its current computation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A boolean file fact transfers no filesystem handle; the adapter owns its stat operation.
 *
 * @author Samchon
 */
export interface IHumanViewerResolveIo {
  /**
   * Whether a regular file exists at this normalized forward-slash path.
   *
   * @evidence contracts/common.md#principled-implementation A regular-file predicate supplies the filesystem fact needed to admit an import-resolution candidate.
   * @evidence contracts/common.md#clear-and-simple-design Resolution owns candidate construction while this callback only answers existence at the supplied path.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The predicate queries actual source candidates rather than treating known fixtures as existing files.
   * @evidence contracts/common.md#meaningful-documentation The member defines forward-slash normalization and regular-file existence, excluding directories.
   * @evidenceExclude contracts/performance.md#efficient-algorithms No filesystem search strategy is selected by this one-path boolean signature.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Any memoization of candidate presence belongs to the revision owner and is cleared after edit batches.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A file-presence answer retains no file descriptor or mutable filesystem object.
   */
  exists(file: string): boolean;
}
