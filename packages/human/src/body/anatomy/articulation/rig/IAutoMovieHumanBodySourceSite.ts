import type { IAutoMovieVector3 } from "@automovie/interface";

/** A shared source-owned bone-local articulation or tissue attachment site. */
export interface IAutoMovieHumanBodySourceSite {
  /** Stable site name referenced by the joint, muscle, connective and skin owners. */
  id: string;

  /** Source annotation in the owning bone's rest-local metre frame. */
  position: IAutoMovieVector3;

  /** Actual quantity/annotation protocol and source locator; no personal reconstruction is implied. */
  account: string;

  /** Source or authored-reference qualification preserved with the site. */
  qualification: string;
}
