import { HumanExactFraction as Fraction } from "../../../common/measure/HumanExactFraction";
import type { IHumanExactFraction } from "../../../common/measure/IHumanExactFraction";
import type { IHumanPolynomialRoot } from "../../../common/measure/IHumanPolynomialRoot";
import { isolateHumanPolynomialRoots } from "../../../common/measure/isolateHumanPolynomialRoots";
import type { resolveHumanFaceOpticalProfile } from "./resolveHumanFaceOpticalProfile";
import type { IHumanFaceOcularCapFoot } from "./structures/IHumanFaceOcularCapFoot";

/**
 * Compile one admitted cap's exact represented-input distance polynomial.
 * For t=r/L, G=a+B t²+C t⁴. Every stationary distance parameter is a
 * root of a polynomial of degree at most seven; endpoint and all stationary candidates
 * are compared through the same factored profile evaluator used by drawing.
 * Neither convexity nor a single sampled minimum is assumed. Binary64
 * rounding of isolated parameters belongs to the common Sturm owner.
 * A private flat profile copy retains its scalars and evaluator references
 * with the coefficients, including the receiver of a method evaluator. The evaluator must retain the same profile internally;
 * the normal profile owner closes over its resolved local scalar values.
 *
 *
 * @evidence contracts/common.md#principled-implementation Exact represented-input quartic coefficients produce all stationary distance candidates through a polynomial of degree at most seven, without assuming cap convexity or one sampled minimum.
 * @evidence contracts/common.md#clear-and-simple-design The metric owns a flat admitted profile copy and exact coefficients; common fractions/root isolation own numerical representation and drawing retains the same factored evaluator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Evaluators must retain their original admitted profile internally; returned represented feasible points and rounding error are not relabelled exact real-surface minima.
 * @evidence contracts/common.md#meaningful-documentation The description states normalized parameter, all-candidate comparison, shared drawing profile and evaluator ownership.
 * @evidence contracts/performance.md#efficient-algorithms Profile compilation has fixed rational operation count; each distance query adds fixed-degree Sturm isolation and candidate fraction/square-root work whose cost depends on input bit widths and isolator refinement.
 * @evidence contracts/performance.md#reuse-equivalent-work One captured coefficient/profile set serves all radius/derivative/foot queries; rho/zeta-dependent roots are recomputed for their actual query rather than reused by identity alone.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The instance retains four rational coefficients and one flat profile/evaluator record for caller lifetime; per-query polynomial/root/bound arrays expire and no task or live resource is acquired.
 */
export class HumanFaceOcularCapMetric {
  private readonly length: IHumanExactFraction;
  private readonly a: IHumanExactFraction;
  private readonly b: IHumanExactFraction;
  private readonly c: IHumanExactFraction;

  private readonly profile: ReturnType<typeof resolveHumanFaceOpticalProfile>;

  /**
   * Compile one admitted optical profile's owned exact metric coefficients.
   *
   * Exact represented limbus, curvature and rim fractions compile the resolved profile's quartic. A flat scalar/evaluator copy preserves the profile-method receiver fields; the resolver owns admission, and evaluators must retain that same profile internally.
   *
   * Fixed field reads and fraction operations have bit-width-dependent cost. Subsequent distance/derivative queries reuse these coefficients until caller release; evaluator captures belong to the input owner and no task or handle is acquired.
   */
  constructor(inputProfile: ReturnType<typeof resolveHumanFaceOpticalProfile>) {
    const profile: ReturnType<typeof resolveHumanFaceOpticalProfile> = {
      radius: inputProfile.radius,
      limbus: inputProfile.limbus,
      curvature: inputProfile.curvature,
      thickness: inputProfile.thickness,
      iris: inputProfile.iris,
      aperture: inputProfile.aperture,
      depth: inputProfile.depth,
      rim: inputProfile.rim,
      apex: inputProfile.apex,
      irisZ: inputProfile.irisZ,
      height: inputProfile.height,
      slope: inputProfile.slope,
    };
    this.profile = profile;
    this.length = Fraction.from(profile.limbus);
    const square: IHumanExactFraction = Fraction.multiply(
      this.length,
      this.length,
    );
    const curvature: IHumanExactFraction = Fraction.from(profile.curvature),
      rim: IHumanExactFraction = Fraction.from(profile.rim);
    const inverseCurvature: IHumanExactFraction = Fraction.divide(
      Fraction.create(1n),
      curvature,
    );
    const inverseRim: IHumanExactFraction = Fraction.divide(
      Fraction.create(1n),
      rim,
    );
    this.a = Fraction.add(
      rim,
      Fraction.multiply(
        Fraction.divide(square, Fraction.create(4n)),
        Fraction.add(inverseCurvature, inverseRim),
      ),
    );
    this.b = Fraction.negate(
      Fraction.multiply(
        Fraction.divide(square, Fraction.create(2n)),
        inverseCurvature,
      ),
    );
    this.c = Fraction.multiply(
      Fraction.divide(square, Fraction.create(4n)),
      Fraction.add(inverseCurvature, Fraction.negate(inverseRim)),
    );
  }

