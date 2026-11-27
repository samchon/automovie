import { inspectRefrigerator as inspectRefrigeratorLaw } from "../lexicon/internal/inspectRefrigerator";

/**
 * Eating and kitchen behaviours at a table: opening a refrigerator and looking
 * at one of its shelves. The fixed refrigerator prop supplies the affordances
 * fridgeHandle and shelf1 through shelf4; the performer stands with the handle
 * in reach and a sightline to the chosen shelf after the door opens. Door
 * opening is in degrees. No timing is defined by the family: the operate and
 * look laws' own apply (provisional: no study of kitchen timings).
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `inspectRefrigerator`: Open a refrigerator's fresh-food door by its handle,
 *   let go and look at one of its shelves.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanDining} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanDining {
  /**
   * Open a refrigerator's fresh-food door by its handle, let go and look at one
   * of its shelves. Stage a standing performer with the handle in reach and a
   * sightline to the chosen shelf after opening. The fixed prop uses the
   * refrigerator affordances `fridgeHandle` and `shelf1` through `shelf4`. The
   * door stays at the resulting opening while the performer looks.
   *
   * @param chain The performer's entry chain.
   * @param scene The prop subject, shelf number from bottom to top, additional
   *   opening in degrees and optional operating hand (right by default).
   * @returns The chain with the handle operation followed by the shelf look.
   * @throws {AutoMovieMotionHumanRefusal} If the requested additional opening is nonpositive
   *   or nonfinite.
   */
  export const inspectRefrigerator: typeof inspectRefrigeratorLaw =
    inspectRefrigeratorLaw;
}
