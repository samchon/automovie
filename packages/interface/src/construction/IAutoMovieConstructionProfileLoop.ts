import type { IAutoMovieConstructionProfilePiece } from "./IAutoMovieConstructionProfilePiece";

/**
 * A complete oriented contour over a physical station interval.
 *
 * Its ordered original pieces close an outer contour or hole. The station
 * domain is in metres inside the family's domain. orientation describes winding
 * in the plane; surfaceOrientation independently sets the world surface sign
 * and defaults to +1. pole declares whole-loop collapse only at named ends; an
 * absent pole leaves regular open ends. AutoMovieConstructionProfile
 * preparation resolves sources and domains; declaring a loop does not prove
 * simplicity or global regularity.
 */
export interface IAutoMovieConstructionProfileLoop {
  /** Unique loop identity in the family. */
  id: string;

  /** Outer component or hole; coincidence with another loop does not sew it. */
  kind: "outer" | "hole";

  /** Signed winding in the common plane's original local coordinates. */
  orientation: 1 | -1;

  /**
   * Sign taking the actual world station/traversal cross product outward;
   * omitted means 1, independently of 2D winding.
   */
  surfaceOrientation?: 1 | -1;

  /** Actual station interval, metres, inside the family's domain. */
  domain: [number, number];

  /**
   * Actual whole-loop point collapse at the named domain ends; absent ends stay
   * regular and open. This declaration supplies no missing physical2.
   */
  pole?: "bottom" | "top" | "both";

  /** Ordered open or whole-period original intervals completing this loop. */
  pieces: IAutoMovieConstructionProfilePiece[];
}
