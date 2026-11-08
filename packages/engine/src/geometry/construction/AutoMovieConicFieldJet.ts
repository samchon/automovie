/**
 * Scalar source partials for the shared numeric and differentiated conic algebra.
 *
 * The two coordinates are source parameters s and p, never a native curve clock.
 * Entries are derivatives rather than Taylor coefficients. Geometry owners admit
 * inputs and finite outputs; these operations propagate IEEE nonfinite arithmetic.
 *
 * @evidence contracts/common.md#principled-implementation Implements the two-variable product, quotient and implicit unary second-derivative rules on six actual partials.
 * @evidence contracts/common.md#clear-and-simple-design A fixed tuple and one operation interface let numeric and differentiated source preparation use the same formula.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no sampled derivative, native-clock division, geometry selection or missing-derivative replacement.
 * @evidence contracts/common.md#meaningful-documentation States derivative ordering, independent-coordinate meaning, finite-arithmetic admission and ownership.
 * @evidence contracts/performance.md#efficient-algorithms Each operation has fixed scalar work and produces at most one six-number tuple; no source-layer traversal occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work Two stateless operation tables are reused; intermediate partials serve every second-order component within an operation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only two fixed operation tables are module-owned; returned tuples belong to callers and no source or query cache is retained.
 */
export namespace AutoMovieConicFieldJet {
  /**
   * Value and source partials [value,s,p,ss,sp,pp], in each supplied coordinate's units.
   *
   * @evidence contracts/common.md#principled-implementation Stores the full symmetric Hessian of one scalar in two source coordinates, without factorial scaling.
   * @evidence contracts/common.md#clear-and-simple-design Six fixed entries describe exactly the total-order-two source field.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No phase/native-clock derivatives or unavailable physical-pole jets are implied.
   * @evidence contracts/common.md#meaningful-documentation Gives entry order, derivative convention and caller-owned coordinate units.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The tuple type performs no computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The tuple type coordinates no requests.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Tuple lifetime belongs to its producing operation and caller.
   */
  export type IJet = readonly [number, number, number, number, number, number];

  /**
   * Operations needed by one shared conic preparation formula.
   *
   * @evidence contracts/common.md#principled-implementation The same arithmetic interface supports ordinary scalars and source partials, with primal branch decisions read through value.
   * @evidence contracts/common.md#clear-and-simple-design Only the existing rational, root and logarithmic operations needed by the conic kernels are exposed.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The interface supplies no geometry fallback, derivative estimate or implicit validation.
   * @evidence contracts/common.md#meaningful-documentation Each member identifies its scalar meaning; admission remains at the geometry owner.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This operation contract performs no runtime computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Operation reuse belongs to the two stateless implementations.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This interface owns no source, tuple or cache lifetime.
   */
  export interface IAlgebra<T> {
    /**
     * Primal value used for numerical scaling and declared branch selection.
     *
     * @evidence contracts/common.md#principled-implementation Reads the scalar component without differentiating a numerical gauge or selecting a geometry.
     * @evidence contracts/common.md#clear-and-simple-design One scalar projection serves both supplied algebra implementations.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not inspect registration, discard a source or replace a failed derivative.
     * @evidence contracts/common.md#meaningful-documentation Identifies primal-only scaling and branch use.
     * @evidenceExclude contracts/performance.md#efficient-algorithms This method signature executes no algorithm; NUMBER and AD implement the projection.
     * @evidenceExclude contracts/performance.md#reuse-equivalent-work This signature coordinates no calls or reusable preparation.
     * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This signature acquires and retains no data.
     */
    value(input: T): number;

    /**
     * A coordinate-independent scalar, with zero source partials.
     *
     * @evidence contracts/common.md#principled-implementation Declares a mathematical constant whose source gradient and Hessian are zero.
     * @evidence contracts/common.md#clear-and-simple-design One constructor adapts numeric literals to the formula's scalar representation.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero partials apply only to a declared constant, never to missing source derivatives.
     * @evidence contracts/common.md#meaningful-documentation States coordinate independence and the exact zero-partial premise.
     * @evidenceExclude contracts/performance.md#efficient-algorithms This method signature executes no allocation or arithmetic.
     * @evidenceExclude contracts/performance.md#reuse-equivalent-work This signature coordinates no requests or cache.
     * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Implementations and callers own any constructed scalar; the signature retains nothing.
     */
    constant(value: number): T;

