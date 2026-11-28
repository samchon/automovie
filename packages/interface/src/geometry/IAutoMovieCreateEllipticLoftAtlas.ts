import type { IAutoMovieBicubicAtlasGeometry } from "../model/IAutoMovieBicubicAtlasGeometry";
import type { IAutoMovieEllipticLoft } from "../model/IAutoMovieEllipticLoft";

/**
 * Open lateral bicubic geometry from cubic elliptic-section profiles.
 *
 * Profiles and the circular-arc bound use model-local metres. Angular U runs
 * clockwise and V follows increasing Y. The producer validates finite centres,
 * positive finite radii, adjacent stations and exact shared endpoints. The
 * caller owns C1 continuity, source fit and end caps.
 */
export namespace IAutoMovieCreateEllipticLoftAtlas {
  /**
   * Inputs for a shared bicubic atlas from cubic centre and ellipse-radius
   * profiles. Each quarter uses the tangent-matching circular cubic with k = 4
   * (sqrt(2) - 1) / 3. Its radial deviation from the unit circle is below
   * 0.000273: differentiating x(t)^2 + z(t)^2 locates the interior extrema.
   * Applying the diagonal ellipse scale bounds the section's Hausdorff
   * deviation by that constant times its largest half-axis. This is a separate
   * geometric approximation from the atlas-to-triangle tolerance and any
   * observation error. Clockwise angular U and increasing physical Y make U
   * cross V outward. Adjacent spans share coefficient identity at equal
   * endpoints; each patch keeps its own analytic normal fan so a C0-only axial
   * join retains both limits. C1 remains the caller's constraint rather than an
   * inferred property.
   */
  export type IInput = {
    /**
     * Borrowed cubic centre and radius profiles in model-local metres. Supply
     * increasing adjacent Y spans and exact shared endpoint controls. The
     * constructed Y rows preserve both source station endpoints.
     */
    loft: IAutoMovieEllipticLoft;

    /**
     * Nonblank identity copied into the atlas to namespace physical topology;
     * it does not transform coordinates.
     */
    topologyDomain: string;

    /**
     * Positive finite atlas-to-triangle tolerance in metres, forwarded for
     * later tessellation and separate from circular-arc approximation error;
     * later atlas admission also requires finite millimetre conversion.
     */
    tolerance: number;

    /**
     * Positive safe-integer cell budget forwarded to atlas tessellation; this
     * producer does not tessellate or spend it.
     */
    maxCells: number;

    /**
     * Positive safe integer preserved in the generated recipe. The producer
     * accepts one and two. Model atlas admission before realization requires at
     * least three.
     */
    maxVertices: number;
  };

  /**
   * The generated bicubic lateral atlas and its independent circular-cubic
   * approximation bound. Both the geometry record and all coefficient/boundary
   * arrays are newly owned by the caller. The producer validates profiles and
   * budgets; subsequent atlas admission and tessellation remain separate
   * operations.
   */
  export type IResult = {
    /**
     * New mutable open lateral bicubic atlas in the loft frame, with shared
     * coefficient identities and per-patch normal fans; no end caps or triangle
     * buffers are created.
     */
    geometry: IAutoMovieBicubicAtlasGeometry;

    /**
     * Metre bound 0.000273 times the largest radius Bernstein control, with a
     * minimum of `Number.MIN_VALUE`. It bounds the circular-cubic section
     * approximation independently of tessellation and source fitting.
     */
    arcDeviationBound: number;
  };
}
