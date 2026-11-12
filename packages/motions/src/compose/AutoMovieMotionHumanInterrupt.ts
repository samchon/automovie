import type { HumanActionKey } from "../HumanActionKey";
import type { IHumanInterruptRow } from "../law/IHumanInterruptRow";

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
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The result is the existing `IHumanInterruptRow`, so a row no name states is still written by hand beside the named ones.
 */
export namespace AutoMovieMotionHumanInterrupt {
  /**
   * When an action may be cancelled: at any time, or from a phrase instant
   * to the end.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the four windows.
   * @evidence contracts/development/design.md#principled-representation The standard instants of a phrase a cancel opens at: its stroke, its stroke's end and its relax.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four names, each used by a shipped cancel table.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A window that opens at an action's own instant is written as a row, not added as a name here.
   */
  export type Window = "anytime" | "fromStroke" | "fromStrokeEnd" | "fromRelax";

  /**
   * How fast the next action blends in.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is named; `BLENDS` gives each time.
   * @evidence contracts/development/design.md#principled-representation Three speeds of an inertialized transition, from a reflex that overrides the body to a voluntary change.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three names, each used by a shipped cancel table.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A closed union keyed into one table.
   */
  export type Blend = "reflex" | "quick" | "smooth";

  /**
   * The seconds of each blend (the values the reaction laws shipped with):
   * `reflex` 0.08, a blow that overrides what the body was doing; `quick`
   * 0.1, a defence; `smooth` 0.15, a voluntary change.
   */
  export const BLENDS: Readonly<Record<Blend, number>> = {
    reflex: 0.08,
    quick: 0.1,
    smooth: 0.15,
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
  export function row(window: Window, blend: Blend): IHumanInterruptRow {
    const opens = (): IHumanInterruptRow["window"] => {
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
    rows: Partial<Record<HumanActionKey | "any", readonly [Window, Blend]>>,
  ): Partial<Record<HumanActionKey | "any", IHumanInterruptRow[]>> {
    const out: Partial<Record<HumanActionKey | "any", IHumanInterruptRow[]>> =
      {};
    for (const [name, spec] of Object.entries(rows) as [
      HumanActionKey | "any",
      readonly [Window, Blend],
    ][])
      out[name] = [row(spec[0], spec[1])];
    return out;
  }
}
