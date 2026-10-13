import { IAutoMovieFormationDesign } from "@automovie/interface";

/**
 * The arrangement a unit is travelling toward, and how far along it is.
 *
 * Carried beside the sampled state rather than inside it, because `from` and
 * `to` are what an author writes and a re-form is a property of the cue rather
 * than of either end: a cue states one target arrangement, and both its ends
 * describe the same unit standing in different places. `progress` is the cue's
 * own eased progress, so a re-form bends on the curve its author declared and
 * not on a second one.
 */
export interface IAutoMovieFormationReform {
  /** The arrangement the unit is in when the cue ends. */
  layout: IAutoMovieFormationDesign["layout"];
  /** Eased fraction of the way there, 0 at the cue's start and 1 at its end. */
  progress: number;
}
