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
 * @evidence contracts/common.md#principled-implementation Exact rational coefficients retain all stationary roots of the admitted quartic profile, and actual profile evaluation compares their distances with both endpoints.
 * @evidence contracts/common.md#clear-and-simple-design Immutable profile coefficients are compiled once; each query supplies only its two meridian coordinates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No curvature region, sample grid or iteration budget selects a minimum.
 * @evidence contracts/common.md#meaningful-documentation States parameter normalization and the separate final factored evaluation boundary.
 * @evidence contracts/modeling.md#spatial-conventions Radius and axial coordinate use the admitted profile's metre meridian frame.
 *
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Numerical representations and operations define no anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Existing source and parameter owners supply values; this operation introduces no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no render primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Computes numerical data; construction owners define geometric joins.
 * @evidenceExclude contracts/modeling.md#rendered-observation Numerical data has no independent rendered output; geometry consumers observe their results.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no clinical measurement, acquisition protocol or anatomical default.
 * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical input admission remains with the profile and source owners.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Does not expose personal sculpting or a clinical conversion.
 */
export class HumanFaceOcularCapMetric {
  private readonly length: IHumanExactFraction;
  private readonly a: IHumanExactFraction;
  private readonly b: IHumanExactFraction;
  private readonly c: IHumanExactFraction;

  private readonly profile: ReturnType<typeof resolveHumanFaceOpticalProfile>;

  constructor(
    inputProfile: ReturnType<typeof resolveHumanFaceOpticalProfile>,
  ) {
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
   *
   * @evidence contracts/common.md#principled-implementation The registered quartic coefficients are evaluated as exact fractions at the requested radius.
   * @evidence contracts/common.md#clear-and-simple-design heightAtRadius keeps its specific numerical operation with the shared owning implementation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts heightAtRadius retains represented inputs and explicit numerical failure instead of substituting a geometry-specific threshold.
   * @evidence contracts/common.md#meaningful-documentation Read the real quartic cap height at an exact radius before output rounding; radius and height use profile metres.
   * @evidence contracts/modeling.md#spatial-conventions Ocular metric coordinates use profile metres and dimensionless or radian patch parameters; derivative quantities retain their stated units.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Numerical representations and operations define no anatomical part.
   * @evidenceExclude contracts/modeling.md#parameter-channels Existing source and parameter owners supply values; this operation introduces no authoring channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no render primitive.
   * @evidenceExclude contracts/modeling.md#shared-boundaries Computes numerical data; construction owners define geometric joins.
   * @evidenceExclude contracts/modeling.md#rendered-observation Numerical data has no independent rendered output; geometry consumers observe their results.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no clinical measurement, acquisition protocol or anatomical default.
   * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical input admission remains with the profile and source owners.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Does not expose personal sculpting or a clinical conversion.
   */
  heightAtRadius(radius: IHumanExactFraction): IHumanExactFraction {
    return this.heightAtParameter(Fraction.divide(radius, this.length));
  }

  /** Exact meridian second derivative of the same represented-input profile.
   *
   * @evidence contracts/common.md#principled-implementation The derivative is obtained algebraically from the same quartic coefficients and normalized radius.
   * @evidence contracts/common.md#clear-and-simple-design secondDerivativeAtRadius keeps its specific numerical operation with the shared owning implementation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts secondDerivativeAtRadius retains represented inputs and explicit numerical failure instead of substituting a geometry-specific threshold.
   * @evidence contracts/common.md#meaningful-documentation Read the same cap polynomial second derivative at an exact metre radius; the result has inverse-metre units.
   * @evidence contracts/modeling.md#spatial-conventions Ocular metric coordinates use profile metres and dimensionless or radian patch parameters; derivative quantities retain their stated units.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Numerical representations and operations define no anatomical part.
   * @evidenceExclude contracts/modeling.md#parameter-channels Existing source and parameter owners supply values; this operation introduces no authoring channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no render primitive.
   * @evidenceExclude contracts/modeling.md#shared-boundaries Computes numerical data; construction owners define geometric joins.
   * @evidenceExclude contracts/modeling.md#rendered-observation Numerical data has no independent rendered output; geometry consumers observe their results.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no clinical measurement, acquisition protocol or anatomical default.
   * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical input admission remains with the profile and source owners.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Does not expose personal sculpting or a clinical conversion.
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
   *
   * @evidence contracts/common.md#principled-implementation Complete stationary-root isolation and endpoint comparison bound the nearest metric without a convexity assumption.
   * @evidence contracts/common.md#clear-and-simple-design foot keeps its specific numerical operation with the shared owning implementation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts foot retains represented inputs and explicit numerical failure instead of substituting a geometry-specific threshold.
   * @evidence contracts/common.md#meaningful-documentation Select a represented cap radius from both endpoints and all stationary intervals, retaining a complete distance enclosure.
   * @evidence contracts/modeling.md#spatial-conventions Ocular metric coordinates use profile metres and dimensionless or radian patch parameters; derivative quantities retain their stated units.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Numerical representations and operations define no anatomical part.
   * @evidenceExclude contracts/modeling.md#parameter-channels Existing source and parameter owners supply values; this operation introduces no authoring channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no render primitive.
   * @evidenceExclude contracts/modeling.md#shared-boundaries Computes numerical data; construction owners define geometric joins.
   * @evidenceExclude contracts/modeling.md#rendered-observation Numerical data has no independent rendered output; geometry consumers observe their results.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no clinical measurement, acquisition protocol or anatomical default.
   * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical input admission remains with the profile and source owners.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Does not expose personal sculpting or a clinical conversion.
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
    const height = (t: IHumanExactFraction): IHumanExactFraction => this.heightAtParameter(t);
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
   *
   */
  private heightAtParameter(t: IHumanExactFraction): IHumanExactFraction {
    const q = Fraction.multiply(t, t);
    return Fraction.add(this.a, Fraction.add(Fraction.multiply(this.b, q),
      Fraction.multiply(this.c, Fraction.multiply(q, q))));
  }
}
