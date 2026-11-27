/**
 * Discoverable axes and composition operators of the Human action grammar.
 * AutoMovieMotionHumanGrammar supplies these entries to reference pages and authoring tools.
 * Entries describe capabilities; reading this catalogue plans no motion and
 * validates no composition. The named runtime operations perform those checks.
 */
export interface IAutoMovieMotionHumanGrammar {
  /**
   * Ordered independent decisions used to describe an action; readers borrow
   * this catalogue.
   */
  readonly axes: readonly IAutoMovieMotionHumanGrammar.IEntry<IAutoMovieMotionHumanGrammar.Axis>[];

  /** Ordered ways to join or relate actions; readers borrow this catalogue. */
  readonly operators: readonly IAutoMovieMotionHumanGrammar.IEntry<IAutoMovieMotionHumanGrammar.Operator>[];
}

/** Contracts used by AutoMovieMotionHumanGrammar. */
export namespace IAutoMovieMotionHumanGrammar {
  /**
   * A decision about one action: support, travel, performed act, participating
   * parts, targets, objects, partners, manner, layers, timing or seeded take.
   */
  export type Axis =
    | "base"
    | "travel"
    | "action"
    | "effector"
    | "target"
    | "object"
    | "partner"
    | "manner"
    | "layer"
    | "timing"
    | "seed";

  /**
   * A composition relationship: ordered actions, a cut, simultaneous body
   * channels, persistent layers, parallel performers, a mutual act, an
   * affordance attachment or synchronization.
   */
  export type Operator =
    | "sequence"
    | "cut"
    | "overlay"
    | "layer"
    | "parallel"
    | "mutual"
    | "attach"
    | "sync";

  /**
   * A catalogue row; the generic distinguishes axis names from operator names
   * in their respective lists.
   */
  export interface IEntry<Name extends Axis | Operator> {
    /** Stable machine-readable vocabulary name; it is not an arbitrary label. */
    readonly name: Name;

    /**
     * Human-readable runtime API references that implement this capability, not
     * code to execute.
     */
    readonly carriedBy: string;

    /** Short explanation of what the author decides or composes with this entry. */
    readonly says: string;
  }
}
