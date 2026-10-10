import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Completed surface-boundary stem offered to the guide hierarchy's placer.
 * The metric walker supplies this derived value only after the stem reaches
 * full free clearance. Placement may consume it without restarting the walk;
 * rejection continues that same state and budget. This is a numerical surface
 * proxy, not a buried follicle or a personal authoring input.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceHairRootedTransition {
  /** Root and all actual stem stations, through the first full-clearance row. */
  points: readonly IAutoMovieVector3[];

  /** First full-clearance station; equals points.length-1 in this handoff. */
  freeFrom: number;

  /** Actual stem metric already spent, in metres. */
  travelled: number;

  /** Target total metric, including this stem, in metres. */
  targetLength: number;

  /** Free fibre-path clearance, including the existing rounding allowance. */
  clearance: number;

  /** Original current root triangle's outward unit normal. */
  normal: IAutoMovieVector3;
}
