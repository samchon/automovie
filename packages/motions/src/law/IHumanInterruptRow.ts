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
 */
export interface IHumanInterruptRow {
  /** The earliest and latest cut, a share or a source event name each. */
  window: readonly [number | string, number | string];

  /** How the transition runs. */
  kind: (typeof IHumanInterruptRow.KINDS)[number];

  /** Where the target is entered, a share or a target event name. */
  entry: number | string;

  /** What the transition carries unchanged. */
  keep?: readonly (typeof IHumanInterruptRow.KEEPS)[number][];

  /** Offset decay time of an inertialized transition, seconds. */
  blend?: number;
}

/**
 * Companion data of {@link IHumanInterruptRow}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each list holds.
 * @evidence contracts/development/design.md#principled-representation Closed lists as data, from which the row's member types are read.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two lists a page and a test generator read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace IHumanInterruptRow {
  /** The transitions a cut runs, as data. */
  export const KINDS = ["inertialize", "redirect", "phase"] as const;

  /** What a transition may carry unchanged, as data. */
  export const KEEPS = ["stanceFoot", "guard", "grip"] as const;
}
