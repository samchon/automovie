import type { AutoMovieMotionHumanActionName } from "./AutoMovieMotionHumanActionName";

/**
 * The name an action is performed under: one of the vocabulary's own names, or
 * the name a production registered a law of its own under.
 *
 * `AutoMovieMotionHumanActionName` stays the closed list of what the package
 * ships, so an editor completes it and documentation lists it. A performance
 * also runs the laws a production gives it
 * (`IAutoMovieMotionHumanPerformance.IInput.laws`), and those carry names this
 * package cannot know, so every place that only carries a name through (a
 * placed action, a cancel table's key, an entry state) takes this wider type. A
 * registered name never equals a shipped one: the performance refuses the
 * shadow.
 */
export type AutoMovieMotionHumanActionKey =
  | AutoMovieMotionHumanActionName
  | (string & {});
