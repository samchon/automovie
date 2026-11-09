import { AutoMovieBernsteinAlgebra64 as A } from "./AutoMovieBernsteinAlgebra64";
import { AutoMovieBernsteinGrid64 as G } from "./AutoMovieBernsteinGrid64";
import { AutoMovieBernsteinRational64 as L } from "./AutoMovieBernsteinRational64";
import { AutoMovieBernsteinSubdivision64 as S } from "./AutoMovieBernsteinSubdivision64";

/**
 * Preserves the existing binary64 Bernstein namespace while responsibility owners implement its operations.
 * All five structural types and twenty-five function names remain available, including the thirteen
 * subdivision, grid and quotient functions previously implemented directly in this namespace.
 * Function values are direct aliases; their coefficients, domains, errors and arithmetic are unchanged.
 * Internal owners depend on the algebra implementation rather than this facade, preventing import cycles.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the preserved API surface, direct alias identity, owner responsibilities and module-initialization requirement.
 * @evidence contracts/development/design.md#principled-representation Represents Preserves the existing binary64 Bernstein namespace while responsibility owners implement its operations: companion namespace of 30 members (`Vec`, `Poly`, `Grid`, `RecordV`, `RecordS`, `choose`, ...); units and frames named in its text: degree, rational, local. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieBernstein64` in packages/engine/src/geometry/curve/AutoMovieBernstein64.ts; its surface is the 30 members listed and the text shows 13 other files naming it, mostly packages/recovery (8), packages/engine (4), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieBernstein64 {
  /**
   * Three-component coefficient values; positions and derivative fields retain the units owned by their enclosing chart.
   *
   * @evidence contracts/development/design.md#principled-representation A fixed three-component mutable coefficient value.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One structural record/alias preserves the storage consumed by the neighboring algebra operations.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The type does not admit finite data, positive denominators or a regular geometric surface by itself.
   * @evidence contracts/development/common.md#meaningful-documentation The declaration distinguishes coefficient ordering, parameter correspondence and enclosing value units.
   */
  export type Vec = A.Vec;

  /**
   * Ordered Bernstein vector coefficients, with degree equal to length minus one.
   *
   * @evidence contracts/development/design.md#principled-representation An ordered vector Bernstein coefficient array whose degree is length minus one.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One structural record/alias preserves the storage consumed by the neighboring algebra operations.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The type does not admit finite data, positive denominators or a regular geometric surface by itself.
   * @evidence contracts/development/common.md#meaningful-documentation The declaration distinguishes coefficient ordering, parameter correspondence and enclosing value units.
   */
  export type Poly = Vec[];

  /**
   * Tensor coefficient rows used only to derive curve courses and first variations.
   *
   * @evidence contracts/development/design.md#principled-representation An outer-parameter array of corresponding vector Bernstein rows.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One structural record/alias preserves the storage consumed by the neighboring algebra operations.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The type does not admit finite data, positive denominators or a regular geometric surface by itself.
   * @evidence contracts/development/common.md#meaningful-documentation The declaration distinguishes coefficient ordering, parameter correspondence and enclosing value units.
   */
  export type Grid = Poly[];

  /**
   * A rational vector field N/Q; the denominator must remain positive on the evaluated chart.
   *
   * @evidence contracts/development/design.md#principled-representation A vector homogeneous numerator and scalar denominator sharing one local quotient parameter.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One structural record/alias preserves the storage consumed by the neighboring algebra operations.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The type does not admit finite data, positive denominators or a regular geometric surface by itself.
   * @evidence contracts/development/common.md#meaningful-documentation The declaration distinguishes coefficient ordering, parameter correspondence and enclosing value units.
   */
  export interface RecordV {
    /** Homogeneous vector numerator coefficients. */
    numerator: Poly;

    /** Scalar denominator coefficients in the same parameter. */
    denominator: number[];
  }
  /**
   * A rational scalar transition N/Q in the same local parameter as its numerator.
   *
   * @evidence contracts/development/design.md#principled-representation A scalar numerator and denominator sharing one local quotient parameter.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One structural record/alias preserves the storage consumed by the neighboring algebra operations.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The type does not admit finite data, positive denominators or a regular geometric surface by itself.
   * @evidence contracts/development/common.md#meaningful-documentation The declaration distinguishes coefficient ordering, parameter correspondence and enclosing value units.
   */
  export interface RecordS {
    /** Homogeneous scalar numerator coefficients. */
    numerator: number[];

    /** Scalar denominator coefficients in the same parameter. */
    denominator: number[];
  }

  /** Binomial coefficient for admitted integer indices 0<=k<=n; preserves the algebra owner's multiplicative order. */
  export const choose: typeof A.choose = A.choose;

  /** Scalar Bernstein value at the supplied local parameter; no parameter clamping or degree replacement. */
  export const scalar: typeof A.scalar = A.scalar;

  /** Vector Bernstein value at the supplied local parameter; returned coordinates retain the coefficient units. */
  export const value: typeof A.value = A.value;

  /** Vector derivative coefficients with the caller's chart scale; a constant retains the original empty-net result. */
  export const tangent: typeof A.tangent = A.tangent;

  /** Scalar derivative coefficients with the caller's chart scale; a constant yields the original zero constant. */
  export const dScalar: typeof A.dScalar = A.dScalar;

  /** Raises scalar degree without changing the polynomial; a requested degree reduction rejects. */
  export const elevateScalar: typeof A.elevateScalar = A.elevateScalar;

  /** Raises all three vector coordinates to one Bernstein degree without fitting. */
  export const elevate: typeof A.elevate = A.elevate;

  /** Scalar Bernstein product using the original binomial-weighted coefficient convolution. */
  export const product: typeof A.product = A.product;

  /** Scalar-by-vector Bernstein product, retaining every coordinate and the resulting degree. */
  export const productV: typeof A.productV = A.productV;

  /** Vector polynomial sum after exact algebraic degree elevation, with the original optional factor. */
  export const add: typeof A.add = A.add;

  /** Scalar polynomial sum after degree elevation, with the original optional factor. */
  export const addS: typeof A.addS = A.addS;

  /** Multiplies each vector coefficient by one scalar without changing degree. */
  export const scale: typeof A.scale = A.scale;

  /** Two De Casteljau restrictions at the supplied local parameter, retaining both child coefficient nets. */
  export const split: typeof S.split = S.split;

  /** Scalar restrictions from the same vector De Casteljau arithmetic path. */
  export const splitS: typeof S.splitS = S.splitS;

  /** Vector polynomial restricted to ordered local endpoints inside [0,1]; invalid endpoints reject. */
  export const restrict: typeof S.restrict = S.restrict;

  /** Scalar polynomial restricted to the same ordered local interval as the vector operation. */
  export const restrictS: typeof S.restrictS = S.restrictS;

  /** Three vector restrictions covering equal parameter thirds; they need not have equal physical arc length. */
  export const thirds: typeof S.thirds = S.thirds;

  /** Three scalar restrictions covering the same equal parameter thirds. */
  export const thirdsS: typeof S.thirdsS = S.thirdsS;

  /** Four longitudinal Bernstein rows from endpoint courses and complete physical-chart derivatives. */
  export const hermite: typeof G.hermite = G.hermite;

  /** Evaluates the outer grid parameter while retaining the complete inner polynomial coefficients. */
  export const gridValue: typeof G.gridValue = G.gridValue;

  /** Outer-parameter derivative grid with the caller's chart scale. */
  export const gridTangent: typeof G.gridTangent = G.gridTangent;

  /** Legacy aligned thirds of homogeneous vector numerator and scalar denominator. */
  export const thirdsR: typeof L.thirdsR = L.thirdsR;

  /** Legacy vector quotient value or derivative; a nonpositive evaluated denominator rejects. */
  export const evaluateR: typeof L.evaluateR = L.evaluateR;

  /** Legacy scalar quotient value or derivative; a nonpositive evaluated denominator rejects. */
  export const evaluateS: typeof L.evaluateS = L.evaluateS;

  /** Legacy control-positive rational scalar transition preserving its endpoint values and slopes. */
  export const positiveScalar: typeof L.positiveScalar = L.positiveScalar;
}
