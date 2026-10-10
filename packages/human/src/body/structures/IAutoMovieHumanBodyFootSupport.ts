import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieHumanBodySide } from "../anatomy/identity/AutoMovieHumanBodySide";

/**
 * One foot's geometric support against the ground plane: its lowest posed
 * skin point and that point's height above the plane.
 *
 * A positive gap is a foot clear of the ground, a negative one a foot through
 * it. This is a final-surface reading, not a pressure or contact simulation.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyFootSupport {
  /** The foot read. */
  side: AutoMovieHumanBodySide;

  /** The foot region's lowest posed skin point, metres. */
  lowest: IAutoMovieVector3;

  /** Height of that point above the ground plane, metres; negative is through it. */
  gapMetres: number;
}
