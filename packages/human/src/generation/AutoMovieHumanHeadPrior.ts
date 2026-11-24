import type { IAutoMovieHumanHeadPrior } from "@automovie/interface";

/**
 * Named constants of the head and ear construction, shared by every person and
 * both sides.
 *
 * The head is built from Farkas landmarks placed by their published definitions
 * and population relations. Lengths taken from a published norm are written in
 * that norm's millimetres and scaled by the person's face height over the
 * norm's (`profile.unit`), so a constant never fixes a size. Construction
 * conventions complete dimensions the published sources do not define. The
 * person's own dimensions and the neck's generating landmarks supply the
 * placement in AutoMovieHumanHeadLandmarks.
 */
export namespace AutoMovieHumanHeadPrior {
  /** Park et al. 2012 Table 1, adult Di3D glabella–nasion chord, mm. */
  const BROW_CHORD: number = 12.56;

  /**
   * ESTIMATE: a steep brow chord inclined forward one twenty-fourth of a
   * straight angle from vertical.
   */
  const BROW_TILT: number = Math.PI / 24;

  /** Female adult morphological face height, Weinberg et al. 2016, mm. */
  const FACE_UNIT: number = 118.6;

  /**
   * Mean radius of the two emmetropic axial diameters, Bekerman et al. 2014
   * Table 1, mm.
   */
  const GLOBE_RADIUS: number = (23.562 + 23.422) / 4;

  /**
   * Corneal plane to nasion, Wilson et al. 2023 lateral profile measurements,
   * mm.
   */
  const RADIX_PROJECTION: number = 7.8;

  /**
   * ESTIMATE: base plane of the broad aperture midway from the globe's equator
   * to the apex.
   */
  const APERTURE_ADVANCE: number = GLOBE_RADIUS / 2;

  /** The population's prior. */
  export const PRIOR: IAutoMovieHumanHeadPrior.IPrior = {
    profile: {
      unit: FACE_UNIT,
      glabella: (BROW_CHORD * Math.cos(BROW_TILT)) / FACE_UNIT,
      nasion: BROW_CHORD * Math.sin(BROW_TILT),
      subnasale: 6,
      pogonion: 0,
      lips: [3, 2],
      sulcus: 4,
      lip: 1 / 3,
      chin: 1 / 3,
      bridge: 0.875,
    },
    frame: {
      tragion: 0.637,
      tragionDrop: 0.07,
      base: 0.962,
      zygion: 0.1,
      arch: 0.25,
      frontal: 0.16,
      plan: 2,
      union: 6,
      clear: 6,
    },
    face: {
      profileKnots: [-0.3, 0, 0.2, 0.55, 1, 1.25],
      profile: [0, 0.82, 0.86, 0.6, 0.2, 0],
      dorsum: [0.7, 0.66, 0.6, 0.52, 0.48, 0.5],
      tipBall: [0.8, 0.46, 0.72],
      ala: [11, 0.62, 0.3, 0.25, 0.2, 0.4],
      underside: [0.05, 4],
      nasolabial: [101.25, 3.75],
      crease: [1, 0.5, 1.3],
      // Legan and Burstone 1980, resting interlabial gap (sd 2 mm).
      gape: 2,
      joint: 0.09,
      // ESTIMATE: the groove takes the central half of the crista-philtri span and a quarter of its half-width in depth.
      // Weinberg et al. 2016, adult female crista-philtri separation 11.8 mm over the 48.1 mm mouth width.
      philtrum: [1 / 4, 11.8 / (4 * 48.1)],
      // The apex is the radius in front of the centre and the aperture's base plane is midway between them.
      eyeRecess: RADIX_PROJECTION + GLOBE_RADIUS - APERTURE_ADVANCE,
      radius: GLOBE_RADIUS,
      marginForward: APERTURE_ADVANCE,
      nostrilSweep: 40,
      nostrilTear: 0.35,
    },
    // Frankfort to mandibular plane 25 degrees, steeper in women; gonial angle
    // about 120 in men and 125 in women; a cervicomental angle of about 112.
    mandible: {
      plane: [25, 2.5],
      angle: [122.5, 2.5],
      throatAngle: 100,
      under: 3,
    },
    ear: {
      // Cho et al. 2025, mean insertion and lobular length over mean sa–sba; women then men.
      insertion: [53.55 / 64.5, 54.45 / 66.95],
      lobule: [23.5 / 64.5, 25.3 / 66.95],

      // ESTIMATE: a thin carrier and circular rims leave the ear's measured chord to locate the actual outer endpoints.
      rim: 1 / 16,
      ridge: 1 / 12,
    },
  };
}
