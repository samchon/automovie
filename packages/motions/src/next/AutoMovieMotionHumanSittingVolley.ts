import { HumanSittingVolley as HumanSittingVolleyLaw } from "../lexicon/internal/HumanSittingVolley";

/**
 * Sitting volleyball, a rally played from the floor.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `sittingVolley`: Shift a court-supported seat by pressing on one stationary
 *   palm, then release the palm and bring both forearms to a receive platform.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanSittingVolley} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanSittingVolley {
  /**
   * Shift a court-supported seat by pressing on one stationary palm, then
   * release the palm and bring both forearms to a receive platform. The torso
   * support remains on the court during play, as in World ParaVolley Rule
   * 9.4.1, without using the optional defensive lift. See
   * https://worldparavolley.org/wp-content/uploads/2025/03/2025-2028-WPV-Official-Sitting-Volleyball-Rules-English-v1-2025-03-18.pdf
   * and the measured seated displacement and balance protocol at
   * https://pmc.ncbi.nlm.nih.gov/articles/PMC5747199/ . Phase shares, incline
   * and single-shift bounds are provisional staging choices. The receiving
   * location is independent of any ball outcome.
   */
  export const sittingVolley: typeof HumanSittingVolleyLaw =
    HumanSittingVolleyLaw;
}
