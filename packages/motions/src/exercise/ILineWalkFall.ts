import type { IAutoMovieMotionHumanFoot } from "@automovie/interface";

/** One footfall of a line walk's foot (`lineWalk`): when it lands and where. */
export interface ILineWalkFall {
  /** Seconds since the walk's start; 0 for the entry's stance. */
  at: number;

  /** The foot's placement on landing. */
  place: IAutoMovieMotionHumanFoot.IPlacement;
}
