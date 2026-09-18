import { IAutoMovieBeatEndState, IAutoMovieReviewNote, IAutoMovieScene, IAutoMovieScript, IAutoMovieShot } from "@automovie/interface";

/**
 * Value returned for a stored-context request, or `null` when absent.
 *
 * @evidence requirements/acceptance/scope-targets-and-authority.md#acceptance-requestable-unit IAutoMovieStoredContext keeps the requested review unit explicit: Value returned for a stored-context request, or `null` when absent.
 * @evidence specifications/review-and-acceptance/target-scope-and-context.md#review-system-scope-selection IAutoMovieStoredContext realizes explicit review-scope selection: Value returned for a stored-context request, or `null` when absent.
 */
export type IAutoMovieStoredContext =
  | IAutoMovieScript
  | IAutoMovieScene
  | IAutoMovieShot
  | IAutoMovieReviewNote[]
  | IAutoMovieBeatEndState
  | null;
