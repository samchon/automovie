/**
 * One candidate's loading window: from the hold it opened until it released it after its page and worker modules loaded.
 *
 * @evidence contracts/common.md#principled-implementation Stores one candidate's reached-edit flag and shared label promise/resolver until the generation-window owner closes it.
 * @evidence contracts/common.md#clear-and-simple-design Keeps active loading state distinct from the owner's bounded closed-token label history.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Clean closure still requires source updating to be false; dirty or unsettled code resolves null rather than inventing current authority.
 * @evidence contracts/common.md#meaningful-documentation Defines dirty observation and null-label meaning; the resolver is label settlement and does not itself release the compile hold.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record performs no scheduling; window token maps and edit traversal are owned by createHumanViewerGenerationWindows.
 * @evidence contracts/performance.md#reuse-equivalent-work All label readers of one token share its closed promise, while current-source comparisons remain live and source edits invalidate the label premise.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Active windows are uncapped until close/closeAll; the owner independently resolves labels/releases holds and retains only 64 closed-token labels.
 *
 * @author Samchon
 */
export interface IHumanViewerGenerationWindow {
  /** A file some build reads was edited during the window. */
  dirty: boolean;

  /** Resolves with the window's label once it is closed. */
  closed: Promise<string | null>;

  /**
   * Close the window with its label.
   *
   * @evidence contracts/common.md#principled-implementation Resolves this window's shared promise with its owner-selected source label or null authority.
   * @evidence contracts/common.md#clear-and-simple-design Keeps promise settlement separate from compile gate release and host closure notification so each can be attempted independently.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Resolving does not prove native compilation finished or grant a dirty candidate current code; label premises are checked before this call.
   * @evidence contracts/common.md#meaningful-documentation The argument is a clean current revision or explicit null, with unknown tokens handled before the owner accesses this resolver.
   * @evidence contracts/performance.md#efficient-algorithms One promise settlement performs fixed state work and resumes registered readers; edit/bulk traversal remains outside this callback.
   * @evidence contracts/performance.md#reuse-equivalent-work Concurrent readers share the same settled promise rather than requesting repeated label computation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The resolver lives with its active window until close; its owner removes active state and prunes closed label history without retaining a compiler handle here.
   */
  close: (label: string | null) => void;
}
