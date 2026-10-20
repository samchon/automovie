/**
 * How one subject relates to the work as a whole.
 *
 * This classifies the whole construction plan, not one moment in it: a wall
 * taken down in the demolition phase is `demolished` for the entire work,
 * including the phases before the demolition where it still stands. Ask
 * {@link AutoMovieDesignPresence} for the moment.
 *
 * What predates the work is `retained` when it survives and `demolished` when it
 * does not; what the work installs is `new` when it survives and `temporary`
 * when it is taken out again, which keeps shoring, a hoarding, or a protection
 * deck distinguishable from the building it protects.
 *
 * The engine derives it from a lifecycle's two phase fields: a null
 * `introducedIn` marks a predating subject, and a non-null `removedIn` marks one
 * that does not survive.
 *
 * @evidence contracts/common.md#principled-implementation The four literals are the product of two booleans, predating and surviving, which `designLineagePhaseSnapshot` reads from `introducedIn === null` and `removedIn !== null`.
 * @evidence contracts/common.md#clear-and-simple-design One closed union for the plan-wide role kept separate from the per-phase presence, so a reader never mixes "what this subject is" with "whether it stands now".
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No role is inferred from a subject's kind or name; the two lifecycle fields alone decide it, and a temporary installation is never folded into `new`.
 * @evidence contracts/common.md#meaningful-documentation States that the role spans the whole plan, what each of the four roles means, where to ask for the per-phase answer, and the two fields it is derived from.
 */
export type AutoMovieDesignLifecycleRole =
  | "retained"
  | "demolished"
  | "temporary"
  | "new";
