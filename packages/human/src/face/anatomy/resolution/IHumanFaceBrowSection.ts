import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Where one vertical line of the head frame crosses one eyebrow, on the
 * build's final surface: the lowest and highest crossing points of the brow
 * card's triangles with the plane of constant head-frame X.
 *
 * The brow is one alpha card, so these are the card's borders, standing for
 * the inferior and superior hair margins of the brow envelope.
 *
 * @author Samchon
 */
export interface IHumanFaceBrowSection {
  /** Lowest crossing: the inferior border of the brow card on the vertical. */
  inferior: IAutoMovieVector3;

  /** Highest crossing: the superior border of the brow card on the vertical. */
  superior: IAutoMovieVector3;
}
