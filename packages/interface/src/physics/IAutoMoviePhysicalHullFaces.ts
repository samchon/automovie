import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One supporting plane of the hull with its boundary. The hull of one point set.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the outward plane convention and boundary winding in the hull's local frame. Defines face/corner populations, local centre and the distinct radius, depth, burial and tolerance measurements.
 * @evidence contracts/development/design.md#principled-representation A unit normal, metre signed plane offset and counter-clockwise metre vertices represent one convex supporting face. Shape-local metre geometry carries a containing radius and inscribed depth; empty faces denote a point set spanning no volume.
 * @evidence contracts/development/design.md#minimal-and-owned-surface physicalHullFaces supplies these planes and loops to hull mass, containment and nearest-surface calculations. physicalHullFaces owns this shared hull analysis used by mass-property admission and nearest-surface readers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The producer constructs the boundary ordering; arbitrary vector arrays cannot establish convexity or unit normals by type alone. Burial is measured against actual input points; tolerance is extent-derived, and a degenerate hull does not receive invented volume.
 */
export namespace IAutoMoviePhysicalHullFaces {
  /**
   * One supporting plane of the hull with its boundary.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Gives the outward plane convention and boundary winding in the hull's local frame.
   * @evidence contracts/development/design.md#principled-representation A unit normal, metre signed plane offset and counter-clockwise metre vertices represent one convex supporting face.
   * @evidence contracts/development/design.md#minimal-and-owned-surface physicalHullFaces supplies these planes and loops to hull mass, containment and nearest-surface calculations.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The producer constructs the boundary ordering; arbitrary vector arrays cannot establish convexity or unit normals by type alone.
   */
  export interface IFace {
    /** Outward unit normal, shape-local. */ normal: IAutoMovieVector3;
    /** The plane's distance from the origin along the normal, metres. */ offset: number;
    /** Boundary vertices, counter clockwise seen from outside. */ loop: IAutoMovieVector3[];
  }

  /**
   * The hull of one point set.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines face/corner populations, local centre and the distinct radius, depth, burial and tolerance measurements.
   * @evidence contracts/development/design.md#principled-representation Shape-local metre geometry carries a containing radius and inscribed depth; empty faces denote a point set spanning no volume.
   * @evidence contracts/development/design.md#minimal-and-owned-surface physicalHullFaces owns this shared hull analysis used by mass-property admission and nearest-surface readers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Burial is measured against actual input points; tolerance is extent-derived, and a degenerate hull does not receive invented volume.
   */
  export interface IHull {
    /** Every face; empty when the points span no volume. */ faces: IAutoMoviePhysicalHullFaces.IFace[];
    /** The points that are corners of some face. */ vertices: IAutoMovieVector3[];
    /** Mean of the vertices, shape-local metres. */ centre: IAutoMovieVector3;
    /** Radius about `centre` of a sphere containing the hull, metres. */ radius: number;
    /** Least distance from `centre` to a face plane, metres: a sphere of this radius about `centre` lies inside the hull. Zero without faces. */ depth: number;
    /** Greatest depth of any input point below the surface, metres: at most `tolerance` when every point lies on the surface. */ buried: number;
    /** The coplanarity tolerance used, metres: 1e-9 of the extent. */ tolerance: number;
  }
}