    /**
     * Scalar addition and corresponding source partials.
     *
     * @evidence contracts/common.md#principled-implementation Addition carries each source partial by the same linear sum.
     * @evidence contracts/common.md#clear-and-simple-design One operation preserves the formula's scalar abstraction.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not clamp a sum or discard nonfinite partials.
     * @evidence contracts/common.md#meaningful-documentation Identifies scalar and derivative addition.
     * @evidenceExclude contracts/performance.md#efficient-algorithms This signature chooses no runtime algorithm; implementations own component arithmetic.
     * @evidenceExclude contracts/performance.md#reuse-equivalent-work This method contract coordinates no requests.
     * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This signature retains no operand or result.
     */
    add(a: T, b: T): T;

    /**
     * Scalar subtraction and corresponding source partials.
     *
     * @evidence contracts/common.md#principled-implementation Subtraction carries each source partial by the same linear difference.
     * @evidence contracts/common.md#clear-and-simple-design One binary operation serves numeric and differentiated formulas.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts No cancellation correction changes the supplied scalar function.
     * @evidence contracts/common.md#meaningful-documentation States scalar and derivative subtraction.
     * @evidenceExclude contracts/performance.md#efficient-algorithms This signature executes no component arithmetic.
     * @evidenceExclude contracts/performance.md#reuse-equivalent-work This method contract coordinates no reusable work.
     * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This signature holds no state or operand reference.
     */
    subtract(a: T, b: T): T;

    /**
     * Product with both first partials and the symmetric Hessian.
     *
     * @evidence contracts/common.md#principled-implementation Requires the full two-variable product rule, including both mixed cross terms and doubled pure-gradient products.
     * @evidence contracts/common.md#clear-and-simple-design One product operation keeps derivative layout out of shared geometry formulas.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses actual Hessian entries rather than factorial-scaled Taylor coefficients.
     * @evidence contracts/common.md#meaningful-documentation Names both first partials and the symmetric Hessian.
     * @evidenceExclude contracts/performance.md#efficient-algorithms This method signature runs no product-rule implementation.
     * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reuse of scalar products belongs to NUMBER and AD, not this signature.
     * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This signature acquires no operand storage or cache.
     */
    multiply(a: T, b: T): T;

    /**
     * Quotient; the geometry owner requires an admitted nonzero divisor.
     *
     * @evidence contracts/common.md#principled-implementation The differentiated implementation solves the partials of a=q*b through total order two.
     * @evidence contracts/common.md#clear-and-simple-design One quotient contract leaves geometric divisor admission with its owner.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not replace a zero divisor or a nonfinite quotient with another source.
     * @evidence contracts/common.md#meaningful-documentation States nonzero-divisor admission and quotient meaning.
     * @evidenceExclude contracts/performance.md#efficient-algorithms This signature executes no quotient recurrence.
     * @evidenceExclude contracts/performance.md#reuse-equivalent-work Implementations reuse their computed first partials; this signature coordinates nothing.
     * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This contract retains neither divisor nor quotient.
     */
    divide(a: T, b: T): T;

    /**
     * Positive square root and its source partials on its regular domain.
     *
     * @evidence contracts/common.md#principled-implementation Differentiating y*y=input gives the source partials for strictly positive regular inputs.
     * @evidence contracts/common.md#clear-and-simple-design One unary contract shares numeric and differentiated root preparation.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not invent finite derivatives at a singular zero or outside the real domain.
     * @evidence contracts/common.md#meaningful-documentation States positive-root and regular-domain meanings.
     * @evidenceExclude contracts/performance.md#efficient-algorithms The method signature performs no root or derivative work.
     * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reuse of the root and first partials belongs to its implementation.
     * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This signature retains no input or root.
     */
    sqrt(input: T): T;

