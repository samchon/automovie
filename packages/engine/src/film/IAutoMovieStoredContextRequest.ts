import { IAutoMovieContextRequest } from "@automovie/interface";

type AutoMovieStoredContextType =
  | "getScript"
  | "getScene"
  | "getShot"
  | "getNotes"
  | "getBeatEnd";

/**
 * A context request answerable from state already stored on the slate.
 *
 * @evidence requirements/acceptance/scope-targets-and-authority.md#acceptance-requestable-unit IAutoMovieStoredContextRequest keeps the requested review unit explicit: A context request answerable from state already stored on the slate.
 * @evidence specifications/review-and-acceptance/target-scope-and-context.md#review-system-scope-selection IAutoMovieStoredContextRequest realizes explicit review-scope selection: A context request answerable from state already stored on the slate.
 */
export type IAutoMovieStoredContextRequest = Extract<
  IAutoMovieContextRequest,
  { type: AutoMovieStoredContextType }
>;
