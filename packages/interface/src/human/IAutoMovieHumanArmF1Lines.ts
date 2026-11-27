import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * Measured arm contours, conic quarter shoulders and world-millimetre triangle
 * buffers.
 *
 * The interface package owns these declarations; AutoMovieHumanArmF1Lines in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanArmF1Lines {
  /**
   * Locally owned mutable world-millimetre triangles, until the region is
   * returned.
   */
  export interface IFixedMesh {
    /** Absolute millimetre positions, three numbers per vertex. */
    positions: number[];

    /** Three vertex indices per emitted triangle. */
    indices: number[];
  }

  /**
   * One ordered, implicitly closed set of measured contour controls and its
   * distal plane normal.
   */
  export interface IFixedRing {
    /**
     * Absolute contour vertices in millimetres, without a repeated closing
     * point.
     */
    points: AutoMovieVector3Tuple[];

    /** Unit normal pointing along the measured distal course. */
    normal: AutoMovieVector3Tuple;
  }

  /** One quarter's conic shoulder per pair of guides. */
  export interface IShoulders {
    /** Between the lateral and posterior guides. */
    lateralPosterior: number;

    /** Between the posterior and medial guides. */
    posteriorMedial: number;

    /** Between the medial and anterior guides. */
    medialAnterior: number;

    /** Between the anterior and lateral guides. */
    anteriorLateral: number;
  }

  /** One authored station. */
  export interface IStation {
    /** Its anatomical site. */
    site: string;

    /**
     * Millimetres from the segment's zero along its axis, or the landmark it
     * stands at.
     */
    along: number | "axilla level" | "elbow" | "wrist" | "knuckles";

    /**
     * Outline values from the segment axis: lateral, medial, anterior,
     * posterior, mm.
     */
    extents: [number, number, number, number];

    /** Quarter shoulders. */
    shoulders: IShoulders;
  }
}
