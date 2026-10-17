import { AutoMovieCubicOval64 } from "@automovie/engine";

import type { IAutoMovieHumanIdentity as I } from "../../../structures/IAutoMovieHumanIdentity";

/**
 * Shared circumference and proxy-plane laws for pelvis and distal legs. All heights increase proximally in one straight bone chart, in millimetres. Transferring tape measurements to these estimated planes is a convention, not a clinical conversion or a reference-shape fit.
 *
 * @author Samchon
 */
export namespace AutoMovieLegIdentityRules64 {
  /**
   * Hip, knee and patella coordinates in one straight longitudinal chart; all Y values use the same millimetre datum.
   *
   * @author Samchon
   */
  export interface Levels {
    /** Hip centre longitudinal coordinate, mm, proximal to the knee. */
    hipY: number;

    /** Knee joint centre longitudinal coordinate, mm. */
    kneeY: number;

    /** Patella midpoint longitudinal coordinate, mm; distinct from the knee joint centre. */
    patellaY: number;
  }

  /**
   * Transfer public thigh girths linearly between two conventional planes. The virtual furrow is 15% of hip-to-knee drop below hip. The suprapatellar proxy is half the declared patella height above its midpoint; omitted height is 10% clinical thigh length. These are authoring conventions, not measured fold locations. Out-of-range queries or unresolved endpoint order throw.
   */
  export function resolveLegGirth64(
    leg: I.ILeg,
    levels: Levels,
    y: number,
    patellaHeightMm: number = 0.1 * leg.thighLength,
  ): number {
    const furrow: number = levels.hipY - 0.15 * (levels.hipY - levels.kneeY);
    const supra: number = levels.patellaY + patellaHeightMm / 2;
    if (
      ![
        furrow,
        supra,
        y,
        leg.thighCircumference,
        leg.lowerThighCircumference,
      ].every(Number.isFinite) ||
      !(
        furrow > supra &&
        leg.thighCircumference > 0 &&
        leg.lowerThighCircumference > 0
      ) ||
      y < supra ||
      y > furrow
    )
      throw new Error(
        "Thigh proxy law requires a height between supra and furrow",
      );
    return (
      leg.lowerThighCircumference +
      ((leg.thighCircumference - leg.lowerThighCircumference) * (y - supra)) /
        (furrow - supra)
    );
  }

  /**
   * Integrate the actual four cardinal cubic arcs' perimeter, in millimetres. Positive breadth/depth and an even interval count of at least two are required. Composite Simpson integration uses 256 intervals per quarter by default. Kappa=4(sqrt(2)-1)/3 is a quarter-circle tangent construction; the result is a finite quadrature estimate, not an exact ellipse perimeter.
   */
  export const cubicPerimeter64: typeof AutoMovieCubicOval64.perimeterBySimpson =
    AutoMovieCubicOval64.perimeterBySimpson;

  /**
   * Scale a cubic oval to the target girth at fixed positive breadth/depth. Omitted ratio means the circular convention 1; girth alone cannot determine cross-sectional aspect. Returned dimensions are mm under the same Simpson perimeter approximation used to normalize the construction.
   */
  export const cubicAxesFromCircumference: typeof AutoMovieCubicOval64.axesBySimpson =
    AutoMovieCubicOval64.axesBySimpson;

  /**
   * Solve cubic-oval depth in mm from positive same-plane breadth and girth. Girth must exceed the collapsed limit 2*breadth. At most 64 bisections on [0,girth/2] stop earlier when binary64 cannot refine the bracket. Separate survey minima need a caller-owned plane-transfer assumption; this equation cannot make them simultaneous anatomical observations.
   */
  export const cubicDepthFromGirthBreadth: typeof AutoMovieCubicOval64.otherDiameterBySimpson =
    AutoMovieCubicOval64.otherDiameterBySimpson;
}