    /**
     * Real cube root and source partials away from its singular zero.
     *
     * @evidence contracts/common.md#principled-implementation Differentiating y*y*y=input gives both source orders at a nonzero real input.
     * @evidence contracts/common.md#clear-and-simple-design One cube-root contract serves the rational G2 weight law.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not fabricate a finite zero-input derivative or substitute another weight law.
     * @evidence contracts/common.md#meaningful-documentation States the real branch and singular-zero limitation.
     * @evidenceExclude contracts/performance.md#efficient-algorithms This method signature computes no root or source partial.
     * @evidenceExclude contracts/performance.md#reuse-equivalent-work Root-power reuse is an implementation responsibility.
     * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This signature owns no input or result lifetime.
     */
    cbrt(input: T): T;

    /**
     * Natural logarithm and source partials on its positive domain.
     *
     * @evidence contracts/common.md#principled-implementation The logarithmic Hessian is input Hessian divided by value minus the normalized gradient outer product.
     * @evidence contracts/common.md#clear-and-simple-design One logarithm contract supports the same projective log-sum formula in both algebras.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts A nonpositive input is not clipped into the logarithm's domain.
     * @evidence contracts/common.md#meaningful-documentation States natural logarithm and its positive-domain premise.
     * @evidenceExclude contracts/performance.md#efficient-algorithms This signature executes no logarithm or Hessian arithmetic.
     * @evidenceExclude contracts/performance.md#reuse-equivalent-work Gradient reuse belongs to the differentiated implementation.
     * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This signature retains no input, gradient or result.
     */
    log(input: T): T;

    /**
     * Exponential and its source partials, subject to finite arithmetic.
     *
     * @evidence contracts/common.md#principled-implementation The Hessian is exp(input) multiplied by the sum of the input Hessian and gradient outer product.
     * @evidence contracts/common.md#clear-and-simple-design One exponential contract supports projective normalized weights without another formula.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Unrepresentable arithmetic propagates instead of changing a source weight.
     * @evidence contracts/common.md#meaningful-documentation States the exponential and finite-arithmetic premise.
     * @evidenceExclude contracts/performance.md#efficient-algorithms This method signature executes no exponential or source arithmetic.
     * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reuse of scaled first partials belongs to the implementation.
     * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This contract acquires or retains no data.
     */
    exp(input: T): T;
  }

  /** Ordinary scalar specialization; its arithmetic has the existing Math semantics. */
  export const NUMBER: IAlgebra<number> = {
    /** Identity primal reading. */
    value: (input: number): number => input,

    /** Coordinate-independent numeric scalar. */
    constant: (value: number): number => value,

    /** Numeric sum. */
    add: (a: number, b: number): number => a + b,

    /** Numeric difference. */
    subtract: (a: number, b: number): number => a - b,

    /** Numeric product. */
    multiply: (a: number, b: number): number => a * b,

    /** Numeric quotient. */
    divide: (a: number, b: number): number => a / b,

    /** Numeric square root. */
    sqrt: Math.sqrt,

    /** Numeric cube root. */
    cbrt: Math.cbrt,

    /** Numeric natural logarithm. */
    log: Math.log,

    /** Numeric exponential. */
    exp: Math.exp,
  };

  /** Source-partial specialization; each arithmetic result is a fresh tuple. */
  export const AD: IAlgebra<IJet> = {
    /** Primal value without changing derivative data. */
    value: (input: IJet): number => input[0],

    /** A declared constant in both source coordinates. */
    constant: (value: number): IJet => [value, 0, 0, 0, 0, 0],

    /** Componentwise sum. */
    add: (a: IJet, b: IJet): IJet => [
      a[0] + b[0],
      a[1] + b[1],
      a[2] + b[2],
      a[3] + b[3],
      a[4] + b[4],
      a[5] + b[5],
    ],

    /** Componentwise difference. */
    subtract: (a: IJet, b: IJet): IJet => [
      a[0] - b[0],
      a[1] - b[1],
      a[2] - b[2],
      a[3] - b[3],
      a[4] - b[4],
      a[5] - b[5],
    ],

    /** Full product rule. */
    multiply,

    /** Quotient recurrence using already computed first partials. */
    divide,

    /** Differentiate y squared equals input. */
    sqrt,

    /** Differentiate y cubed equals input. */
    cbrt,

    /** Logarithmic first and second partials. */
    log,

    /** Exponential partials with reused scaled first derivatives. */
    exp,
  };

