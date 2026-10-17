import { IAutoMovieSurfaceNetwork } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanRing } from "./IAutoMovieHumanRing";
import { IAutoMovieHumanSkinDomain } from "./IAutoMovieHumanSkinDomain";
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

  /** The surface network the cage was sampled from, kept for inspection only: absent for a part that is not lofted from a network, and never emitted into the model. */
  construction?: IAutoMovieHumanCage.IConstruction;
}
export namespace IAutoMovieHumanCage {
  /**
   * One control point.
   *
   * @author Samchon
   */
  export interface IVertex {
    /** Control point, model frame, millimetres. Not on the limit surface itself. */
    position: IAutoMovieVector3;

    /** Initial pre-inverse coordinates, independent active limit equality and coarse-control anchor, in the model frame and millimetres. Omitted on parts retaining their original representation. */
    fitting?: {
      /** Initial buffer in model millimetres, including original control pins; not an unfiltered geometric curve. */
      sample: IAutoMovieVector3;
      /** Original active C limit equality in model millimetres, or null for a held/pinned control. */
      target: IAutoMovieVector3 | null;
      /** Keep the original coarse control position, independently of any limit equality. */
      anchor: boolean;
    };
  }

  /**
   * One quad, its corners counterclockwise seen from outside the body so the right-hand normal points outward, the glTF front-face convention.
   *
   * Addresses are per corner, face-varying like UVs, because one control point can sit on two charts: a ring vertex after joining belongs to both parts of its site, and a vertex on a chart's wrap meridian is at `v = 0` for the faces on one side and `v = 1` for those on the other. Landmarks use these evaluation addresses. UVs use them by default, or an explicitly declared logical texture domain in `uvs`; neither address is inferred from vertex indices.
   *
   * @author Samchon
   */
  export interface IFace {
    /** Source skin role carried into texture eligibility; omitted retains the legacy uniform engineering field, not anatomical certification. */
    skin?: IAutoMovieHumanSkinDomain.Role;

    /** Vertex indices of the four corners. */
    vertices: [number, number, number, number];

    /** Named generating region; faces with the same name are fitted together on joined topology. */
    fitting?: string;
    /** Optional face-varying UVs in the published unit atlas. Texture charts may use logical stations while evaluation addresses retain physical parameters. Omitted, the layout maps `coordinates`. */
    uvs?: [
      [number, number],
      [number, number],
      [number, number],
      [number, number],
    ];

    /** Semantic address of each corner on this face's part chart, aligned with `vertices`. */
    coordinates: [
      IAutoMovieHumanSurfaceCoordinate,
      IAutoMovieHumanSurfaceCoordinate,
      IAutoMovieHumanSurfaceCoordinate,
      IAutoMovieHumanSurfaceCoordinate,
    ];
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

  /**
   * The surface network a lofted part was sampled from, and where its points land on the person.
   *
   * The network is in its own frame, in metres; a point `p` of it lies at `origin + x·p.x + y·p.y + z·p.z` in the cage's model frame, in millimetres. Lofts built in the model frame give the identity scaled to millimetres; the hand and the foot, built in their own frames, give those frames.
   *
   * @author Samchon
   */
  export interface IConstruction {
    /** The network, as sampled into the cage. */
    network: IAutoMovieSurfaceNetwork;

    /** Model point of the network's origin, millimetres. */
    origin: IAutoMovieVector3;

    /** Model displacement of one metre along the network's X, millimetres. */
    x: IAutoMovieVector3;

    /** Model displacement of one metre along the network's Y, millimetres. */
    y: IAutoMovieVector3;

    /** Model displacement of one metre along the network's Z, millimetres. */
    z: IAutoMovieVector3;

    /** The part's relief forms as curves on its surface before the relief, model frame, millimetres: each form's centre line and half-height border; omitted, none. */
    relief?: IRelief[];
  }

  /**
   * One curve of a part's relief, for inspection.
   *
   * @author Samchon
   */
  export interface IRelief {
    /** The form and which of its lines this is. */
    name: string;

    /** Whether the curve closes on itself. */
    closed: boolean;

    /** Its points, model frame, millimetres. */
    points: IAutoMovieVector3[];
  }

  /**
   * The construction of a network built in the model frame, in metres.
   *
   * @param network The network
   * @returns Its construction
   */
  export function inModel(network: IAutoMovieSurfaceNetwork): IConstruction {
    return {
      network,
      origin: { x: 0, y: 0, z: 0 },
      x: { x: 1000, y: 0, z: 0 },
      y: { x: 0, y: 1000, z: 0 },
      z: { x: 0, y: 0, z: 1000 },
    };
  }
}
