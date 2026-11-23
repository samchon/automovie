import type { IAutoMovieHumanBodyAnatomy } from "./IAutoMovieHumanBodyAnatomy";

/**
 * One leg, measured standing.
 *
 * Thigh length, shank length and ankle height are vertical height intervals in
 * the same standing-surface datum. Their sum is the trochanterion height of
 * that leg, the top of the greater trochanter above the standing surface.
 *
 * A measure `IAutoMovieHumanBodyAnatomy` also declares (the right side there)
 * takes its range from that declaration, so no measure has two ranges.
 */
export interface IAutoMovieHumanLegIdentity {
  /**
   * Thigh length: trochanterion height minus tibiale height, the top of the
   * greater trochanter to the upper edge of the medial tibial condyle,
   * millimetres. Schema constraints: Minimum: 60; Maximum: 800; retained by
   * Human's schema refinement.
   */
  thighLength: number;

  /**
   * Shank length: tibiale height minus lateral malleolus height, millimetres.
   * Schema constraints: Minimum: 60; Maximum: 700; retained by Human's schema
   * refinement.
   */
  shankLength: number;

  /**
   * Lateral malleolus height: the lateral malleolus landmark, the most
   * laterally prominent point of the fibula's lower end, above the standing
   * surface, millimetres (ANSUR II; women 62.7, SD 5.1, men 72.9, SD 5.7).
   * Schema constraints: Minimum: 15; Maximum: 150; retained by Human's schema
   * refinement.
   */
  ankleHeight: number;

  /**
   * Foot length: the back of the heel to the tip of the longest toe,
   * millimetres (ISO 8559-1 5.5.5; ANSUR II women 246.3, SD 12.4, men 271.2, SD
   * 13.1). Schema constraints: Minimum: 50; Maximum: 400; retained by Human's
   * schema refinement.
   */
  footLength: number;

  /**
   * Foot breadth: the maximum breadth across the metatarsal heads, millimetres
   * (ISO 8559-1 5.5.6; ANSUR II women 92.7, SD 4.8, men 101.9, SD 5.2). Schema
   * constraints: Minimum: 20; Maximum: 180; retained by Human's schema
   * refinement.
   */
  footBreadth: number;

  /**
   * Navicular height: the navicular tuberosity, the bony prominence in front of
   * and below the medial malleolus, above the standing surface with full weight
   * on the foot, millimetres. Reported navicular heights are about 0.20 of foot
   * length in Dutch adults and 0.17 in Malawian adults (Stolwijk et al. 2013,
   * PLoS ONE 8(2):e57209), and lower in young children, 15.8 mm at 2 years and
   * 27.0 mm at 6 (Chang et al. 2012, Biomed Eng Online 11:76). Schema
   * constraints: Minimum: 5; Maximum: 100; retained by Human's schema
   * refinement.
   */
  navicularHeight: number;

  /**
   * Thigh circumference at the gluteal furrow, perpendicular to the thigh axis,
   * millimetres. Schema constraints: Minimum: 120; Maximum: 1300; retained by
   * Human's schema refinement.
   */
  thighCircumference: number;

  /**
   * Lower thigh circumference at suprapatella, the upper border of the patella,
   * perpendicular to the thigh axis, millimetres, as ANSUR II measures it.
   */
  lowerThighCircumference: NonNullable<
    IAutoMovieHumanBodyAnatomy["lowerThighCircumference"]
  >;

  /** Maximum horizontal calf circumference, millimetres. */
  calfCircumference: NonNullable<
    IAutoMovieHumanBodyAnatomy["calfCircumference"]
  >;

  /** Minimum horizontal ankle circumference above the malleoli, millimetres. */
  ankleCircumference: NonNullable<
    IAutoMovieHumanBodyAnatomy["ankleCircumference"]
  >;

  /**
   * Hip flexion, the thigh raised forward, degrees. Goniometric, as in the CDC
   * normal joint range of motion study (Soucie et al. 2011, Haemophilia 17(3)):
   * means of 127 to 141 degrees by age and sex. Schema constraints: Minimum: 0;
   * Maximum: 180; retained by Human's schema refinement.
   */
  hipFlexion: number;

  /**
   * Hip extension, the thigh carried backward, degrees; 13.5 to 28.3 in the
   * same study. Schema constraints: Minimum: 0; Maximum: 90; retained by
   * Human's schema refinement.
   */
  hipExtension: number;

  /**
   * Knee flexion from full extension, degrees, before the thigh and calf meet.
   * Schema constraints: Minimum: 0; Maximum: 180; retained by Human's schema
   * refinement.
   */
  kneeFlexion: number;

  /**
   * Knee extension beyond straight, degrees; negative when the knee does not
   * straighten fully. Schema constraints: Minimum: -30; Maximum: 30; retained
   * by Human's schema refinement.
   */
  kneeHyperextension: number;

  /**
   * Ankle dorsiflexion, the foot raised, degrees. Schema constraints: Minimum:
   * 0; Maximum: 60; retained by Human's schema refinement.
   */
  ankleDorsiflexion: number;

  /**
   * Ankle plantar flexion, the foot pointed, degrees. Schema constraints:
   * Minimum: 0; Maximum: 100; retained by Human's schema refinement.
   */
  anklePlantarFlexion: number;
}
