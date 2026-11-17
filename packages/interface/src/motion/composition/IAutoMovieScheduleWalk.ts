import type { IAutoMovieResolveSchedule } from "./IAutoMovieResolveSchedule";
import type { IAutoMovieSchedule } from "./IAutoMovieSchedule";

/** Data and callback contracts shared by the ScheduleWalk operations. */
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
      laws: IAutoMovieResolveSchedule.ILaws;
  
      /** Entries placed so far, in walk order. */
      entries: IAutoMovieSchedule.IEntry[];
  
      /** Each anchor's contact instant, or its start when it has none, film seconds. */
      anchors: Map<string, number>;
  
      /** The index an entry's cut is followed by, by the cut entry's index. */
      interrupted: Map<number, number>;
  
      /** The entry each anchor names. */
      anchored: Map<string, IAutoMovieSchedule.IEntry>;
  
      /** The cue tracks of the laws. */
      tracks: Map<string, readonly IAutoMovieResolveSchedule.ICue[]>;
    }
}
