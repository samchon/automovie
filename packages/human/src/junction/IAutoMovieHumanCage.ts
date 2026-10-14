import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanRing } from "./IAutoMovieHumanRing";
import { IAutoMovieHumanSurfaceCoordinate } from "./IAutoMovieHumanSurfaceCoordinate";

/**
 * A quad control cage of skin: the coarse polyhedron one Catmull-Clark subdivision turns into the smooth surface.
 *
 * Parts emit cages, junctions join them through their rings, and the joined cage of the whole person is subdivided once, so the surface across every junction is one limit surface: a uniform bicubic B-spline, C2, where the cage is regular and tangent-plane continuous at extraordinary vertices (Catmull and Clark 1978, Computer-Aided Design 10(6):350-355; Stam 1998, SIGGRAPH '98, pp. 395-404). Seams are therefore smooth by construction rather than repaired afterwards. The record maps one to one onto a polygon cage of positions and faces, with optional semi-sharp creases (US patent 6,222,553, hybrid subdivision; OpenSubdiv documentation, "Subdivision Surfaces"), which is what a subdivision routine consumes.
 *
 * Within one profile every identity yields the same connectivity, faces and rings; only positions change. That invariant is what lets one UV layout, one texture or one garment fit every person.
 *
 * Positions are millimetres in the model frame of the skeleton.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanCage {
  /** Cage vertices; faces, creases and rings index into this list. */
  vertices: IAutoMovieHumanCage.IVertex[];

  /** Quad faces. */
  faces: IAutoMovieHumanCage.IFace[];

  /** Semi-sharp edges; empty for a fully smooth cage. */
  creases: IAutoMovieHumanCage.ICrease[];

  /** Openings not yet joined; empty once the person is closed. */
  rings: IAutoMovieHumanRing[];
}
export namespace IAutoMovieHumanCage {
  /**
   * One control point with its semantic address.
   *
   * @author Samchon
   */
  export interface IVertex {
    /** Control point, model frame, millimetres. Not on the limit surface itself. */
    position: IAutoMovieVector3;

    /** Semantic address of the control point, from which UVs and landmarks are derived. */
    coordinate: IAutoMovieHumanSurfaceCoordinate;
  }

  /**
   * One quad, its corners counterclockwise seen from outside the body so the right-hand normal points outward, the glTF front-face convention.
   *
   * @author Samchon
   */
  export interface IFace {
    /** Vertex indices of the four corners. */
    vertices: [number, number, number, number];
  }

  /**
   * One semi-sharp edge: subdivision applies sharp rules for `sharpness` levels and smooth ones after, interpolating a fractional sharpness, so a lid margin or a vermilion border keeps a defined edge without a seam.
   *
   * @author Samchon
   */
  export interface ICrease {
    /** Vertex indices of the edge's ends; the edge must belong to a face. */
    edge: [number, number];

    /** Number of subdivision levels the edge stays sharp, nonnegative and possibly fractional. */
    sharpness: number;
  }
}
