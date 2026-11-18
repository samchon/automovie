import type {
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionHumanInterrupt,
  IAutoMovieMotionHumanInterruptRow,
} from "@automovie/interface";

/**
 * Cancel rows by name: when an action may be cancelled, as a window of its
 * phrase, and how fast the next action blends in.
 *
 * A cancel table's row is a window, a kind, an entry share and a blend. Most
 * rows are one of four windows (any time, or from one of the phrase's
 * instants to the end) and one of three blends, entered at the next action's
 * start by inertialization. This owner names both, so a table reads as
 * `guard: ["fromStroke", "smooth"]`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a row is and what the names replace.
 * @evidence contracts/development/design.md#principled-representation A window is named by the phrase instant that opens it, the way the action clock names time; a blend is named by how abrupt the cancel is.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two unions, one table and two functions; the only owner of named cancel rows.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The result is the existing `HumanInterruptRow`, so a row no name states is still written by hand beside the named ones.
 */
export namespace AutoMovieMotionHumanInterrupt {
  /** The windows of {@link IAutoMovieMotionHumanInterrupt.Window}, as data. */
  export const WINDOWS = [
    "anytime",
    "fromStroke",
    "fromStrokeEnd",
    "fromRelax",
  ] as const satisfies readonly NonNullable<IAutoMovieMotionHumanInterrupt.Window>[];

  /** The blends of {@link IAutoMovieMotionHumanInterrupt.Blend}, as data. */
  export const BLEND_NAMES = [
    "reflex",
    "quick",
    "smooth",
    "deliberate",
  ] as const satisfies readonly NonNullable<IAutoMovieMotionHumanInterrupt.Blend>[];

  /**
   * The seconds of each blend (the values the reaction and everyday laws
   * shipped with; provisional, no measured blend time of a human transition
   * located): `reflex` 0.08, a blow that overrides what the body was doing;
   * `quick` 0.1, a defence; `smooth` 0.15, a voluntary change of one
   * gesture; `deliberate` 0.3, a change of the whole body's action (sitting
   * down, standing up, setting off, putting a task down), which every
   * everyday and locomotion cancel row reads here.
   */
  export const BLENDS: Readonly<
    Record<IAutoMovieMotionHumanInterrupt.Blend, number>
  > = {
    reflex: 0.08,
    quick: 0.1,
    smooth: 0.15,
    deliberate: 0.3,
  };

  /**
   * One cancel row.
   *
   * @param window When the cancel is allowed.
   * @param blend How fast the next action blends in.
   * @returns The row: inertialized, entering the next action at its start.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the fixed kind and entry of the result.
   * @evidence contracts/development/implementation.md#principled-implementation `anytime` is the whole action; the other windows open at the named phrase instant and close at the end.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One exhaustive switch and one record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No share of the duration is typed: a window opens at an instant the action's clock resolves.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function row(
    window: IAutoMovieMotionHumanInterrupt.Window,
    blend: IAutoMovieMotionHumanInterrupt.Blend,
  ): IAutoMovieMotionHumanInterruptRow {
    const opens = (): IAutoMovieMotionHumanInterruptRow["window"] => {
      switch (window) {
        case "anytime":
          return [0, 1];
        case "fromStroke":
          return ["stroke", 1];
        case "fromStrokeEnd":
          return ["strokeEnd", 1];
        case "fromRelax":
          return ["relax", 1];
      }
    };
    return {
      window: opens(),
      kind: "inertialize",
      entry: 0,
      blend: BLENDS[blend],
    };
  }

  /**
   * A cancel table of one named row per next action.
   *
   * @param rows The window and the blend of each next action.
   * @returns The table a law's `interrupts` takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the result's consumer.
   * @evidence contracts/development/implementation.md#principled-implementation Each entry becomes a one-row list through `row`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the entries.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Adds no row the caller did not state.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates every row to `row`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the entries, with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function table(
    rows: Partial<
      Record<
        AutoMovieMotionHumanActionKey | "any",
        readonly [
          IAutoMovieMotionHumanInterrupt.Window,
          IAutoMovieMotionHumanInterrupt.Blend,
        ]
      >
    >,
  ): Partial<
    Record<
      AutoMovieMotionHumanActionKey | "any",
      IAutoMovieMotionHumanInterruptRow[]
    >
  > {
    const out: Partial<
      Record<
        AutoMovieMotionHumanActionKey | "any",
        IAutoMovieMotionHumanInterruptRow[]
      >
    > = {};
    for (const [name, spec] of Object.entries(rows) as [
      AutoMovieMotionHumanActionKey | "any",
      readonly [
        IAutoMovieMotionHumanInterrupt.Window,
        IAutoMovieMotionHumanInterrupt.Blend,
      ],
    ][])
      out[name] = [row(spec[0], spec[1])];
    return out;
  }
}
