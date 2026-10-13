/**
 * A reversible renderer configuration for one beauty or structural pass.
 *
 * @author Samchon
 */
export interface IAutoMovieRendererEnvironmentHandle {
  /** Restore every renderer property touched by the configuration. */
  restore: () => void;
}

