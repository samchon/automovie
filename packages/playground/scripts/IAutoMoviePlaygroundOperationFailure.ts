/**
 * An earlier operation's exact unknown error retained through fallible resource cleanup. preserveCleanupFailure uses undefined to mean no earlier cause, so thrown undefined remains representable inside this wrapper rather than disappearing as absence.
 *
 * @author Samchon
 */
export interface IAutoMoviePlaygroundOperationFailure {
  /** Original operation error that cleanup must not replace. */
  error: unknown;
}
