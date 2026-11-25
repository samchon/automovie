/**
 * Type contracts exchanged by AutoMovieHumanEyeGlobe; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanEyeGlobe {
  /**
   * Quantities derived from {@link dimensions}, millimetres along the gaze axis
   * from the globe centre.
   *
   * The scleral ellipsoid has radial semi-axis `a_r` and axial semi-axis `a_x`;
   * the limbus circle of radius `rho_L` lies on it at `x_L = a_x k`, `k =
   * sqrt(1 - rho_L^2 / a_r^2)`. The corneal sphere of radius `r_c` passes
   * through that circle, so its sagittal height above the limbus plane is `s =
   * r_c - sqrt(r_c^2 - rho_L^2)` and the apex is at `x_A = x_L + s`. With the
   * posterior pole at `-a_x`, the axial length is `L = x_A + a_x`, hence `a_x =
   * (L - s) / (1 + k)`.
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
   * Biometric means in millimetres, with their basis.
   *
   * - `radial`: half the mean of the transverse 24.16/24.32 and vertical
   *   23.80/23.75 globe diameters (Bekerman 2014, Table 1, CT, n = 250);
   *   measured.
   * - `axialLength`: corneal apex to posterior pole, 23.48 (Chen 2016, IOLMaster,
   *   n = 1015); measured.
   * - `cornealRadius`: 337.5 / 44.20 D = 7.64 (Chen 2016, keratometric index
   *   1.3375); derived from measured keratometry.
   * - `limbusRadius`: half the horizontal visible iris diameter, 11.7 mm
   *   (white-to-white, Rüfer et al. 2005, J Cataract Refract Surg
   *   31(1):107-112: 11.71 +/- 0.42); measured, relayed.
   * - `anteriorChamberDepth`: corneal apex to the lens face on which the
   *   pupillary iris rests, 3.03 (Chen 2016); measured.
   * - `pupilRadius`: 2.0, a 4 mm pupil, usual in indoor light between the
   *   photopic 3 mm and the dark-adapted 7 mm; conventional, since no lighting
   *   or expression input sets it.
   * - `irisRecession`: 0.5, how far the iris root lies behind its pupillary
   *   margin (the iris is a shallow cone over the lens); conventional.
   */
  export type IDimensions = {
    /** Scleral radial semi-axis, millimetres. */
    radial: number;
    /** Corneal apex to posterior pole, millimetres. */
    axialLength: number;
    /** Anterior corneal curvature radius, millimetres. */
    cornealRadius: number;
    /** Radius at the corneoscleral boundary, millimetres. */
    limbusRadius: number;
    /** Corneal apex to the lens-facing iris plane, millimetres. */
    anteriorChamberDepth: number;
    /** Conventional pupil radius, millimetres, independent of lighting inputs. */
    pupilRadius: number;
    /** Iris-root depth behind its pupillary margin, millimetres. */
    irisRecession: number;
  };
}
