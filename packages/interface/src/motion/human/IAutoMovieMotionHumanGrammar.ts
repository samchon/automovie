/**
 * Discoverable axes and composition operators of the Human action grammar.
 * HUMAN_GRAMMAR supplies these entries to reference pages and authoring tools.
 * Entries describe capabilities; reading this catalogue plans no motion and
 * validates no composition. The named runtime operations perform those checks.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes descriptive catalogue entries from executable motion and admission. name: Stable machine-readable vocabulary name; it is not an arbitrary label. carriedBy: Human-readable runtime API references that implement this capability, not code to execute. says: Short explanation of what the author decides or composes with this entry.
 * @evidence contracts/development/design.md#principled-representation Separate closed axis and operator names prevent an operator being advertised as an action axis. name: Stable machine-readable vocabulary name; it is not an arbitrary label. carriedBy: Human-readable runtime API references that implement this capability, not code to execute. says: Short explanation of what the author decides or composes with this entry.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Reference consumers read the name, owning API and explanation of each catalogue entry. Runtime boundary references: HUMAN_GRAMMAR.ts (HUMAN_GRAMMAR).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The public vocabulary constrains the runtime catalogue without deriving its types from that catalogue. Axis and operator vocabularies remain distinct from their descriptive rows; HUMAN_GRAMMAR supplies data and performs no action planning.
 */
export interface IAutoMovieMotionHumanGrammar {
  /** Ordered independent decisions used to describe an action; readers borrow this catalogue. */
  readonly axes: readonly IAutoMovieMotionHumanGrammar.IEntry<IAutoMovieMotionHumanGrammar.Axis>[];

  /** Ordered ways to join or relate actions; readers borrow this catalogue. */
  readonly operators: readonly IAutoMovieMotionHumanGrammar.IEntry<IAutoMovieMotionHumanGrammar.Operator>[];
}

/**
 * Contracts used by HUMAN_GRAMMAR.
 *
 */
export namespace IAutoMovieMotionHumanGrammar {
  /**
   * A decision about one action: support, travel, performed act, participating parts, targets, objects, partners, manner, layers, timing or seeded take.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A decision about one action: support, travel, performed act, participating parts, targets, objects, partners, manner, layers, timing or seeded take.
   * @evidence contracts/development/design.md#principled-representation Closed choices "base", "travel", "action", "effector", "target", "object", "partner", "manner", "layer", "timing", "seed" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Used by the enclosing IAutoMovieMotionHumanGrammar contract's parameter and result relationships.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The literal vocabulary is declared independently of runtime values; implementations are checked against this exact set.
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
   * A composition relationship: ordered actions, a cut, simultaneous body channels, persistent layers, parallel performers, a mutual act, an affordance attachment or synchronization.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A composition relationship: ordered actions, a cut, simultaneous body channels, persistent layers, parallel performers, a mutual act, an affordance attachment or synchronization.
   * @evidence contracts/development/design.md#principled-representation Closed choices "sequence", "cut", "overlay", "layer", "parallel", "mutual", "attach", "sync" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Used by the enclosing IAutoMovieMotionHumanGrammar contract's parameter and result relationships.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The literal vocabulary is declared independently of runtime values; implementations are checked against this exact set.
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
   * A catalogue row; the generic distinguishes axis names from operator names in their respective lists.
   *
   * @evidence contracts/development/common.md#meaningful-documentation name: Stable machine-readable vocabulary name; it is not an arbitrary label. carriedBy: Human-readable runtime API references that implement this capability, not code to execute. says: Short explanation of what the author decides or composes with this entry.
   * @evidence contracts/development/design.md#principled-representation name: Stable machine-readable vocabulary name; it is not an arbitrary label. carriedBy: Human-readable runtime API references that implement this capability, not code to execute. says: Short explanation of what the author decides or composes with this entry.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Used by the enclosing IAutoMovieMotionHumanGrammar contract's parameter and result relationships.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The name parameter preserves whether a row is an axis or an operator; carriedBy is descriptive text, never executable code.
   */
  export interface IEntry<Name extends Axis | Operator> {
    /** Stable machine-readable vocabulary name; it is not an arbitrary label. */
    readonly name: Name;

    /** Human-readable runtime API references that implement this capability, not code to execute. */
    readonly carriedBy: string;

    /** Short explanation of what the author decides or composes with this entry. */
    readonly says: string;
  }
}
