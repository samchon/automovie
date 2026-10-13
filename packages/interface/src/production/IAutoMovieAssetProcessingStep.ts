/** One reproducible transformation applied after acquiring original bytes. */
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
