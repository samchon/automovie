import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One supporting plane of the hull with its boundary. The hull of one point
 * set.
 */
export namespace IAutoMoviePhysicalHullFaces {
  /** One supporting plane of the hull with its boundary. */
  export interface IFace {
    /** Outward unit normal, shape-local. */ normal: IAutoMovieVector3;
    /** The plane's distance from the origin along the normal, metres. */ offset: number;
    /** Boundary vertices, counter clockwise seen from outside. */ loop: IAutoMovieVector3[];
  }

  /** The hull of one point set. */
  export interface IHull {
    /** Every face; empty when the points span no volume. */ faces: IAutoMoviePhysicalHullFaces.IFace[];
    /** The points that are corners of some face. */ vertices: IAutoMovieVector3[];
    /** Mean of the vertices, shape-local metres. */ centre: IAutoMovieVector3;
    /** Radius about `centre` of a sphere containing the hull, metres. */ radius: number;
    /**
     * Least distance from `centre` to a face plane, metres: a sphere of this
     * radius about `centre` lies inside the hull. Zero without faces.
     */ depth: number;
    /**
     * Greatest depth of any input point below the surface, metres: at most
     * `tolerance` when every point lies on the surface.
     */ buried: number;
    /** The coplanarity tolerance used, metres: 1e-9 of the extent. */ tolerance: number;
    /** The flat form of the faces the proximity read walks; built with the hull. */ flat?: IFlat;
    /** Every distinct edge as its two corner points; built with the hull. */ edges?: [
      IAutoMovieVector3,
      IAutoMovieVector3,
    ][];
  }

  /**
   * A hull's planes and edges as flat arrays: per face its normal and offset;
   * per edge, in its face's loop order, its start, its vector, its squared
   * length, its inward direction in the face and that direction's product with
   * the start; `starts` bounds each face's edges.
   */
  export interface IFlat {
    /** Four numbers per face: the normal and the offset. */ planes: number[];
    /** Each face's first edge, and the count of edges at the end. */ starts: number[];
    /** Eleven numbers per edge. */ edges: number[];
  }
}
