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
 * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `AutoMovieDesignLifecycleRole` as the portable data boundary for the production design generated reference requirement.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `AutoMovieDesignLifecycleRole` for the narrative intent reference lineage system contract.
 */
export type AutoMovieDesignLifecycleRole =
  | "retained"
  | "demolished"
  | "temporary"
  | "new";
