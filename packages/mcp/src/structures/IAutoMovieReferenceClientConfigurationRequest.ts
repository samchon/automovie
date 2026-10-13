/**
 * Existing client configuration bytes and the installed production's launch identity.
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
