import type { IAutoMovieScheduleContext } from "./IAutoMovieScheduleContext";
import type { IAutoMovieScheduleCue } from "./IAutoMovieScheduleCue";
import type { IAutoMovieScheduleEntry } from "./IAutoMovieScheduleEntry";
import type { IAutoMovieScheduleLaws } from "./IAutoMovieScheduleLaws";

/**
 * Data and callback contracts shared by the ScheduleWalk operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation One schedule walk owns mutable entries and anchor, interrupted-entry, anchored-entry and cue-track maps. Entry indices are walk order and anchor/cue instants are film seconds; the placement and cut routines share this context only during resolution.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This namespace groups the IAutoMovieScheduleWalk contracts used by packages/engine/src/composition/AutoMovieScheduleWalk.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.
 * @evidence contracts/development/design.md#principled-representation One schedule walk owns mutable entries and anchor, interrupted-entry, anchored-entry and cue-track maps. Entry indices are walk order and anchor/cue instants are film seconds; the placement and cut routines share this context only during resolution. The namespace groups these type contracts without implementing the operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieScheduleWalk contract belongs to interface; packages/engine/src/composition/AutoMovieScheduleWalk.ts and packages/engine/src/composition/AutoMovieScheduleCut.ts use its nested records and callbacks. Runtime computation remains with those consumers.
 */
export namespace IAutoMovieScheduleWalk {
  /**
   * What one walk keeps.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member, its keys and its unit.
   * @evidence contracts/development/design.md#principled-representation The placed entries, the anchors' instants, the cuts' successors, the anchored entries and the cue tracks are the five things a later placement reads of an earlier one.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members, all read by the cut, the placements and the walk.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No composition is named and nothing outlives the walk.
   */
  export interface IWalk {
    /** The production's pure laws. */
    laws: IAutoMovieScheduleLaws;

    /** Entries placed so far, in walk order. */
    entries: IAutoMovieScheduleEntry[];

    /** Each anchor's contact instant, or its start when it has none, film seconds. */
    anchors: Map<string, number>;

    /** The index an entry's cut is followed by, by the cut entry's index. */
    interrupted: Map<number, number>;

    /** The entry each anchor names. */
    anchored: Map<string, IAutoMovieScheduleEntry>;

    /** The cue tracks of the laws. */
    tracks: Map<string, readonly IAutoMovieScheduleCue[]>;

    /**
     * Places a subject's waiting parallel part on a law's read (`IAutoMovieScheduleContext.demand`); absent where the walk places in declaration order only.
     */
    demand?: (subject: string) => IAutoMovieScheduleContext.Demand;

    /**
     * The start of the first waiting or placing part that holds a subject's next actions (`IAutoMovieScheduleContext.horizon`); absent where the walk places in declaration order only.
     */
    horizon?: (subject: string) => number | undefined;

    /**
     * The start of the parallel group a subject shares with the action being timed (`IAutoMovieScheduleContext.meeting`); absent where the walk places in declaration order only.
     */
    meeting?: (subject: string) => number | undefined;

    /**
     * Places the waiting part that holds an anchored intent (`IAutoMovieScheduleContext.demandAnchor`); absent where the walk places in declaration order only.
     */
    demandAnchor?: (anchor: string) => IAutoMovieScheduleContext.Demand;

    /** The index of the entry the last placed intent pushed. */
    last?: number;
  }
}
