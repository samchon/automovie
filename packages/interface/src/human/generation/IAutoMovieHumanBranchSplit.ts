/** One child's share of a parent's contact ring. */
export interface IAutoMovieHumanBranchSplit {
  /** Child chain whose adjacent end layer meets the parent's contact layer. */
  child: string;

  /**
   * Parent-phase arcs `[from, to]` in radians, in ring order. An arc runs
   * forward in phase from `from` to `to` and wraps through 2pi when `to <
   * from`; `[0, 2pi]` is the whole ring, a continuation event where a chain
   * changes its correspondence rule. Other arc ends are pinch phases, where the
   * parent's section touches itself; consecutive children share the vertex at a
   * pinch.
   */
  arcs: [number, number][];

  /**
   * This child already leaves the contact by its own construction with the
   * parent's jet across it, as a limb's root strip does, so the join leaves it
   * as built while it still settles the event's other children. Absent, the
   * event's own `shared` decides.
   */
  shared?: true;
}