  /** The same real polynomial at an exact radial coordinate, before output rounding.
   *
   * @evidence contracts/common.md#principled-implementation Exact radius divided by the captured limbus evaluates the same normalized quartic before any binary64 output rounding.
   * @evidence contracts/common.md#clear-and-simple-design The public radius adapter delegates polynomial evaluation to the private dimensionless-parameter helper.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It does not substitute the drawing evaluator's rounded result or add a tolerance-derived height; admitted profile/radius-domain premises remain with callers.
   * @evidence contracts/common.md#meaningful-documentation The member states exact radial input and unrounded real-polynomial output.
   * @evidence contracts/performance.md#efficient-algorithms One rational division and fixed quartic evaluation have arithmetic cost driven by operand bit widths.
   * @evidence contracts/performance.md#reuse-equivalent-work Captured coefficients are reused and the same parameter evaluator serves derivative/nearest-point bound consumers.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only one returned fraction survives; temporaries expire and no radius/height cache or resource is retained.
   */
  heightAtRadius(radius: IHumanExactFraction): IHumanExactFraction {
    return this.heightAtParameter(Fraction.divide(radius, this.length));
  }

  /** Exact meridian second derivative of the same represented-input profile.
   *
   * @evidence contracts/common.md#principled-implementation The exact 2B/L squared plus 12C*r squared/L fourth expression gives the meridian second derivative of the same represented quartic.
   * @evidence contracts/common.md#clear-and-simple-design This derivative instrument supplies the actual radial-interval curvature bound owner without introducing another optical profile.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Curvature inflection is allowed and no apex-only maximum or sampled constant substitutes for the exact derivative.
   * @evidence contracts/common.md#meaningful-documentation The member identifies the exact meridian derivative and its shared profile.
   * @evidence contracts/performance.md#efficient-algorithms A fixed number of rational squares/products/divisions is evaluated per radius; cost depends on integer operand widths.
   * @evidence contracts/performance.md#reuse-equivalent-work One captured L/B/C set supplies every derivative query and the cell metric selects its actual interval extrema.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returned derivative fractions are caller-owned; no queried-radius population or live resource is retained.
   */
  secondDerivativeAtRadius(radius: IHumanExactFraction): IHumanExactFraction {
    const square: IHumanExactFraction = Fraction.multiply(
      this.length,
      this.length,
    );
    return Fraction.add(
      Fraction.divide(Fraction.multiply(Fraction.create(2n), this.b), square),
      Fraction.divide(
        Fraction.multiply(
          Fraction.create(12n),
          Fraction.multiply(this.c, Fraction.multiply(radius, radius)),
        ),
        Fraction.multiply(square, square),
      ),
    );
  }

