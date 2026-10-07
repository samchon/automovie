import type { IAutoMovieHumanFaceOpticalDimensions } from "../../structures/IAutoMovieHumanFaceOpticalDimensions";

/**
 * Admit one complete optical record and establish its shared metric profile.
 *
 * For globe radius R and limbal radius L, s=sqrt(R²-L²). The anterior surface
 * is G(r)=A+B r²+C r⁴, with B=-1/(2Rc), C=(1/Rc-1/s)/(4L²) and
 * A=s-B L²-C L⁴. Thus G(L)=s and G'(L)=-L/s match the posterior sphere,
 * while G''(0)=-1/Rc sets the requested central curvature. This C1 join is
 * an authored polynomial convention, not a measured corneal shape.
 *
 * Evaluation factors the same polynomial around the rim: with q=(r/L)²,
 * G(r)=s+(L-r)(L+r)*((1-q)/Rc+(1+q)/s)/4 and
 * G'(r)=-r*((1-q)/Rc+q/s). This preserves the declared rim exactly without
 * subtracting large opposing polynomial coefficients.
 *
 * The back is G(r)-T. Its least separation from the posterior sphere is at
 * L, so T<2s keeps the shell inside the outer hull. The flat iris plane is
 * G(0)-d: it must lie behind the corneal back at its outer radius and in front
 * of the posterior sphere there. These strict inequalities exclude touching,
 * inverted or intersecting internal surfaces. Curvature inflection alone is
 * not a refusal: the derivative is negative throughout (0,L), because its
 * factor is affine in r² and negative at both ends. No value is clamped.
 *
 * @evidence contracts/common.md#principled-implementation Derives the common interface value and tangent, central curvature, monotonicity and containment inequalities from the explicit dimensions.
 * @evidence contracts/common.md#clear-and-simple-design One conversion and one profile feed drawing and contact.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid supplied geometry throws without defaults, retries or population bounds.
 * @evidence contracts/common.md#meaningful-documentation States the polynomial, approximations, inequalities and refusal consequences.
 * @evidence contracts/modeling.md#shared-boundaries The scleral sphere and anterior profile share G(L) and G'(L) by construction.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres divide by 1000 and micrometres by 1000000 once; all returned lengths and queries are metres.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The profile names no rendered part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The dimension record owns input meanings.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The geometry builder owns tessellation.
 * @evidenceExclude contracts/modeling.md#rendered-observation The connected assembly owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Introduces no anatomical constant.
 * @evidenceExclude contracts/anatomy.md#permitted-range Strict geometric feasibility is not a clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Reads the named dimension record without defining additional controls.
 */
export function resolveHumanFaceOpticalProfile(
  input: IAutoMovieHumanFaceOpticalDimensions,
) {
  const dimensions = [
    input.globeRadiusMm,
    input.limbusRadiusMm,
    input.apexCurvatureRadiusMm,
    input.centralThicknessMicrometres,
    input.irisOuterRadiusMm,
    input.irisApertureRadiusMm,
    input.irisDepthFromAnteriorSupportMm,
  ];
  if (dimensions.some((value) => !Number.isFinite(value) || value <= 0))
    throw new Error(
      "Independent optics need seven finite positive dimensions.",
    );
  const [radius, limbus, curvature] = dimensions
    .slice(0, 3)
    .map((v) => v / 1000);
  const thickness = input.centralThicknessMicrometres / 1000000;
  const iris = input.irisOuterRadiusMm / 1000;
  const aperture = input.irisApertureRadiusMm / 1000;
  const depth = input.irisDepthFromAnteriorSupportMm / 1000;
  if (
    !(0 < aperture && aperture < iris && iris <= limbus && limbus < radius) ||
    [radius, limbus, curvature, thickness, iris, aperture, depth].some(
      (v) => v <= 0,
    )
  )
    throw new Error(
      "Independent optics need aperture < iris <= limbus < globe, in finite metre dimensions.",
    );
  const rim = Math.sqrt((radius - limbus) * (radius + limbus));
  const height = (r: number): number => {
    const q = (r / limbus) ** 2;
    return (
      rim +
      (((limbus - r) * (limbus + r)) / 4) *
        ((1 - q) / curvature + (1 + q) / rim)
    );
  };
  const slope = (r: number): number => {
    const q = (r / limbus) ** 2;
    return -r * ((1 - q) / curvature + q / rim);
  };
  const a = height(0);
  const irisZ = a - depth;
  const posteriorAtIris = -Math.sqrt(radius * radius - iris * iris);
  if (
    ![rim, a, irisZ, posteriorAtIris, height(iris)].every(Number.isFinite) ||
    !(
      rim > 0 &&
      thickness < 2 * rim &&
      irisZ < height(iris) - thickness &&
      irisZ > posteriorAtIris
    )
  )
    throw new Error(
      "Independent optical profile cannot contain the supplied corneal thickness and iris plane.",
    );
  return {
    radius,
    limbus,
    curvature,
    thickness,
    iris,
    aperture,
    depth,
    rim,
    apex: a,
    irisZ,
    height,
    slope,
  };
}
