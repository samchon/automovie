import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieActorContext } from "./IAutoMovieActorContext";

/**
 * Data and callback contracts shared by the ResumeActorSynthesisRuntime
 * operations.
 */
export namespace IAutoMovieResumeActorSynthesisRuntime {
  /**
   * Build per-action context and placement maps from a verified previous beat,
   * when supplied. Carried pose, facing, root position and gait phase replace
   * the staged values; horizontal speed below 1e-6 m/s keeps the authored
   * speed. Entries and nested pose data are borrowed.
   */
  export type IResult = {
    /**
     * Call-local resumed actor lookup; nested poses, rigs and unchanged
     * contexts are borrowed.
     */
    contexts: Map<string, IAutoMovieActorContext>;

    /**
     * Call-local staged-id lookup with known prior actor translations
     * substituted; values are borrowed.
     */
    nodes: Map<string, IAutoMovieVector3>;
  };
}