  /** Select a feasible represented cap radius and enclose the nearest real-cap distance; equal feasible costs keep the smaller radius.
   *
   * @evidence contracts/common.md#principled-implementation Endpoints and every represented stationary-root candidate provide feasible exact-distance upper costs and interval lower costs for the same admitted decreasing cap.
   * @evidence contracts/common.md#clear-and-simple-design Exact root isolation and square-root enclosures remain common numeric owners while this method owns candidate comparison and separate drawing-representation error.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts All roots are considered without convexity or sampled-minimum assumptions; equal feasible costs keep the earlier smaller represented radius, and rounded output is not an exact nearest-point certificate.
   * @evidence contracts/common.md#meaningful-documentation The member states feasible represented radius and real-distance bounds; returned structure names metre units and separate representation error.
   * @evidence contracts/performance.md#efficient-algorithms The degree-at-most-seven polynomial bounds candidate count; dominant work is exact Sturm refinement and rational interval/cost/square-root arithmetic, not a fixed sampling grid.
   * @evidence contracts/performance.md#reuse-equivalent-work Captured profile coefficients are reused, but query-dependent stationary roots and costs are recomputed for actual rho/zeta values.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returned radius/bounds/error are scalars; polynomial fractions, isolated intervals and candidate arrays expire on return/refusal with no retained query cache or task.
   */
  foot(rho: number, zeta: number): IHumanFaceOcularCapFoot {
    const zero: IHumanExactFraction = Fraction.create(0n),
      two: IHumanExactFraction = Fraction.create(2n);
    const four: IHumanExactFraction = Fraction.create(4n),
      six: IHumanExactFraction = Fraction.create(6n);
    const axial: IHumanExactFraction = Fraction.add(
      this.a,
      Fraction.negate(Fraction.from(zeta)),
    );
    const polynomial: IHumanExactFraction[] = [
      Fraction.negate(Fraction.multiply(this.length, Fraction.from(rho))),
      Fraction.add(
        Fraction.multiply(this.length, this.length),
        Fraction.multiply(two, Fraction.multiply(this.b, axial)),
      ),
      zero,
      Fraction.add(
        Fraction.multiply(four, Fraction.multiply(this.c, axial)),
        Fraction.multiply(two, Fraction.multiply(this.b, this.b)),
      ),
      zero,
      Fraction.multiply(six, Fraction.multiply(this.b, this.c)),
      zero,
      Fraction.multiply(four, Fraction.multiply(this.c, this.c)),
    ];
    const endpoint: (value: number) => IHumanPolynomialRoot = (
      value: number,
    ): IHumanPolynomialRoot => ({
      lower: Fraction.from(value),
      upper: Fraction.from(value),
      parameter: value,
    });
    const candidates: IHumanPolynomialRoot[] = [
      endpoint(0),
      ...isolateHumanPolynomialRoots(polynomial),
      endpoint(1),
    ].sort(
      (a: IHumanPolynomialRoot, b: IHumanPolynomialRoot): number =>
        a.parameter - b.parameter,
    );
    const height: (t: IHumanExactFraction) => IHumanExactFraction = (
      t: IHumanExactFraction,
    ): IHumanExactFraction => this.heightAtParameter(t);
    const squaredInterval: (
      a: IHumanExactFraction,
      b: IHumanExactFraction,
    ) => [IHumanExactFraction, IHumanExactFraction] = (
      a: IHumanExactFraction,
      b: IHumanExactFraction,
    ): [IHumanExactFraction, IHumanExactFraction] => {
      const aa: IHumanExactFraction = Fraction.multiply(a, a),
        bb: IHumanExactFraction = Fraction.multiply(b, b);
      const lower: IHumanExactFraction =
        Fraction.compare(a, zero) <= 0 && Fraction.compare(b, zero) >= 0
          ? zero
          : Fraction.compare(aa, bb) < 0
            ? aa
            : bb;
      return [lower, Fraction.compare(aa, bb) > 0 ? aa : bb];
    };
    const radial: IHumanExactFraction = Fraction.from(rho),
      axialCoordinate: IHumanExactFraction = Fraction.from(zeta);
    let best: number = 0,
      error: IHumanExactFraction = zero,
      upper: IHumanExactFraction | undefined,
      lower: IHumanExactFraction | undefined;
    for (const candidate of candidates) {
      const parameter: number = candidate.parameter;
      const radius: number = parameter * this.profile.limbus;
      const radialBounds: [IHumanExactFraction, IHumanExactFraction] =
        squaredInterval(
          Fraction.add(
            Fraction.multiply(this.length, candidate.lower),
            Fraction.negate(radial),
          ),
          Fraction.add(
            Fraction.multiply(this.length, candidate.upper),
            Fraction.negate(radial),
          ),
        );
      const axialBounds: [IHumanExactFraction, IHumanExactFraction] =
        squaredInterval(
          Fraction.add(
            height(candidate.upper),
            Fraction.negate(axialCoordinate),
          ),
          Fraction.add(
            height(candidate.lower),
            Fraction.negate(axialCoordinate),
          ),
        );
      const ownLower: IHumanExactFraction = Fraction.add(
        radialBounds[0],
        axialBounds[0],
      );
      if (lower === undefined || Fraction.compare(ownLower, lower) < 0)
        lower = ownLower;
      // A represented radius remains a feasible point of the same real cap.
      // Its factored output rounding is recorded separately, not relabelled
      // an exact-surface minimum or used to alter the profile.
      const r: IHumanExactFraction = Fraction.add(
        Fraction.from(radius),
        Fraction.negate(radial),
      );
      const exactHeight: IHumanExactFraction = height(
        Fraction.divide(Fraction.from(radius), this.length),
      );
      const z: IHumanExactFraction = Fraction.add(
        exactHeight,
        Fraction.negate(axialCoordinate),
      );
      const ownUpper: IHumanExactFraction = Fraction.add(
        Fraction.multiply(r, r),
        Fraction.multiply(z, z),
      );
      if (upper === undefined || Fraction.compare(ownUpper, upper) < 0) {
        upper = ownUpper;
        best = radius;
        const rounding: IHumanExactFraction = Fraction.add(
          Fraction.from(this.profile.height(radius)),
          Fraction.negate(exactHeight),
        );
        error = rounding.numerator < 0n ? Fraction.negate(rounding) : rounding;
      }
    }
    return {
      radiusMetres: best,
      lowerDistanceMetres: Fraction.sqrtBounds(lower!)[0],
      upperDistanceMetres: Fraction.sqrtBounds(upper!)[1],
      representationErrorMetres: Fraction.sqrtBounds(
        Fraction.multiply(error, error),
      )[1],
    };
  }

  /**
   * Evaluate the one exact quartic height at dimensionless t=r/L.
   *
   * The exact fraction expression a+B*t squared+C*t fourth is shared by radial-height and foot interval/cost calculations, without output rounding or sample correction.
   *
   * One parameter square serves both terms in a fixed number of bit-width-dependent fraction products/sums. Only the returned fraction escapes; temporary fractions expire without retained state or resources.
   */
  private heightAtParameter(t: IHumanExactFraction): IHumanExactFraction {
    const q: IHumanExactFraction = Fraction.multiply(t, t);
    return Fraction.add(
      this.a,
      Fraction.add(
        Fraction.multiply(this.b, q),
        Fraction.multiply(this.c, Fraction.multiply(q, q)),
      ),
    );
  }
}
