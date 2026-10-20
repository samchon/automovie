import { tags } from "typia";

/**
 * One leg, measured standing.
 *
 * The three lengths stack: their sum is the trochanterion height of that leg, the top of the greater trochanter above the standing surface, which lies within a few millimetres of the hip joint centre height.
 */
export interface IAutoMovieHumanLegIdentity {
  /**
   * Thigh length: trochanterion height minus tibiale height, the top of the greater trochanter to the upper edge of the medial tibial condyle, millimetres.
   */
  thighLength: number & tags.Minimum<60> & tags.Maximum<800>;

  /**
   * Shank length: tibiale height minus lateral malleolus height, millimetres.
   */
  shankLength: number & tags.Minimum<60> & tags.Maximum<700>;

  /**
   * Lateral malleolus height: the lowest point of the lateral malleolus to the standing surface, millimetres.
   */
  ankleHeight: number & tags.Minimum<15> & tags.Maximum<150>;

  /** Foot length: the back of the heel to the tip of the longest toe, millimetres. */
  footLength: number & tags.Minimum<50> & tags.Maximum<400>;

  /**
   * Foot breadth: the maximum breadth across the metatarsal heads, millimetres.
   */
  footBreadth: number & tags.Minimum<20> & tags.Maximum<180>;

  /**
   * Navicular height: the navicular tuberosity, the bony prominence in front of and below the medial malleolus, above the standing surface with full weight on the foot, millimetres. It sets the height of the medial longitudinal arch: about 0.20 of foot length in Dutch adults and 0.17 in Malawian adults (Stolwijk et al. 2013, PLoS ONE 8(2):e57209), and lower in young children, 15.8 mm at 2 years and 27.0 mm at 6 (Chang et al. 2012, Biomed Eng Online 11:76).
   */
  navicularHeight: number & tags.Minimum<5> & tags.Maximum<100>;

  /**
   * Thigh circumference at the gluteal furrow, perpendicular to the thigh axis, millimetres.
   */
  thighCircumference: number & tags.Minimum<120> & tags.Maximum<1300>;

  /**
   * Lower thigh circumference at suprapatella, the upper border of the patella, perpendicular to the thigh axis, millimetres, as ANSUR II measures it. With the thigh circumference it fixes how the thigh tapers to the knee.
   */
  lowerThighCircumference: number & tags.Minimum<80> & tags.Maximum<900>;

  /** Maximum horizontal calf circumference, millimetres. */
  calfCircumference: number & tags.Minimum<90> & tags.Maximum<800>;

  /** Minimum horizontal ankle circumference above the malleoli, millimetres. */
  ankleCircumference: number & tags.Minimum<60> & tags.Maximum<450>;

  /**
   * Hip flexion, the thigh raised forward, degrees. Goniometric, as in the CDC normal joint range of motion study (Soucie et al. 2011, Haemophilia 17(3)): means of 127 to 141 degrees by age and sex.
   */
  hipFlexion: number & tags.Minimum<0> & tags.Maximum<180>;

  /** Hip extension, the thigh carried backward, degrees; 13.5 to 28.3 in the same study. */
  hipExtension: number & tags.Minimum<0> & tags.Maximum<90>;

  /**
   * Knee flexion from full extension, degrees, before the thigh and calf meet.
   */
  kneeFlexion: number & tags.Minimum<0> & tags.Maximum<180>;

  /** Knee extension beyond straight, degrees; negative when the knee does not straighten fully. */
  kneeHyperextension: number & tags.Minimum<-30> & tags.Maximum<30>;

  /** Ankle dorsiflexion, the foot raised, degrees. */
  ankleDorsiflexion: number & tags.Minimum<0> & tags.Maximum<60>;

  /** Ankle plantar flexion, the foot pointed, degrees. */
  anklePlantarFlexion: number & tags.Minimum<0> & tags.Maximum<100>;
}
