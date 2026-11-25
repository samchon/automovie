import type { IAutoMovieLoftChain } from "../../construction/IAutoMovieLoftChain";
import type { IAutoMovieHumanLoftMesh } from "../lofting/IAutoMovieHumanLoftMesh";
import type { IAutoMovieHumanBodyApertures } from "./IAutoMovieHumanBodyApertures";
import type { IAutoMovieHumanBranchEvent } from "./IAutoMovieHumanBranchEvent";
import type { IAutoMovieHumanConstructionPath } from "./IAutoMovieHumanConstructionPath";
import type { IAutoMovieHumanSurfaceAppendage } from "./IAutoMovieHumanSurfaceAppendage";
import type { IAutoMovieHumanSurfaceBoundary } from "./IAutoMovieHumanSurfaceBoundary";
import type { IAutoMovieHumanSurfacePole } from "./IAutoMovieHumanSurfacePole";

/** Mutable buffers and shared boundary ownership for one body generation.
 */
export interface IAutoMovieHumanSurfaceContext {
  /** Skin buffers shared by all chains, in calibration millimetres. */
  mesh: IAutoMovieHumanLoftMesh.IContext;
  /** Calibration chains indexed by their source graph identity. */
  chains: Map<string, IAutoMovieLoftChain>;
  /** Parent/child contact events. */
  events: IAutoMovieHumanBranchEvent[];
  /** Calibrated poles indexed by chain name and end. */
  poles: Map<string, IAutoMovieHumanSurfacePole>;
  /** Resolved shared boundaries indexed by chain name and end. */
  boundaries: Map<string, IAutoMovieHumanSurfaceBoundary>;
  /** Station bisection chord tolerance, millimetres. */
  tolerance: number;
  /** Opening outlines and seated eyelids prepared once for this generation. */
  apertures: IAutoMovieHumanBodyApertures.IPrepared[];
  /**
   * World boxes `[min, max]` in mm where a chain's stations are refined to
   * the aperture spacing, for colour boundaries drawn on the skin such as
   * the lips; empty when none.
   */
  details: [[number, number, number], [number, number, number]][];
  /** Original calibration index of each chain. */
  indices: Map<string, number>;
  /** Flat chain-index, station-mm and phase-radian triples per generated vertex. */
  coordinates: number[];
  /** Solid tessellation's world normals, borrowed at its original output offset. */
  solidNormals?: {
    /** First scalar index of the solid positions in the ordinary skin buffers. */
    start: number;
    /** Indexed normals of the solid vertices, NaN when the grid owns no jet. */
    values: number[];
  };
  /** Rows and separatrices emitted by contacts that own a web. */
  webPaths: IAutoMovieHumanConstructionPath[];
  /** Shared slit vertex indices whose normals come from their incident faces. */
  pinches: Set<number>;
  /** Generated dome vertex indices and their analytic unit normals. */
  domeNormals: [number, [number, number, number]][];
  /**
   * Loops on each base chain, by its name: an appendage's root loop or an
   * opening's trim loop, sampled in the base chart as `[station, phase]`.
   */
  roots: Map<
    string,
    {
      /** Appendage boundary being joined to this host surface. */
      appendage?: IAutoMovieHumanSurfaceAppendage;
      /** Prepared aperture and its host-surface boundary ownership. */
      opening?: IAutoMovieHumanBodyApertures.IPrepared;
      /** Ordered aperture boundary in the host's station/phase chart: millimetres and radians. */
      loop: [number, number][];
      /**
       * For an opening whose trim spans two chains, the key of the one hole
       * both chains leave their cells in (`AutoMovieHumanApertureSpan.key`).
       */
      span?: string;
    }[]
  >;
  /** Root end ring of every appendage chain, in its own phases, once lofted. */
  ends: Map<
    string,
    {
      /** Emitted vertex indices of this appendage chain's root end ring, in the order of its corresponding phase samples. */
      ring: number[];
      /** Corresponding section phases in radians, retained as a borrowed readonly sequence. */
      phases: readonly number[];
    }
  >;
  /**
   * Cells a base left out inside its root loops, by base chain name, or by
   * the span key of an opening whose trim spans two chains: each cell's
   * corner vertices in ring order, and every corner's chart point and chain.
   */
  holes: Map<
    string,
    {
      /** Left-out cells: a band's quads and a zipper's triangles, corners in ring order. */
      cells: number[][];
      /** Every corner's chart point on its own chain. */
      charts: Map<number, [number, number]>;
      /** Every corner's chain, which a hole spanning two chains needs to read its charts. */
      owners: Map<number, string>;
    }
  >;
  /**
   * The rim of every opening closed from its trim loop, by the opening's name:
   * the loop's points on its base chain, in loop order, mm.
   */
  rims: Map<string, [number, number, number][]>;
}
