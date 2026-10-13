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
 *
 * @evidence contracts/common.md#principled-implementation The role is a pure function of whether a lifecycle names an introducing phase and a removing phase, so the four literals are exactly the four combinations of those two nullable fields.
 * @evidence contracts/common.md#clear-and-simple-design Whole-plan role and per-phase presence are two types, so a demolished wall can still be present in the phases before its demolition without a third mixed state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject kind maps to a role by name; shoring or a hoarding reads `temporary` only because its lifecycle names a removing phase.
 * @evidence contracts/common.md#meaningful-documentation Defines each role by predating or installed and surviving or removed, gives the lifecycle fields it is derived from, and points to the presence type for the per-phase question.
 */
export type AutoMovieDesignLifecycleRole =
  | "retained"
  | "demolished"
  | "temporary"
  | "new";
