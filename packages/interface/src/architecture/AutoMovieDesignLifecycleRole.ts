/**
 * How one subject relates to the work as a whole.
 *
 * This classifies the whole construction plan, not one moment in it: a wall
 * taken down in the demolition phase is `demolished` for the entire work,
 * including the phases before the demolition where it still stands. Ask
 * {@link AutoMovieDesignPresence} for the moment.
 *
 * What predates the work is `retained` when it survives and `demolished` when
 * it does not; what the work installs is `new` when it survives and `temporary`
 * when it is taken out again, which keeps shoring, a hoarding, or a protection
 * deck distinguishable from the building it protects.
 *
 * The engine derives it from a lifecycle's two phase fields: a null
 * `introducedIn` marks a predating subject, and a non-null `removedIn` marks
 * one that does not survive.
 */
export type AutoMovieDesignLifecycleRole =
  | "retained"
  | "demolished"
  | "temporary"
  | "new";
