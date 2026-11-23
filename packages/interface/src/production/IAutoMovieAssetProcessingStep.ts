/**
 * Declared transformation applied after acquiring original bytes. Tool, command
 * and parameters are provenance; the compiler does not replay them.
 */
export interface IAutoMovieAssetProcessingStep {
  /** Executable or tool identity, including a version when it affects output. */
  tool: string;

  /** Exact command or operation name. */
  command: string;

  /** Stable serializable parameters needed to reproduce the transformation. */
  parameters: Record<string, string | number | boolean | null>;
}
