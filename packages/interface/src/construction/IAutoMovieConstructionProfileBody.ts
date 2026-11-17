import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * Collapsed profile ends retained between face publication and skin closure.
 *
 * @evidence contracts/development/design.md#principled-representation Keeps a singular tip separate from the regular millimetre station grid and its shared mesh boundary.
 * @evidence contracts/development/design.md#minimal-and-owned-surface ProfileBody produces records that ProfileSkin consumes after drawing the faces.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A retained end is not permission to cap a partially trimmed ring; ProfileSkin admits the complete source boundary.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the publication-to-closure lifetime and separate tip/grid roles.
 */
export namespace IAutoMovieConstructionProfileBody {
  /**
     * An actual collapsed endpoint and its existing neighboring regular ring.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Distinguishes physical tip and regular-ring stations, body vertex IDs and face-local normalized phase checks.
     * @evidence contracts/development/design.md#principled-representation Actual shared ring edges and their original chart addresses identify the cap strip without requesting a singular tip jet.
     * @evidence contracts/development/design.md#minimal-and-owned-surface ProfileBody creates the arrays; ProfileSkin checks each edge against drawn open boundaries before reusing the vertices in a fan.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts The record alone proves neither a complete kept ring nor collapse at every clock; drawing checks trim intersections, tip membership and shared edge IDs.
     */
    export interface IEnd {
      /** Original collapsed point belongs to this actual retained surface. */
      surface: IAutoMovieSolidSurface;

      /** Actual physical station mm, not the first regular tessellation row. */
      station: number;
  
      /** Actual neighboring regular ring station mm; its original cap strip is not a trimmed patch. */
      regular: number;
  
      /** Positive native boundary traversal: bottom reverses the loop clock. */
      vertices: number[];

      /** One check per arc in piece traversal order, independent of the bottom end's reversed vertex traversal. */
      checks: {
        /** Index of the retained face in the same body's faces array. */
        face: number;

        /** Arc midpoint in that piece's normalized [0,1] coordinate, used at the actual tip station. */
        phase: number;

        /** Shared mesh vertex ID at the arc's first endpoint. */
        from: number;

        /** Shared mesh vertex ID at the arc's next endpoint, possibly in the next piece. */
        to: number;
      }[];
    }
}
