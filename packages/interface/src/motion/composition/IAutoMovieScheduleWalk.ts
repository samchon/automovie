import type { IAutoMovieScheduleContext } from "./IAutoMovieScheduleContext";
import type { IAutoMovieScheduleCue } from "./IAutoMovieScheduleCue";
import type { IAutoMovieScheduleEntry } from "./IAutoMovieScheduleEntry";
import type { IAutoMovieScheduleLaws } from "./IAutoMovieScheduleLaws";

/** Data and callback contracts shared by the ScheduleWalk operations. */
export namespace IAutoMovieScheduleWalk {
  /** What one walk keeps. */
  export interface IWalk {
    /** The production's pure laws. */
    laws: IAutoMovieScheduleLaws;

    /** Entries placed so far, in walk order. */
    entries: IAutoMovieScheduleEntry[];

    /**
     * Each anchor's contact instant, or its start when it has none, film
     * seconds.
     */
    anchors: Map<string, number>;

    /** The index an entry's cut is followed by, by the cut entry's index. */
    interrupted: Map<number, number>;

    /** The entry each anchor names. */
    anchored: Map<string, IAutoMovieScheduleEntry>;

    /** The cue tracks of the laws. */
    tracks: Map<string, readonly IAutoMovieScheduleCue[]>;

    /**
     * Places a subject's waiting parallel part on a law's read
     * (`IAutoMovieScheduleContext.demand`); absent where the walk places in
     * declaration order only.
     */
    demand?: (subject: string) => IAutoMovieScheduleContext.Demand;

    /**
     * The start of the first waiting or placing part that holds a subject's
     * next actions (`IAutoMovieScheduleContext.horizon`); absent where the walk
     * places in declaration order only.
     */
    horizon?: (subject: string) => number | undefined;

    /**
     * The start of the parallel group a subject shares with the action being
     * timed (`IAutoMovieScheduleContext.meeting`); absent where the walk places
     * in declaration order only.
     */
    meeting?: (subject: string) => number | undefined;

    /**
     * Places the waiting part that holds an anchored intent
     * (`IAutoMovieScheduleContext.demandAnchor`); absent where the walk places
     * in declaration order only.
     */
    demandAnchor?: (anchor: string) => IAutoMovieScheduleContext.Demand;

    /** The index of the entry the last placed intent pushed. */
    last?: number;
  }
}
