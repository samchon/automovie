import type {
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionHumanInterrupt,
  IAutoMovieMotionHumanInterruptRow,
} from "@automovie/interface";

/** The alternatives of `TableItem`'s site. */
type TableItem = AutoMovieMotionHumanActionKey | "any";

/** The alternatives of `OutEntryItem`'s site. */
type OutEntryItem = AutoMovieMotionHumanActionKey | "any";

/** The alternatives of `TableEntryItemResult`'s site. */
type TableEntryItemResult = AutoMovieMotionHumanActionKey | "any";

/** The alternatives of `RowsEntryItem`'s site. */
type RowsEntryItem = AutoMovieMotionHumanActionKey | "any";

/**
 * Cancel rows by name: when an action may be cancelled, as a window of its
 * phrase, and how fast the next action blends in.
 *
 * A cancel table's row is a window, a kind, an entry share and a blend. Most
 * rows are one of four windows (any time, or from one of the phrase's instants
 * to the end) and one of three blends, entered at the next action's start by
 * inertialization. This owner names both, so a table reads as `guard:
 * ["fromStroke", "smooth"]`.
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
   * `quick` 0.1, a defence; `smooth` 0.15, a voluntary change of one gesture;
   * `deliberate` 0.3, a change of the whole body's action (sitting down,
   * standing up, setting off, putting a task down), which every everyday and
   * locomotion cancel row reads here.
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
   */
  export function table(
    rows: Partial<
      Record<
        RowsEntryItem,
        readonly [
          IAutoMovieMotionHumanInterrupt.Window,
          IAutoMovieMotionHumanInterrupt.Blend,
        ]
      >
    >,
  ): Partial<
    Record<TableEntryItemResult, IAutoMovieMotionHumanInterruptRow[]>
  > {
    const out: Partial<
      Record<OutEntryItem, IAutoMovieMotionHumanInterruptRow[]>
    > = {};
    for (const [name, spec] of Object.entries(rows) as [
      TableItem,
      readonly [
        IAutoMovieMotionHumanInterrupt.Window,
        IAutoMovieMotionHumanInterrupt.Blend,
      ],
    ][])
      out[name] = [row(spec[0], spec[1])];
    return out;
  }
}
