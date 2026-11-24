import type { IAutoMovieHumanBodyMeasures } from "@automovie/interface";

/**
 * Ankle-relative sagittal datums for the standing neutral frame. The ankle
 * midpoint is the origin. Clinical skeletal alignment supplies the neutral
 * landmarks, with explicit transfers from skeletal to surface sites.
 */
export namespace AutoMovieHumanBodyPlaces {
  /**
   * Reference stature for scaling the nominal adult offsets. This rounded 1700
   * mm model value represents the two ANSUR II sex means. Hasegawa's offsets
   * are sample means in millimetres.
   */
  const ADULT_STATURE: number = 1700;

  /**
   * Hasegawa et al. 2017, Figure 4. Ankle-joint midpoint 48 mm behind the
   * gravity line.
   */
  const ANKLE_ON_GRAVITY_LINE: number = -48;

  /**
   * Hasegawa et al. 2017, Figure 4. C7 vertebral-body centre 18 mm behind the
   * gravity line.
   */
  const C7_ON_GRAVITY_LINE: number = -18;

  /**
   * Hasegawa et al. 2017, Figure 4. Midpoint of the hip-joint centres 14 mm
   * ahead of the gravity line.
   */
  const HIP_ON_GRAVITY_LINE: number = 14;

  /**
   * ESTIMATE of the posterior transfer from the C7 body centre to cervicale.
   * Grünwald et al. 2024, Table 1, gives a 72 mm body-centre-to-skin mean for
   * its mild-deformation subgroup on supine CT
   * (doi:10.1186/s12880-024-01293-6). Transfer that distance to the neutral
   * sagittal projection. The ISO 8559-1 back-neck point is the posterior skin
   * projection of the spinous process.
   */
  const C7_TO_POSTERIOR_SKIN: number = 72;

  /**
   * Cervicale posterior-skin offset from the ankle midpoint per stature. The
   * neutral C7 bone coordinate uses Hasegawa et al. 2017
   * (doi:10.1111/joa.12586) before the separate surface transfer.
   */
  export const CERVICALE: number =
    (C7_ON_GRAVITY_LINE - ANKLE_ON_GRAVITY_LINE - C7_TO_POSTERIOR_SKIN) /
    ADULT_STATURE;

  /**
   * ESTIMATE of the perineal skin pole's offset from the ankle midpoint per
   * stature. Use the hip-axis plumb line because the lower-body frame shares
   * this sagittal origin and has no separate perineal AP input. This is a
   * geometric transfer of Hasegawa's bony hip-axis offset.
   */
  export const PERINEUM: number =
    (HIP_ON_GRAVITY_LINE - ANKLE_ON_GRAVITY_LINE) / ADULT_STATURE;

  /**
   * Posterior skin datum at cervicale relative to the ankle midpoint, world
   * millimetres.
   */
  export function cervicale(measures: IAutoMovieHumanBodyMeasures): number {
    return CERVICALE * measures.stature;
  }

  /**
   * Perineal skin-pole estimate relative to the ankle midpoint, world
   * millimetres.
   */
  export function perineum(measures: IAutoMovieHumanBodyMeasures): number {
    return PERINEUM * measures.stature;
  }
}
