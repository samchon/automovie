import type { IAutoMovieSoftBodyDomain } from "./IAutoMovieSoftBodyDomain";
import type { IAutoMovieSoftFurnishing } from "./IAutoMovieSoftFurnishing";

/** Furnishing selection and shot clock used to derive one cloth frame. */
export namespace IAutoMovieLowerSoftFurnishing {
  /**
   * Borrowed furnishing and domain for deriving fresh cloth state and surface
   * arrays. Domain/reference/named-state failures return not-run with null
   * geometry. After domain admission, selfCollision requests return unsupported
   * with the step-zero configuration, even for a cord the core can otherwise
   * solve; rest mode also uses step zero. Neither path consumes time.
   *
   * Simulated mode quantizes finite shot seconds to an absolute fixed step and
   * refuses requests past maxSteps. Unknown modes return not-run. The
   * static-boundary solver rejects body capsules even at step zero and ignores
   * moving-anchor binding metadata in favour of static targets; this lowerer
   * supplies no motion history. Those refusals and numerical failures propagate
   * as exceptions. Architecture/support admission belongs to
   * validateSoftFurnishings. Inputs are unchanged and no playback cursor is
   * retained. No production/viewer currently calls this lowerer.
   */
  export type IProps = {
    /**
     * Selects domain id, named state and rest/simulated mode; its architecture
     * and support references are not checked here.
     */
    furnishing: IAutoMovieSoftFurnishing;

    /**
     * Matching cloth definition; validateSoftBodyDomain is run before any state
     * or surface is produced.
     */
    domain: IAutoMovieSoftBodyDomain;

    /**
     * Shot seconds for simulated mode: finite negatives clamp to zero, then
     * step = floor(time / fixedStepSeconds + 1e-9); ignored by rest and
     * unsupported-selfCollision branches.
     */
    time: number;
  };
}
