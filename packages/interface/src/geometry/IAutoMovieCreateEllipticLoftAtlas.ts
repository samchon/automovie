import type { IAutoMovieBicubicAtlasGeometry } from "../model/IAutoMovieBicubicAtlasGeometry";
import type { IAutoMovieEllipticLoft } from "../model/IAutoMovieEllipticLoft";

/**
 * Elliptic section coefficients and the bicubic atlas generated from them.
 *
 * Profiles and the circular-arc deviation bound use model-local metres; angular
 * U runs clockwise and V follows increasing Y. The producer checks finite
 * positive radii, adjacent intervals and exact shared endpoints; C1 continuity,
 * source fit and end caps are not inferred.
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
     * Borrowed cubic centre/radius profiles in model-local metres, ordered
     * along Y; the producer validates nonempty adjacent spans, positive radius
     * controls and exact endpoint agreement.
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
     * Positive safe-integer vertex budget forwarded to tessellation; later
     * atlas admission requires at least three, which this producer does not
     * check.
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
     * Metre bound 0.000273 times the largest radius Bernstein control, bounding
     * the circular-cubic section approximation separately from tessellation and
     * source fitting.
     */
    arcDeviationBound: number;
  };
}
