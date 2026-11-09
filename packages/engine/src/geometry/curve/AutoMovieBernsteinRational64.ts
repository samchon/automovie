import { AutoMovieBernsteinAlgebra64 as B } from "./AutoMovieBernsteinAlgebra64";
import { AutoMovieBernsteinSubdivision64 as D } from "./AutoMovieBernsteinSubdivision64";
import { AutoMovieCurveMath64 as V } from "./AutoMovieCurveMath64";

/**
 * Rational Bernstein quotients N/Q, including the four existing quotient operations preserved by the AutoMovieBernstein64 compatibility facade. Aligned numerator/denominator partitioning, quotient derivatives and positive scalar transitions retain the original coefficient arithmetic.
 *
 * Quotients require a positive evaluated denominator and reject otherwise; no epsilon denominator or polynomial quotient fit replaces the homogeneous representation.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its denominator and parameter contract.
 * @evidence contracts/development/design.md#principled-representation Represents Rational Bernstein quotients N/Q, including the four existing quotient operations preserved by the AutoMovieBernstein64 compatibility facade: companion namespace of 4 members (`thirdsR`, `evaluateR`, `evaluateS`, `positiveScalar`); units and frames named in its text: rational, degrees, local, degree. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieBernsteinRational64` in packages/engine/src/geometry/curve/AutoMovieBernsteinRational64.ts; its surface is the 4 members listed and the text shows 1 other file naming it, mostly packages/engine (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieBernsteinRational64 {
  /**
   * Partition numerator and denominator together so the rational quotient is unchanged.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Numerator and denominator are partitioned with corresponding thirds so the quotient chart remains aligned.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Rational partitioning composes the existing polynomial partition owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No denominator sampling or quotient fitting replaces the homogeneous representation.
   * @evidence contracts/development/common.md#meaningful-documentation Partition numerator and denominator together so the rational quotient is unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms Numerator and denominator subdivision dominate O(n²) work for their supplied degrees.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both coefficient families use one identical three-domain partition.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each returned record owns its new numerator and denominator arrays.
   */
  export function thirdsR(r: B.RecordV): B.RecordV[] {
    const ns: B.Poly[] = D.thirds(r.numerator),
      qs: number[][] = D.thirdsS(r.denominator);
    return ns.map(
      (n: B.Poly, i: number): B.RecordV => ({
        numerator: n,
        denominator: qs[i]!,
      }),
    );
  }
  /**
   * Evaluate N/Q or its quotient derivative; a nonpositive denominator rejects.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Evaluates N and Q and uses (N′Q-NQ′)/Q² for the optional derivative.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One quotient operation shares vector/scalar evaluation and differentiation owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A nonpositive evaluated denominator rejects; polynomial quotient fitting is not used.
   * @evidence contracts/development/common.md#meaningful-documentation Evaluate N/Q or its quotient derivative; a nonpositive denominator rejects.
   * @evidence contracts/development/implementation.md#efficient-algorithms Coefficient evaluation and derivative-net evaluation dominate quadratic work in supplied degrees.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The already evaluated N and Q are reused in the quotient derivative.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the new result triple escapes local numerator/denominator calculations.
   */
  export function evaluateR(
    r: B.RecordV,
    t: number,
    derivative: boolean = false,
  ): B.Vec {
    const n: B.Vec = B.value(r.numerator, t),
      q: number = B.scalar(r.denominator, t);
    if (!(q > 0)) throw new Error("Nonpositive actual rational denominator");
    return derivative
      ? V.scale(
          V.sub(
            V.scale(B.value(B.tangent(r.numerator), t), q),
            V.scale(n, B.scalar(B.dScalar(r.denominator), t)),
          ),
          1 / (q * q),
        )
      : V.scale(n, 1 / q);
  }
  /**
   * Evaluate a scalar quotient or its derivative; a nonpositive denominator rejects.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Scalar quotient evaluation uses N/Q or (N′Q-NQ′)/Q² at the same parameter.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The scalar quotient composes the same coefficient evaluation and derivative operations.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nonpositive evaluated denominators reject without a replacement epsilon denominator.
   * @evidence contracts/development/common.md#meaningful-documentation Evaluate a scalar quotient or its derivative; a nonpositive denominator rejects.
   * @evidence contracts/development/implementation.md#efficient-algorithms A fixed number of scalar Bernstein evaluations dominates quadratic degree cost.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work N and Q values are reused within the derivative expression.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only one scalar returns; coefficient and derivative scratch arrays are not retained.
   */
  export function evaluateS(
    r: B.RecordS,
    t: number,
    derivative: boolean = false,
  ): number {
    const n: number = B.scalar(r.numerator, t),
      q: number = B.scalar(r.denominator, t);
    if (!(q > 0)) throw new Error("Nonpositive scalar denominator");
    return derivative
      ? (B.scalar(B.dScalar(r.numerator), t) * q -
          n * B.scalar(B.dScalar(r.denominator), t)) /
          (q * q)
      : n / q;
  }
  /**
   * Construct a control-positive rational transition with the supplied endpoint values and slopes.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Endpoint slope signs choose neighboring positive support values and solve homogeneous weights for those endpoint derivatives.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One four-control rational transition preserves the supplied endpoint data.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nonpositive endpoint values reject; finite binary64 representability remains a caller premise.
   * @evidence contracts/development/common.md#meaningful-documentation Construct a control-positive rational transition with the supplied endpoint values and slopes.
   * @evidence contracts/development/implementation.md#efficient-algorithms The construction uses four supports and four weights with fixed work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Solved weights directly supply both homogeneous numerator and denominator.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned record owns two new four-number arrays.
   */
  export function positiveScalar(
    a: number,
    b: number,
    da: number,
    db: number,
  ): B.RecordS {
    if (!(a > 0 && b > 0))
      throw new Error("Positive transition endpoints required");
    const p: number = da > 0 ? 2 * a : da < 0 ? a / 2 : a,
      q: number = db > 0 ? b / 2 : db < 0 ? 2 * b : b;
    const weights: number[] = [
      1,
      da ? da / (3 * (p - a)) : 1,
      db ? db / (3 * (b - q)) : 1,
      1,
    ];
    return {
      numerator: [a, p, q, b].map(
        (v: number, i: number): number => v * weights[i]!,
      ),
      denominator: weights,
    };
  }
}
