import { HumanExactFraction as Fraction } from "../../../common/measure/HumanExactFraction";
import type { IHumanExactFraction } from "../../../common/measure/IHumanExactFraction";
import type { IHumanPolynomialRoot } from "../../../common/measure/IHumanPolynomialRoot";
import { isolateHumanPolynomialRoots } from "../../../common/measure/isolateHumanPolynomialRoots";
import type { resolveHumanFaceOpticalProfile } from "./resolveHumanFaceOpticalProfile";
import type { IHumanFaceOcularCapFoot } from "./structures/IHumanFaceOcularCapFoot";

/**
 * Compile one admitted cap's exact represented-input distance polynomial.
 * For t=r/L, G=a+B t²+C t⁴. Every stationary distance parameter is a
 * root of a degree-seven polynomial; endpoint and all stationary candidates
 * are compared through the same factored profile evaluator used by drawing.
 * Neither convexity nor a single sampled minimum is assumed. Binary64
 * rounding of isolated parameters belongs to the common Sturm owner.
 * A private flat profile copy retains its scalars and evaluator references
 * with the coefficients, including the receiver of a method evaluator. The evaluator must retain the same profile internally;
 * the normal profile owner closes over its resolved local scalar values.
 *
 */
export class HumanFaceOcularCapMetric {
  private readonly length: IHumanExactFraction;
  private readonly a: IHumanExactFraction;
  private readonly b: IHumanExactFraction;
  private readonly c: IHumanExactFraction;

  private readonly profile: ReturnType<typeof resolveHumanFaceOpticalProfile>;

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
    const square = Fraction.multiply(this.length, this.length);
    const curvature = Fraction.from(profile.curvature),
      rim = Fraction.from(profile.rim);
    const inverseCurvature = Fraction.divide(Fraction.create(1n), curvature);
    const inverseRim = Fraction.divide(Fraction.create(1n), rim);
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
   */
  heightAtRadius(radius: IHumanExactFraction): IHumanExactFraction {
    return this.heightAtParameter(Fraction.divide(radius, this.length));
  }

  /** Exact meridian second derivative of the same represented-input profile.
   */
  secondDerivativeAtRadius(radius: IHumanExactFraction): IHumanExactFraction {
    const square = Fraction.multiply(this.length, this.length);
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

  /** Return the nearest cap radius; equal represented costs keep the smaller radius.
   */
  foot(rho: number, zeta: number): IHumanFaceOcularCapFoot {
    const zero = Fraction.create(0n),
      two = Fraction.create(2n);
    const four = Fraction.create(4n),
      six = Fraction.create(6n);
    const axial = Fraction.add(this.a, Fraction.negate(Fraction.from(zeta)));
    const polynomial = [
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
    const endpoint = (value: number): IHumanPolynomialRoot => ({
      lower: Fraction.from(value),
      upper: Fraction.from(value),
      parameter: value,
    });
    const candidates = [
      endpoint(0),
      ...isolateHumanPolynomialRoots(polynomial),
      endpoint(1),
    ].sort((a, b) => a.parameter - b.parameter);
    const height = (t: IHumanExactFraction): IHumanExactFraction =>
      this.heightAtParameter(t);
    const squaredInterval = (
      a: IHumanExactFraction,
      b: IHumanExactFraction,
    ): [IHumanExactFraction, IHumanExactFraction] => {
      const aa = Fraction.multiply(a, a),
        bb = Fraction.multiply(b, b);
      const lower =
        Fraction.compare(a, zero) <= 0 && Fraction.compare(b, zero) >= 0
          ? zero
          : Fraction.compare(aa, bb) < 0
            ? aa
            : bb;
      return [lower, Fraction.compare(aa, bb) > 0 ? aa : bb];
    };
    const radial = Fraction.from(rho),
      axialCoordinate = Fraction.from(zeta);
    let best = 0,
      error = zero,
      upper: IHumanExactFraction | undefined,
      lower: IHumanExactFraction | undefined;
    for (const candidate of candidates) {
      const parameter = candidate.parameter;
      const radius = parameter * this.profile.limbus;
      const radialBounds = squaredInterval(
        Fraction.add(
          Fraction.multiply(this.length, candidate.lower),
          Fraction.negate(radial),
        ),
        Fraction.add(
          Fraction.multiply(this.length, candidate.upper),
          Fraction.negate(radial),
        ),
      );
      const axialBounds = squaredInterval(
        Fraction.add(height(candidate.upper), Fraction.negate(axialCoordinate)),
        Fraction.add(height(candidate.lower), Fraction.negate(axialCoordinate)),
      );
      const ownLower = Fraction.add(radialBounds[0], axialBounds[0]);
      if (lower === undefined || Fraction.compare(ownLower, lower) < 0)
        lower = ownLower;
      // A represented radius remains a feasible point of the same real cap.
      // Its factored output rounding is recorded separately, not relabelled
      // an exact-surface minimum or used to alter the profile.
      const r = Fraction.add(Fraction.from(radius), Fraction.negate(radial));
      const exactHeight = height(
        Fraction.divide(Fraction.from(radius), this.length),
      );
      const z = Fraction.add(exactHeight, Fraction.negate(axialCoordinate));
      const ownUpper = Fraction.add(
        Fraction.multiply(r, r),
        Fraction.multiply(z, z),
      );
      if (upper === undefined || Fraction.compare(ownUpper, upper) < 0) {
        upper = ownUpper;
        best = radius;
        const rounding = Fraction.add(
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
   */
  private heightAtParameter(t: IHumanExactFraction): IHumanExactFraction {
    const q = Fraction.multiply(t, t);
    return Fraction.add(
      this.a,
      Fraction.add(
        Fraction.multiply(this.b, q),
        Fraction.multiply(this.c, Fraction.multiply(q, q)),
      ),
    );
  }
}
