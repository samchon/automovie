/**
 * How one subject relates to the work as a whole.
 *
 * This is a classification of the whole construction plan, not of one moment in
 * it: a wall that is taken down in the demolition phase is `demolished` for the
 * entire work, including the phases before the demolition where it is still
 * standing. Ask {@link AutoMovieDesignPresence} for the moment.
 *
 * The four families are exactly the ones a renovation has to keep apart. What
 * predates the work is `retained` when it survives and `demolished` when it
 * does not; what the work installs is `new` when it survives and `temporary`
 * when it is taken out again, which is how shoring, a hoarding, or a protection
 * deck stays distinguishable from the building it protects.
 *
 * The engine derives it from a lifecycle's two phase fields: no `introducedIn`
 * marks a predating subject, and a non-null `removedIn` marks one that does not
 * survive.
 */
export type AutoMovieDesignLifecycleRole =
  | "retained"
  | "demolished"
  | "temporary"
  | "new";
