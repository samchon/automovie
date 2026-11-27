import type { IAutoMovieMotionHumanAffect } from "./IAutoMovieMotionHumanAffect";

/**
 * Affect input data for expression layer builders. The runtime namespace owns
 * the operations that build layers; each layer writes joint angles, leaving
 * planted or gripping limb goals where they are.
 */
/** The authorable input types for expression operations. */
export namespace IAutoMovieMotionHumanExpression {
  /** The parameters of `affect`. */
  export interface IAffect {
    /** The displays, each at its film second for its length. */
    displays: readonly IAutoMovieMotionHumanAffect.IDisplay[];
  }
}
