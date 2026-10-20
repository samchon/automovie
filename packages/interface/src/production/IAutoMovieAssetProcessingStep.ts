/**
 * Declared transformation applied after acquiring original bytes. Tool, command and parameters are provenance; the compiler does not replay them.
 *
 * @evidence contracts/common.md#principled-implementation An ordered processing step records executable identity, operation and serializable scalar parameters sufficient to describe the authored transformation; actual current bytes retain their independent manifest digest.
 * @evidence contracts/common.md#clear-and-simple-design One step owns its tool, command and parameter map, while the asset provenance owns order, original acquisition and final-byte identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A recorded command does not prove reproducibility or trigger execution. Nonblank tool/command and current-byte verification remain host premises after production inventory retirement.
 * @evidence contracts/common.md#meaningful-documentation Gives version-sensitive tool identity, exact operation and scalar parameter intent, and distinguishes declared processing history from compiler replay.
 */
export interface IAutoMovieAssetProcessingStep {
  /**
   * Executable or tool identity, including a version when it affects output.
   */
  tool: string;

  /** Exact command or operation name. */
  command: string;

  /** Stable serializable parameters needed to reproduce the transformation. */
  parameters: Record<string, string | number | boolean | null>;
}