  /**
   * Lift a regular station scalar [value,ds,dss] while p is a declared constant.
   *
   * @evidence contracts/common.md#principled-implementation Copies the actual station derivatives into s and ss and sets only the explicitly constant second coordinate's partials to zero.
   * @evidence contracts/common.md#clear-and-simple-design One fixed layout conversion adapts existing source readings without retaining the source.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not estimate unavailable station jets, change their coordinate or validate a singular pole.
   * @evidence contracts/common.md#meaningful-documentation States regular-station input, constant-p premise, derivative units and fresh-result ownership.
   * @evidence contracts/performance.md#efficient-algorithms Three reads and one six-number tuple take constant time and space.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A fixed layout conversion coordinates no source preparation or query reuse.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a fresh tuple without retaining its three-entry input.
   */
  export function fromStation(input: readonly [number, number, number]): IJet {
    return [input[0], input[1], 0, input[2], 0, 0];
  }
}

/** Full two-variable product rule, with actual Hessian rather than Taylor entries. */
function multiply(
  a: AutoMovieConicFieldJet.IJet,
  b: AutoMovieConicFieldJet.IJet,
): AutoMovieConicFieldJet.IJet {
  return [
    a[0] * b[0],
    a[1] * b[0] + a[0] * b[1],
    a[2] * b[0] + a[0] * b[2],
    a[3] * b[0] + 2 * a[1] * b[1] + a[0] * b[3],
    a[4] * b[0] + a[1] * b[2] + a[2] * b[1] + a[0] * b[4],
    a[5] * b[0] + 2 * a[2] * b[2] + a[0] * b[5],
  ];
}

/** Differentiate a=q*b, avoiding separately materialized reciprocal powers. */
function divide(
  a: AutoMovieConicFieldJet.IJet,
  b: AutoMovieConicFieldJet.IJet,
): AutoMovieConicFieldJet.IJet {
  const value: number = a[0] / b[0];
  const s: number = (a[1] - value * b[1]) / b[0];
  const p: number = (a[2] - value * b[2]) / b[0];
  return [
    value,
    s,
    p,
    (a[3] - 2 * s * b[1] - value * b[3]) / b[0],
    (a[4] - s * b[2] - p * b[1] - value * b[4]) / b[0],
    (a[5] - 2 * p * b[2] - value * b[5]) / b[0],
  ];
}

/** Implicit square-root recurrence avoids inverse powers of a tiny input value. */
function sqrt(a: AutoMovieConicFieldJet.IJet): AutoMovieConicFieldJet.IJet {
  const value: number = Math.sqrt(a[0]);
  const s: number = a[1] / (2 * value);
  const p: number = a[2] / (2 * value);
  return [
    value,
    s,
    p,
    a[3] / (2 * value) - (s / value) * s,
    a[4] / (2 * value) - (s / value) * p,
    a[5] / (2 * value) - (p / value) * p,
  ];
}

/** Differentiate y cubed equals a using representable root powers and first jets. */
function cbrt(a: AutoMovieConicFieldJet.IJet): AutoMovieConicFieldJet.IJet {
  const value: number = Math.cbrt(a[0]);
  const square: number = value * value;
  const s: number = a[1] / (3 * square);
  const p: number = a[2] / (3 * square);
  return [
    value,
    s,
    p,
    a[3] / (3 * square) - 2 * (s / value) * s,
    a[4] / (3 * square) - 2 * (s / value) * p,
    a[5] / (3 * square) - 2 * (p / value) * p,
  ];
}

/** Log Hessian is the normalized input Hessian minus its gradient outer product. */
function log(a: AutoMovieConicFieldJet.IJet): AutoMovieConicFieldJet.IJet {
  const s: number = a[1] / a[0];
  const p: number = a[2] / a[0];
  return [
    Math.log(a[0]),
    s,
    p,
    a[3] / a[0] - s * s,
    a[4] / a[0] - s * p,
    a[5] / a[0] - p * p,
  ];
}

/** Reuse exp(a)*a_i before multiplying again in the Hessian's outer product. */
function exp(a: AutoMovieConicFieldJet.IJet): AutoMovieConicFieldJet.IJet {
  const value: number = Math.exp(a[0]);
  const s: number = value * a[1];
  const p: number = value * a[2];
  return [
    value,
    s,
    p,
    value * a[3] + s * a[1],
    value * a[4] + s * a[2],
    value * a[5] + p * a[2],
  ];
}
