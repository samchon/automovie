/**
 * Biometric eye globe shape: the dimensions every eye shares and the
 * anterior surface the lids rest on.
 *
 * The body generator seats this globe behind each eye opening and builds
 * the lid margin on its surface (`AutoMovieHumanEyelid`); the appearance
 * layer revolves the same profile into the visible eyeball
 * (`AutoMovieHumanEyeball`). Both read the shape from here, so the lids and
 * the eye meet exactly.
 *
 * Dimensions are biometric means, the same for every person: adult globe
 * size varies little with sex, age or ancestry (Bekerman et al. 2014 found
 * no significant difference by those factors) and no Human parameter
 * describes it. Derived quantities (the scleral axial semi-axis and the
 * apex position) follow from those means by the stated geometry, not by
 * fitting. These are calibration-millimetre dimensions; every consumer
 * applies the body's common millimetre-to-model conversion after seating.
 */
export namespace AutoMovieHumanEyeGlobe {
  /**
   * Biometric means in millimetres, with their basis.
   *
   * - `radial`: half the mean of the transverse 24.16/24.32 and vertical
   *   23.80/23.75 globe diameters (Bekerman 2014, Table 1, CT, n = 250);
   *   measured.
   * - `axialLength`: corneal apex to posterior pole, 23.48 (Chen 2016,
   *   IOLMaster, n = 1015); measured.
   * - `cornealRadius`: 337.5 / 44.20 D = 7.64 (Chen 2016, keratometric
   *   index 1.3375); derived from measured keratometry.
   * - `limbusRadius`: half the horizontal visible iris diameter, 11.7 mm
   *   (white-to-white, Rüfer et al. 2005, J Cataract Refract Surg
   *   31(1):107-112: 11.71 +/- 0.42); measured, relayed.
   * - `anteriorChamberDepth`: corneal apex to the lens face on which the
   *   pupillary iris rests, 3.03 (Chen 2016); measured.
   * - `pupilRadius`: 2.0, a 4 mm pupil, usual in indoor light between the
   *   photopic 3 mm and the dark-adapted 7 mm; conventional, since no
   *   lighting or expression input sets it.
   * - `irisRecession`: 0.5, how far the iris root lies behind its
   *   pupillary margin (the iris is a shallow cone over the lens);
   *   conventional.
   */
  export const dimensions: {
    radial: number;
    axialLength: number;
    cornealRadius: number;
    limbusRadius: number;
    anteriorChamberDepth: number;
    pupilRadius: number;
    irisRecession: number;
  } = {
    radial: 12.0,
    axialLength: 23.48,
    cornealRadius: 7.64,
    limbusRadius: 5.85,
    anteriorChamberDepth: 3.03,
    pupilRadius: 2.0,
    irisRecession: 0.5,
  };

  /**
   * Quantities derived from {@link dimensions}, millimetres along the gaze
   * axis from the globe centre.
   *
   * The scleral ellipsoid has radial semi-axis `a_r` and axial semi-axis
   * `a_x`; the limbus circle of radius `rho_L` lies on it at
   * `x_L = a_x k`, `k = sqrt(1 - rho_L^2 / a_r^2)`. The corneal sphere of
   * radius `r_c` passes through that circle, so its sagittal height above
   * the limbus plane is `s = r_c - sqrt(r_c^2 - rho_L^2)` and the apex is at
   * `x_A = x_L + s`. With the posterior pole at `-a_x`, the axial length is
   * `L = x_A + a_x`, hence `a_x = (L - s) / (1 + k)`.
   */
  export interface IDerived {
    /** Axial semi-axis of the scleral ellipsoid. */
    axial: number;

    /** Limbus plane position. */
    limbus: number;

    /** Corneal sphere centre position. */
    cornealCentre: number;

    /** Corneal apex position. */
    apex: number;

    /** Pupillary iris margin position, on the lens face. */
    pupil: number;
  }

  /**
   * Evaluate {@link IDerived} from {@link dimensions}.
   *
   * @returns Derived axial positions in millimetres
   */
  export function derive(): IDerived {
    const d: typeof dimensions = dimensions;
    const k: number = Math.sqrt(1 - (d.limbusRadius / d.radial) ** 2);
    const capOffset: number = Math.sqrt(
      d.cornealRadius ** 2 - d.limbusRadius ** 2,
    );
    const sag: number = d.cornealRadius - capOffset;
    const axial: number = (d.axialLength - sag) / (1 + k);
    const limbus: number = axial * k;
    const apex: number = limbus + sag;
    return {
      axial,
      limbus,
      cornealCentre: limbus - capOffset,
      apex,
      pupil: apex - d.anteriorChamberDepth,
    };
  }

  /**
   * Axial position of the globe's anterior surface at a distance from its
   * gaze axis: the cornea inside the limbus, the scleral ellipsoid outside.
   *
   * @param rho Distance from the gaze axis, millimetres
   * @returns Millimetres along the gaze from the globe centre; NaN at or
   *   beyond the globe's radial semi-axis
   */
  export function anterior(rho: number): number {
    const d: typeof dimensions = dimensions;
    const g: IDerived = derive();
    if (rho <= d.limbusRadius)
      return g.cornealCentre + Math.sqrt(d.cornealRadius ** 2 - rho ** 2);
    if (rho >= d.radial) return NaN;
    return g.axial * Math.sqrt(1 - (rho / d.radial) ** 2);
  }

  /**
   * Axial shift that seats the globe's anterior surface on an eye sphere
   * about the frame centre.
   *
   * Both surfaces are functions of the distance `rho` from the gaze axis:
   * the sphere `x_s(rho) = sqrt(R^2 - rho^2)`, and the globe's
   * {@link anterior} surface `x_g(rho)`. The least-squares shift of `x_g`
   * onto `x_s`, weighting each `rho` by the ring area `rho d rho` it stands
   * for, is the weighted mean of `x_s - x_g`. The band runs from the axis
   * to 10 mm, the horizontal reach of an adult eye opening on the globe,
   * capped below both radii.
   *
   * @param radius Eye sphere radius, millimetres
   * @returns Shift along the gaze in millimetres from the sphere's centre to
   *   the globe's centre
   */
  export function seat(radius: number): number {
    const reach: number = Math.min(10, 0.95 * radius, 0.95 * dimensions.radial);
    let sum: number = 0;
    let weight: number = 0;
    for (let i: number = 0; i < 100; ++i) {
      const rho: number = ((i + 0.5) / 100) * reach;
      sum += rho * (Math.sqrt(radius ** 2 - rho ** 2) - anterior(rho));
      weight += rho;
    }
    return sum / weight;
  }
}
