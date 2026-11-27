import type { IAutoMovieCubicBezierCurve64 } from "./IAutoMovieCubicBezierCurve64";

/** Fourier support-function input and qualified polynomial approximation output. */
export namespace IAutoMovieGenerateSupportCurve64 {
  /**
   * Finite Fourier support function and common partition for a planar convex
   * curve. For the outward normal n=(cos(theta),sin(theta)) and tangent
   * t=(-sin,cos), X=h*n+h'*t and X'=(h+h'')*t. The support integral is the
   * convex perimeter, not the arclength of a nonconvex source outline. See
   * Antunes and Bogosel, https://arxiv.org/abs/1809.00254 . Coefficients and
   * positions use millimetres.
   *
   * The returned polynomial Hermite curve approximates that analytic equation.
   * Its fourth-derivative remainder and positive-radius lower estimate are
   * numerical evaluations of analytic inequalities, not outward-rounded
   * binary64 certificates. The polynomial's own perimeter is not silently
   * equated to the support integral. Refusal concerns this representation, not
   * the source object. generateSupportCurve64 copies coefficient pairs
   * synchronously. It rejects invalid harmonic/partition data, unresolved
   * positive curvature and nonfinite arithmetic rather than altering
   * coefficients to force convexity.
   */
  export type IProps = {
    /**
     * Caller-owned identity copied to the generated curve; this generator does
     * not enforce nonblankness or uniqueness.
     */
    name: string;
    /**
     * One through seventeen finite coefficient pairs for
     * h(theta)=sum(a_n_cos(n_theta)+b_n_sin(n_theta)), theta in radians. Index
     * zero requires positive cosine and zero sine; the bounded curvature test
     * must also resolve a positive h+h''.
     */
    harmonics: readonly {
      /**
       * Millimetre amplitude of cos(n_theta) at this array index n; the zeroth
       * value fixes analytic perimeter 2_pi*a_0.
       */
      cosine: number;

      /**
       * Millimetre amplitude of sin(n*theta) at this array index n; exactly
       * zero at n=0.
       */
      sine: number;
    }[];
    /** Fixed common normal-angle partition; a power of two in [4,4096]. */
    spans: number;
  };

  /**
   * Generated closed polynomial in the local X/Z plane and qualifications of
   * its underlying analytic support function. Output storage is newly created;
   * adjacent spans share their endpoint tuples, so preserve the curve's
   * readonly storage.
   */
  export type IResult = {
    /** Polynomial approximation in the local X/Z plane, phase in turns. */
    curve: IAutoMovieCubicBezierCurve64;
    /** Integral of the analytic convex support function, millimetres. */
    analyticPerimeter: number;
    /**
     * Positive minimum sampled h+h'' minus its analytic angular Lipschitz
     * remainder, in millimetres. The grid doubles from 16 through at most 4096
     * samples; this finite estimate is not outward rounded.
     */
    minimumRadiusLowerEstimate: number;
    /**
     * Sqrt(2)_M4_(2*pi/spans)^4/384 in millimetres, where M4 is the Fourier
     * fourth-derivative majorant. This evaluated Hermite remainder is not an
     * outward-rounded certificate.
     */
    approximationErrorEstimate: number;
  };
}
