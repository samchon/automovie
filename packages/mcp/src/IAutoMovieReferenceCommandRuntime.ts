import type { IAutoMovieReferenceReader } from "./structures/IAutoMovieReference";


/**
 * The local command's injected read and output capabilities.
 *
 * @evidence contracts/common.md#principled-implementation Reader binding and separate stdout/stderr writes describe one local-command invocation's effects.
 * @evidence contracts/common.md#clear-and-simple-design Portable dispatch receives output capabilities without owning host streams.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The port exposes no production source mutation or process launch operation.
 * @evidence contracts/common.md#meaningful-documentation Members state JSON result newline and usage/startup diagnostic separation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration chooses no runtime algorithm; its producer owns traversal and parsing costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares a representation without coordinating completed or in-flight operations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Caller-held values retain only their documented fields; implementations own handles and source-lifetime bounds.
 *
 * @author Samchon
 */
export interface IAutoMovieReferenceCommandRuntime {

  /** Bind the explicit command-line root before dispatching its one JSON request.
   *
   * @evidence contracts/common.md#principled-implementation The explicit command root is bound before one JSON request dispatch.
   * @evidence contracts/common.md#clear-and-simple-design Physical admission stays with the reader, separate from command argument grammar.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No request body can replace the bound command root.
   * @evidence contracts/common.md#meaningful-documentation The member states command-line root binding and reader transfer.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature chooses no runtime algorithm; the supplied concrete operation owns traversal and I/O costs.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This capability declaration coordinates no cache; the owning operation decides when effects and observations may be reused.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The bound read capability belongs to the invocation; implementations release any temporary descriptors during each read.
   */
  reader(root: string): Promise<IAutoMovieReferenceReader>;

  /** Write the single result JSON envelope and its trailing newline.
   *
   * @evidence contracts/common.md#principled-implementation One supplied string is written as the local command result capability.
   * @evidence contracts/common.md#clear-and-simple-design Result output stays separate from usage and startup diagnostics.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The port does not transform a refusal into success or mutate source data.
   * @evidence contracts/common.md#meaningful-documentation The member states the single JSON envelope and trailing newline expected from its caller.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature chooses no runtime algorithm; the supplied concrete operation owns traversal and I/O costs.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This capability declaration coordinates no cache; the owning operation decides when effects and observations may be reused.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The runtime owns its output stream and any buffering; the command does not close a caller-owned stream.
   */
  stdout(value: string): void;

  /** Write usage or sanitized startup diagnostics separately from result output.
   *
   * @evidence contracts/common.md#principled-implementation One supplied diagnostic string is written on the separate startup/usage channel.
   * @evidence contracts/common.md#clear-and-simple-design Sanitized diagnostics remain separate from the JSON result channel.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The command supplies authored source-free messages rather than passing through native exception text.
   * @evidence contracts/common.md#meaningful-documentation The member states usage and startup diagnostic ownership.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature chooses no runtime algorithm; the supplied concrete operation owns traversal and I/O costs.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This capability declaration coordinates no cache; the owning operation decides when effects and observations may be reused.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The runtime owns its error stream and buffering; the command retains no stream handle.
   */
  stderr(value: string): void;
}
