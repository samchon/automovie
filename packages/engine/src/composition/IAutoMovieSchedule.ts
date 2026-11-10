import type { IAutoMovieIntent } from "./IAutoMovieIntent";

/**
 * A composition resolved on the film clock: frozen, ordered entries a
 * renderer, a physics pass or a measurement reads without re-resolving.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (A composition resolved on the film clock: frozen, ordered entries a renderer, a physics pass or a measurement reads without re-resolving) and documents 2 documented members as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents A composition resolved on the film clock: frozen, ordered entries a renderer, a physics pass or a measurement reads without re-resolving: interface of 2 members (`entries`, `duration`); units and frames named in its text: seconds. It has no optional member, so no absent-value state combines with another. 2 members are readonly.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IAutoMovieSchedule` in packages/engine/src/composition/IAutoMovieSchedule.ts; its surface is the 2 members listed and the text shows 23 other files naming it, mostly movies (17), packages/engine (5), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export interface IAutoMovieSchedule {
  /** Every placed intent, by start then walk order. */
  readonly entries: readonly IAutoMovieSchedule.IEntry[];

  /** Seconds from 0 to the last entry's end. */
  readonly duration: number;
}
/** Companion types of {@link IAutoMovieSchedule}. */
export namespace IAutoMovieSchedule {
  /**
   * One placed intent.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: One placed intent.
   * @evidence contracts/development/design.md#principled-representation Represents One placed intent: interface of 8 members (`index`, `subject`, `intent`, `start`, `contact`, `end`, ...); units and frames named in its text: seconds. Optional members `contact`, `outcome`, `state` express documented absence, and the ranges its member docs state are left to runtime validation. 8 members are readonly.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IEntry` in packages/engine/src/composition/IAutoMovieSchedule.ts; its surface is the 8 members listed and the text shows 31 other files naming it, mostly packages/engine (12), movies (10), test (5), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, a use of `unknown`, no index signature and no cast; 3 optional members (`contact`, `outcome`, `state`) are independent fields rather than alternatives of one another as far as their docs state; it duplicates no type that another owner declares as far as a name search shows. The widening above is the remaining shortcut and is not justified here.
   */
  export interface IEntry {
    /** Walk-order index, stable for one composition. */
    readonly index: number;

    /** The acting subject's id. */
    readonly subject: string;

    /** The intent. */
    readonly intent: IAutoMovieIntent;

    /** Start, seconds. */
    readonly start: number;

    /** Contact or decisive instant, seconds, when the timing declares one. */
    readonly contact?: number;

    /** End, seconds; at least `start`. */
    readonly end: number;

    /** The production's outcome class, when its outcome function gives one. */
    readonly outcome?: string;

    /** The production's state snapshot after this entry, when its state function gives one. */
    readonly state?: unknown;

    /** Where the intent was cut, when it was: the share of its full duration and the event named, if any. */
    readonly cut?: { readonly share: number; readonly event?: string };

    /** The intent's named events in film seconds, as its timing declared them, before any cut. */
    readonly events?: readonly {
      readonly name: string;
      readonly seconds: number;
    }[];

    /** The walk-order index of the entry that starts at this one's cut, when one does. */
    readonly interruptedBy?: number;
  }
}
