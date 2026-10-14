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
 * @evidence contracts/common.md#principled-implementation The admitted dimensions define one rim-factored quartic with C1 sphere join and requested apex curvature, while strict internal-shell inequalities preserve ordering.
 * @evidence contracts/common.md#clear-and-simple-design One captured metric profile/evaluator owner is shared by drawing, exact metrics and analytic seating.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Inflection remains supported; authored polynomial shape, axial backing and supplied dimensions are not fitted clinical anatomy or clamped to acceptance.
 * @evidence contracts/common.md#meaningful-documentation The prose gives millimetre/micrometre conversion, polynomial identities, preserved rim and strict shell/iris placement conditions.
 * @evidence contracts/performance.md#efficient-algorithms Seven scalar checks and fixed coefficient/rim evaluations require constant work, as do subsequent height/slope queries.
 * @evidence contracts/performance.md#reuse-equivalent-work Captured metre scalars/rim are reused by both evaluators; all optical consumers receive the same admitted profile.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned scalar/evaluator record owns captured numbers for caller lifetime; input dimensions and external resources are not retained.
 */
export function resolveHumanFaceOpticalProfile(
  input: IAutoMovieHumanFaceOpticalDimensions,
): {
  radius: number;
  limbus: number;
  curvature: number;
  thickness: number;
  iris: number;
  aperture: number;
  depth: number;
  rim: number;
  apex: number;
  irisZ: number;
  height: (r: number) => number;
  slope: (r: number) => number;
} {
  const dimensions: number[] = [
    input.globeRadiusMm,
    input.limbusRadiusMm,
    input.apexCurvatureRadiusMm,
    input.centralThicknessMicrometres,
    input.irisOuterRadiusMm,
    input.irisApertureRadiusMm,
    input.irisDepthFromAnteriorSupportMm,
  ];
  if (
    dimensions.some(
      (value: number): boolean => !Number.isFinite(value) || value <= 0,
    )
  )
    throw new Error(
      "Independent optics need seven finite positive dimensions.",
    );
  const [radius, limbus, curvature]: number[] = dimensions
    .slice(0, 3)
    .map((v: number): number => v / 1000);
  const thickness: number = input.centralThicknessMicrometres / 1000000;
  const iris: number = input.irisOuterRadiusMm / 1000;
  const aperture: number = input.irisApertureRadiusMm / 1000;
  const depth: number = input.irisDepthFromAnteriorSupportMm / 1000;
  if (
    !(0 < aperture && aperture < iris && iris <= limbus && limbus < radius) ||
    [radius, limbus, curvature, thickness, iris, aperture, depth].some(
      (v: number): boolean => v <= 0,
    )
  )
    throw new Error(
      "Independent optics need aperture < iris <= limbus < globe, in finite metre dimensions.",
    );
  const rim: number = Math.sqrt((radius - limbus) * (radius + limbus));
  const height: (r: number) => number = (r: number): number => {
    const q: number = (r / limbus) ** 2;
    return (
      rim +
      (((limbus - r) * (limbus + r)) / 4) *
        ((1 - q) / curvature + (1 + q) / rim)
    );
  };
  const slope: (r: number) => number = (r: number): number => {
    const q: number = (r / limbus) ** 2;
    return -r * ((1 - q) / curvature + q / rim);
  };
  const a: number = height(0);
  const irisZ: number = a - depth;
  const posteriorAtIris: number = -Math.sqrt(radius * radius - iris * iris);
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
