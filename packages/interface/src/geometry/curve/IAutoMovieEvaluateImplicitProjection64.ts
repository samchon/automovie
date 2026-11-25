import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";

/**
 * Data and callback contracts shared by the EvaluateImplicitProjection64
 * operations.
 */
export namespace IAutoMovieEvaluateImplicitProjection64 {
  /**
   * Continue an implicit level along one declared constant physical direction.
   * Seed and target first derivatives use the caller's same parameter domain.
   * Optional second derivatives are propagated analytically for curve
   * consumers. Four level homotopy steps start at the seed's own level. Newton
   * backtracking accepts only decreasing level residuals inside the caller's
   * physical search distance. A singular direction, unsupported query or failed
   * solve throws; the seed is never returned as replacement geometry after a
   * failed solve. This local continuation does not certify a unique root or an
   * embedded chart. Failed solves retain their physical query and bounded ray
   * samples in the error message. Those samples diagnose the selected ray; they
   * do not prove existence or absence of roots between samples or on another
   * ray.
   */
  export type IProps = {
    /**
     * Finite seed point in millimetres in the field's Cartesian frame; the
     * continuation moves only along direction from this seed.
     */
    point: AutoMovieVector3Tuple;
    /**
     * One or two finite seed partial derivatives in millimetres per caller
     * parameter unit; parameter order matches target.partials and the
     * second-derivative matrices.
     */
    partials: readonly AutoMovieVector3Tuple[];
    /**
     * Optional square matrix of seed second partials, one row and column per
     * parameter, in millimetres per product of parameter units. Supplying it
     * requires a matching target.seconds matrix.
     */
    seconds?: readonly (readonly AutoMovieVector3Tuple[])[];
    /**
     * Finite nonzero constant projection direction in the seed frame;
     * normalized internally, so its input magnitude does not set the
     * displacement scale.
     */
    direction: AutoMovieVector3Tuple;
    /**
     * Desired field level and its derivatives in the same one- or two-parameter
     * domain as the seed jet.
     */
    target: {
      /**
       * Finite target scalar field level, in the field's caller-defined scalar
       * unit; not a physical distance unless the field itself has that unit.
       */
      value: number;
      /**
       * Finite target-level derivatives per caller parameter unit, with length
       * exactly equal to partials.length.
       */
      partials: readonly number[];
      /**
       * Finite square target-level second-derivative matrix when seed seconds
       * are supplied; otherwise second-order propagation is omitted.
       */
      seconds?: readonly (readonly number[])[];
    };
    /**
     * Read the immutable scalar field, gradient and Hessian at a millimetre
     * query point. Exceptions propagate; failed continuation may query sixteen
     * additional ray intervals for diagnostics before throwing.
     */
    field: (point: AutoMovieVector3Tuple) => {
      /**
       * Scalar field value at the supplied point, in the same unit as
       * target.value.
       */
      value: number;
      /**
       * Cartesian first derivatives of the scalar field, field units per
       * millimetre, in the seed frame.
       */
      gradient: AutoMovieVector3Tuple;
      /**
       * Three Cartesian Hessian rows, field units per squared millimetre, used
       * directly for requested second-order chain rules; the caller owns
       * dimension and derivative correctness.
       */
      hessian: readonly AutoMovieVector3Tuple[];
    };
    /**
     * Finite positive absolute displacement bound along the normalized
     * direction, millimetres; trial offsets outside either signed bound are not
     * queried for acceptance.
     */
    maxDistanceMm: number;
  };

  /**
   * Continue an implicit level along one declared constant physical direction.
   * Seed and target first derivatives use the caller's same parameter domain.
   * Optional second derivatives are propagated analytically for curve
   * consumers. Four level homotopy steps start at the seed's own level. Newton
   * backtracking accepts only decreasing level residuals inside the caller's
   * physical search distance. A singular direction, unsupported query or failed
   * solve throws; the seed is never returned as replacement geometry after a
   * failed solve. This local continuation does not certify a unique root or an
   * embedded chart. Failed solves retain their physical query and bounded ray
   * samples in the error message. Those samples diagnose the selected ray; they
   * do not prove existence or absence of roots between samples or on another
   * ray.
   */
  export type IResult = {
    /**
     * Final accepted millimetre point on the declared ray; failure throws
     * rather than returning the seed as replacement geometry.
     */
    point: AutoMovieVector3Tuple;
    /**
     * Analytically propagated first partials in millimetres per original
     * parameter unit, in input parameter order.
     */
    partials: AutoMovieVector3Tuple[];
    /**
     * Propagated square matrix of second partials in millimetres per product of
     * parameter units; empty when input.seconds was omitted.
     */
    seconds: AutoMovieVector3Tuple[][];
    /**
     * Signed physical displacement from the seed along the normalized input
     * direction, millimetres, within the declared search bound.
     */
    offsetMm: number;
    /**
     * Signed final field.value minus target.value in field units; acceptance
     * uses the operation's absolute 1e-10 level threshold.
     */
    residual: number;
    /**
     * Final gradient dot normalized direction, field units per millimetre; the
     * reader rejects nonfinite magnitude or magnitude at most 1e-12.
     */
    directionalDerivative: number;
  };
}
