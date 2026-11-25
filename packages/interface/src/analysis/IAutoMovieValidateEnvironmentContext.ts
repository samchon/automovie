import type { IAutoMovieEnvironmentContext } from "./IAutoMovieEnvironmentContext";

/**
 * Data and callback contracts shared by the ValidateEnvironmentContext
 * operations.
 */
export namespace IAutoMovieValidateEnvironmentContext {
  /**
   * Validate the read-only world a building is analysed against.
   *
   * Two rules carry the weight. The first is physical: an instant whose sun is
   * at or below the reference horizon may not declare a direct beam, because a
   * source under the ground plane illuminates nothing and a beam declared there
   * is how a "daylight" study quietly becomes fiction. The second is about
   * ownership: every context id is checked against the ids the building already
   * owns, so a neighbour's mass can never be addressed as, or mistaken for, a
   * part of the work.
   *
   * Instant ordering is validated rather than repaired. Sorting silently would
   * make two differently-authored contexts produce the same artifact and hide
   * an authoring mistake that a reader needs to see.
   *
   * Under the typed context-container premise, violations are returned with
   * paths rooted at `$input`; resident instant and occluder slots are visited
   * by index and absent records are refused at their slots. Other nested
   * container shapes remain a caller premise.
   *
   * Directions (north, ground up, each sun) must be finite and longer than
   * `1e-12` but need not be unit length; units must be `"meter"`, instant times
   * strictly increasing, illuminances finite and at or above zero, and an
   * outdoor relative humidity null or within `[0, 1]`. Occluder planes follow
   * `validateSolidPlanes`. The horizon rule is skipped while the sun or the
   * ground up has an unusable measured length. A nonfinite measured norm is a
   * range violation; horizon arithmetic is skipped for that invalid direction.
   */
  export type IProps = {
    /** Context to check. */
    context: IAutoMovieEnvironmentContext;

    /**
     * Ids the building already owns: elements, spaces, boundaries. A context id
     * colliding with one of these is refused; omitted reserves nothing.
     */
    reserved?: readonly string[];
  };
}
