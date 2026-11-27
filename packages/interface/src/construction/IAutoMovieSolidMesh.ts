import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/** Data and callback contracts shared by the SolidMesh operations. */
export namespace IAutoMovieSolidMesh {
  /** One evaluating surface, registered by its unique source name. */
  export interface IOwner {
    /** The surface's name. */
    name: string;

    /** Read a point in the owner's native chart, returning world millimetres. */
    point(a: number, b: number): AutoMovieVector3Tuple;
  }

  /** Parallel indexed geometry buffers and their evaluating owners. */
  export interface IMesh {
    /** Flat `[x, y, z, ...]` positions, mm. */
    positions: number[];

    /** Flat triangle indices, outward. */
    indices: number[];

    /** Flat `[owner, a, b]` per vertex. */
    coordinates: number[];

    /** Owners by index. */
    owners: IAutoMovieSolidMesh.IOwner[];

    /**
     * The edge incidence of the triangles read so far, kept with a mesh made by
     * AutoMovieEngineSolidMesh.create; a mesh without one is read whole on demand.
     */
    ledger?: IAutoMovieSolidMesh.ILedger;
  }

  /**
   * A mesh's edge incidence as its faces read it, with the index prefix it was
   * read from.
   */
  export interface ILedger {
    /** The mesh's indices as last read, a copy. */
    seen: number[];

    /** Unoriented endpoint pairs minID/maxID of the read triangles. */
    occupied: Set<string>;

    /**
     * How many read triangles hold each unoriented pair, so a pair leaves
     * occupied with its last triangle.
     */
    pairs: Map<string, number>;

    /** How many read triangles hold each directed edge /b. */
    directed: Map<string, number>;
  }

  /** An authoritative shared trim boundary, expressed on this face. */
  export interface ILoop {
    /** Which side the face keeps. */
    kind: "hole" | "island" | "start" | "end";

    /** Vertex indices, in loop order. */
    vertices: number[];

    /**
     * Each vertex's chart point `[u, v]` on the face, `v` unwrapped along the
     * loop.
     */
    chart: [number, number][];
  }

  /** A published source rail before indexed seam insertion. */
  export interface ILoopChart {
    /** Which side the face keeps, as {@link ILoop.kind}. */
    kind: IAutoMovieSolidMesh.ILoop["kind"];

    /**
     * Each point `[u, v]` on the face, `v` unwrapped along the loop, in loop
     * order.
     */
    chart: [number, number][];

    /**
     * Each point's face on an atlas host (`AutoMovieEngineSolidRail.IRail.hostFace`);
     * absent, every point on the one face.
     */
    faces?: number[];
  }

  /** One coherent source face and its finite ordered sampling domain. */
  export interface IFace {
    /** The surface. */
    surface: IAutoMovieSolidSurface;

    /**
     * Grid stations (`u`), strictly increasing; the first and last are the
     * face's open ends.
     */
    stations: number[];

    /**
     * Grid phases (`v`), strictly increasing; one period's worth (without its
     * repeat) on a periodic face.
     */
    phases: number[];

    /**
     * Its actual cutting loops; their exposed edges never become source-end
     * caps.
     */
    loops: IAutoMovieSolidMesh.ILoop[];

    /**
     * Optional authoritative vertices on exact original grid sides, preserving
     * shared IDs without cutting the source. Nonperiodic rectangle perimeters
     * use island; periodic sides use their actual start/end role.
     */
    domainLoops?: IAutoMovieSolidMesh.ILoop[];

    /**
     * Whether the face is a diff's cutter, whose kept wall faces into the
     * cutter: the solid's outside there is the cutter's inside. Absent, false.
     */
    inverted?: boolean;

    /** Receive a named planning refusal or partial endpoint diagnostic. */
    onFailure?: (detail: string) => void;
  }

  /** A drawn boundary carrying its actual face occurrences and closing turn. */
  export interface IOpen {
    /** Original committed IDs in positive native boundary traversal. */ vertices: number[];
    /** Same-face [u,v] per occurrence, including accumulated phase lifts. */ chart: [
      number,
      number,
    ][];
    /** Integer closing turn relative to the first occurrence. */ winding: number;
    /** Complete periodic endpoint, otherwise null for a planar domain rim. */ end:
      | "bottom"
      | "top"
      | null;
  }

  /** The two indexed source rails published by a seam. */
  export interface IJoined {
    /** The host's rail as a trim of the host's face. */
    host: IAutoMovieSolidMesh.ILoop;

    /** The part's rail as a trim of the part's face. */
    part: IAutoMovieSolidMesh.ILoop;
  }

  /** A published blend between corresponding host and part rail columns. */
  export interface ISeam {
    /** The host's surface. */
    host: IAutoMovieSolidSurface;

    /** The part's surface. */
    part: IAutoMovieSolidSurface;

    /**
     * Actual blend surface: first coordinate crosses `[0,length]`, second
     * follows its periodic clock.
     */
    blend: IAutoMovieSolidSurface;

    /**
     * Actual increasing blend-clock column coordinates within one period;
     * absent retains the legacy uniform 0..2pi columns.
     */
    phases?: readonly number[];

    /**
     * Upper first-coordinate bound: mm for a legacy blend chain, 1 for a
     * normalized known-port band.
     */
    length: number;

    /** Host rail column k at phases[k], or the legacy default `2pi*k/count`. */
    hostLoop: IAutoMovieSolidMesh.ILoopChart;

    /** The part's rail at the same columns. */
    partLoop: IAutoMovieSolidMesh.ILoopChart;

    /** Rows of the blend between its rails, at least 1. */
    rows: number;
  }
}
