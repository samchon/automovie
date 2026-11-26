import type { IAutoMovieMesh } from "../../model/IAutoMovieMesh";
import type { IAutoMovieCubicBezierCurve64 } from "./IAutoMovieCubicBezierCurve64";

/** Data and callback contracts shared by the CurveGrid64 operations. */
export namespace IAutoMovieCurveGrid64 {
  /**
   * Corresponding open cubic courses with a common normalized parameter and
   * increasing station coordinates. The caller supplies correspondence;
   * interpolation cannot establish it.
   */
  export interface Input {
    /** Stable construction identifier. */
    name: string;

    /**
     * Unique physical-instance namespace, distinct for independent coincident
     * sheets.
     */
    topologyDomain: string;

    /** Finite increasing coordinates in one consistent physical or angular chart. */
    stations: readonly number[];

    /**
     * Open cubic courses in mm, phaseUnit normalized, each covering exactly
     * [0,1].
     */
    courses: readonly IAutoMovieCubicBezierCurve64[];

    /** Complete station period; omission leaves the station dimension open. */
    period?: number;

    /**
     * Positive finite requested display spacing in mm; this is not a
     * full-surface error certificate.
     */
    resolutionMm: number;

    /**
     * Finite normalized course parameters included in sampling and published
     * as actual isocurves.
     */
    guides: readonly number[];

    /**
     * Optional finite additional station sample coordinates in the supported
     * domain; these do not supply curve values or constrain the interpolant.
     */
    stationSamples?: readonly number[];

    /**
     * Positive safe integer bounding generated vertices; invalid or excess
     * budgets reject before allocating output buffers.
     */
    maxVertices: number;
  }

  /**
   * Newly generated mesh, actual generating construction and complexity
   * diagnostics. Coefficientwise station PCHIP is bounded in each control
   * coordinate; this does not certify injectivity, correspondence or surface
   * approximation error.
   */
  export interface Result {
    /**
     * Engine-generated metre mesh with triangle-derived unit normals where
     * accumulation is resolved, zero normals otherwise, and explicit physical
     * identities.
     */
    mesh: IAutoMovieMesh;

    /** Actual surface courses and isocurves, in metres. */
    construction: {
      /**
       * All published construction positions are metres after the kernel's
       * single millimetre conversion.
       */
      units: "m";
      /**
       * Actual saved courses followed by requested evaluated guide isocurves;
       * these lines use the same generating field as the mesh.
       */
      lines: {
        /**
         * Saved course name or producer-generated guide identity derived from
         * the construction name and normalized course parameter.
         */
        id: string;
        /**
         * Whether this line closes in the station direction; requested guides
         * close only when a station period was supplied.
         */
        closed: boolean;
        /**
         * Caller-owned Cartesian positions in metres, in the line's sampled
         * parameter order.
         */
        points: [number, number, number][];
      }[];
    };

    /** Ordered actual mesh course and station sample parameters. */
    parameters: {
      /**
       * Increasing normalized course sample coordinates, including original
       * span boundaries and explicitly requested guides.
       */
      course: number[];
      /**
       * Actual station sample coordinates in the same physical or angular unit
       * as input.stations.
       */
      station: number[];
    };

    /**
     * Boundary positions in metres and analytic partials per normalized course
     * or declared station unit. Periodic stationLast repeats the exact
     * stationFirst owner.
     */
    boundaries: Record<
      "courseStart" | "courseEnd" | "stationFirst" | "stationLast",
      {
        /**
         * Copied boundary positions in metres, aligned with the corresponding
         * boundary's sampled course or station sequence.
         */
        positions: [number, number, number][];
        /**
         * Analytic Cartesian partial derivatives in metres per normalized
         * course unit; aligned with positions and not normalized tangent
         * directions.
         */
        coursePartials: [number, number, number][];
        /**
         * Analytic Cartesian partial derivatives in metres per declared station
         * unit; aligned with positions.
         */
        stationPartials: [number, number, number][];
      }
    >;

    /** Complexity and degeneracy observations, not acceptance criteria. */
    counts: {
      /** Number of supplied generating cubic courses. */
      courses: number;
      /** Sum of original cubic span counts across all input courses. */
      inputSpans: number;
      /**
       * Number of intervals in the union of all normalized course span
       * boundaries.
       */
      commonSpans: number;
      /**
       * Number of common course spans whose tensor station family was actually
       * constructed during ordered sampling.
       */
      evaluatedSpans: number;
      /**
       * Actual generated mesh vertex count, including boundary vertices without
       * a retained incident triangle.
       */
      vertices: number;
      /** Actual retained triangle count in the output index buffer. */
      triangles: number;
      /**
       * Proposed faces omitted when their generated cross-product magnitude was
       * zero or nonfinite.
       */
      omittedZeroAreaTriangles: number;
      /**
       * Generated vertices with zero or nonfinite accumulated normals, retained
       * with zero normal.
       */
      unresolvedVertexNormals: number;
      /** Subset of unresolved normals with no incident emitted triangle. */
      isolatedVertices: number;
      /** Subset of unresolved normals whose accumulated length is nonfinite. */
      nonfiniteNormalSums: number;
      /**
       * Smallest retained triangle area in square millimetres; remains
       * Number.MAX_VALUE if no triangle was retained.
       */
      minimumTriangleAreaMm2: number;
    };
  }
}
