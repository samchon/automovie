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

const findUniqueOrNull = <T>(props: {
  items: readonly T[];
  matches: (item: T) => boolean;
  key: string;
  label: string;
  path: (index: number) => string;
}): T | null => {
  let found: { item: T; index: number } | null = null;
  for (let index = 0; index < props.items.length; index++) {
    const item = props.items[index]!;
    if (!props.matches(item)) continue;
    if (found !== null)
      throw new Error(
        `${props.label} "${props.key}" is duplicated at ${props.path(index)}; first declared at ${props.path(found.index)}`,
      );
    found = { item, index };
  }
  return found?.item ?? null;
};
