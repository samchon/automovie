/**
 * Existing client configuration bytes and the installed production's launch identity.
 *
 * @evidence contracts/common.md#principled-implementation Existing optional configuration text and normalized absolute production and Node paths define one planning request.
 * @evidence contracts/common.md#clear-and-simple-design Installed launch identity is separate from optional current client bytes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The Node executable is a machine fact rather than an ownership key.
 * @evidence contracts/common.md#meaningful-documentation Members state path normalization and absent-file meanings.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration chooses no runtime algorithm; its producer owns traversal and parsing costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares a representation without coordinating completed or in-flight operations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Caller-held values retain only their documented fields; implementations own handles and source-lifetime bounds.
 *
 * @author Samchon
 */
export interface IAutoMovieReferenceClientConfigurationRequest {

  /** Normalized absolute production root that the installed reference binary will bind. */
  root: string;

  /** Normalized absolute Node executable recorded as the launch command, not an ownership key. */
  nodeExecutable: string;

  /** Existing .mcp.json bytes decoded as text, or undefined when absent. */
  claude?: string;

  /** Existing .codex/config.toml text whose unrelated bytes must be preserved. */
  codex?: string;
}
