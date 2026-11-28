import type { IAutoMovieConstructionProfilePiece } from "./IAutoMovieConstructionProfilePiece";

/**
 * Oriented closed contour or hole over a retained station interval in metres.
 * Its ordered curve pieces join on that interval. Plane winding and the sign of
 * the outward world surface are declared separately. Omission of pole keeps
 * both ends regular and open.
 */
export interface IAutoMovieConstructionProfileLoop {
  /** Unique loop identity within the generating family. */
  id: string;

  /** Outer contour or hole in the original plane. */
  kind: "outer" | "hole";

  /** Signed winding of the ordered pieces in the original plane. */
  orientation: 1 | -1;

  /**
   * Outward sign of the world station/traversal cross product. Omission uses
   * +1.
   */
  surfaceOrientation?: 1 | -1;

  /** Retained physical station interval in metres inside the family's domain. */
  domain: [number, number];

  /**
   * End or ends where the whole loop collapses to a point. Omission leaves open
   * regular ends.
   */
  pole?: "bottom" | "top" | "both";

  /** Ordered original curve intervals that form the complete contour. */
  pieces: IAutoMovieConstructionProfilePiece[];
}
