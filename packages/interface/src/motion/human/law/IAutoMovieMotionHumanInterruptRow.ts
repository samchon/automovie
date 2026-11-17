/**
 * One legal way to cut an action into another: where in the source the cut
 * may fall, how the transition runs and where the target action is entered.
 *
 * `window` bounds the cut by shares in [0, 1] or by the source's event
 * names; `entry` is the target's share or event name to start from. `kind`
 * selects the transition:
 *
 * - `inertialize`: the target plays from its entry while the source's offset
 *   decays (Bollo 2018), over `blend` seconds (0.2 s when absent).
 * - `redirect`: the target is the same family of movement continuing from
 *   the source's state, its effector superposing a new minimum-jerk unit
 *   toward the new goal (Flash and Henis 1991).
 * - `phase`: a cyclic movement continues on the matching foot event.
 *
 * `keep` names what the transition must carry unchanged: the stance foot's
 * plant, the guard, or a grip.
 *
 * @evidence contracts/development/common.md#meaningful-documentation window: The earliest and latest cut, a share or a source event name each. entry: Where the target is entered, a share or a target event name. blend: Offset decay time of an inertialized transition, seconds.
 * @evidence contracts/development/design.md#principled-representation window: The earliest and latest cut, a share or a source event name each. entry: Where the target is entered, a share or a target event name. blend: Offset decay time of an inertialized transition, seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanInterrupt.ts (AutoMovieMotionHumanInterrupt.row, return); compose/AutoMovieMotionHumanInterrupt.ts (AutoMovieMotionHumanInterrupt.row.opens, return); compose/AutoMovieMotionHumanInterrupt.ts (AutoMovieMotionHumanInterrupt.table, return); perform/HumanSegment.ts (HumanSegment.row, return); perform/HumanSegmentCut.ts (HumanSegmentCut.row, return); perform/HumanSegmentCut.ts (HumanSegmentCut.row.found, r).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The literal vocabulary is declared independently of runtime values; implementations are checked against this exact set.
 */
export interface IAutoMovieMotionHumanInterruptRow {
  /** The earliest and latest cut, a share or a source event name each. */
  window: readonly [number | string, number | string];

  /** How the transition runs. */
  kind: (readonly ["inertialize", "redirect", "phase"])[number];

  /** Where the target is entered, a share or a target event name. */
  entry: number | string;

  /** What the transition carries unchanged. */
  keep?: readonly (readonly ["stanceFoot", "guard", "grip"])[number][];

  /** Offset decay time of an inertialized transition, seconds. */
  blend?: number;
}
