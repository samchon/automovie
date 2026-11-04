import { tags } from "typia";

import { AutoMovieHumanSex } from "../../typings/AutoMovieHumanSex";

/**
 * The body's measures: stature, tapes, segment lengths, skeletal breadths,
 * landmark heights and composition, each a published measurement at a
 * published site.
 *
 * Every field is optional: an omitted field takes the default
 * `AutoMovieHumanBodyAnatomy.resolve` derives from the same person's sex,
 * stature and tapes by a regression fitted on public survey data, so every
 * person carries every measure. A paired site takes the right side, as
 * ISO 7250-1 and ANSUR II do. Lengths are millimetres.
 *
 * Population figures are the female and male mean (SD) of the named survey:
 * ANSUR 1988 (Gordon et al. 1989, NATICK/TR-89/044, 2,208 women and 1,774
 * men), ANSUR II (Gordon et al. 2014, NATICK/TR-15/007) and the body
 * dimensions data of Heinz et al. (2003, J Stat Educ 11(2), 260 women and
 * 247 men, skeletal breadths given there as the sum of both sides and here
 * per side). The static bounds are envelopes wider than every surveyed adult.
 */
export interface IAutoMovieHumanBodyAnatomy {
  /**
   * Sex whose survey statistics derive the omitted measures and whose table
   * the shape priors take, a choice rather than a blend. Omitted, it is female.
   */
  sex?: AutoMovieHumanSex;

  /** Stature: the vertex above the standing surface, standing erect (ISO 7250-1 6.1.2; ANSUR II). ANSUR II: 1628.5 (64.2) and 1756.2 (68.6). */
  stature?: number & tags.Minimum<400> & tags.Maximum<2500>;

  /** Bust (chest) girth: horizontal at the bust point, the most anterior point of the bust or chest (ISO 8559-1 5.3.4). ANSUR 1988: 907.1 (63.5) and 991.4 (69.1). */
  chestCircumference?: number & tags.Minimum<180> & tags.Maximum<2000>;

  /** Under bust girth: horizontal at the inframammary fold (ISO 8559-1 5.3.8; ANSUR 1988 chest circumference below the bust). ANSUR 1988: 769.7 (51.0) and 926.1 (65.5). */
  underbustCircumference?: number & tags.Minimum<150> & tags.Maximum<2000>;

  /** Natural waist girth: horizontal at the torso's least girth between the lowest rib and the iliac crest (ANSUR 1988 natural waist circumference). ANSUR 1988: 725.5 (63.0) and 839.9 (74.0). */
  waistCircumference?: number & tags.Minimum<180> & tags.Maximum<2200>;

  /** Top hip girth: horizontal midway between the waist and hip levels (ISO 8559-1 5.3.12). No survey takes it; omitted, it is the mean of the waist and hip girths. */
  highHipCircumference?: number & tags.Minimum<200> & tags.Maximum<2200>;

  /** Hip girth: horizontal at the buttocks' greatest posterior projection (ISO 8559-1 5.3.13; ANSUR 1988 buttock circumference). ANSUR 1988: 966.9 (60.2) and 983.7 (62.2). */
  hipCircumference?: number & tags.Minimum<200> & tags.Maximum<2200>;

  /** Neck base girth: over the back neck point, the side neck points and the front neck point (ISO 8559-1 5.3.3; ANSUR 1988). ANSUR 1988: 346.2 (16.3) and 408.4 (20.5). */
  neckBaseCircumference?: number & tags.Minimum<150> & tags.Maximum<800>;

  /** Neck girth: just below the thyroid cartilage, perpendicular to the neck's axis (ISO 8559-1 5.3.2; ANSUR II). ANSUR II: 329.8 (19.2) and 397.6 (25.8). */
  neckCircumference?: number & tags.Minimum<100> & tags.Maximum<700>;

  /** Bust point width: the straight breadth between the bust points (ISO 8559-1 5.2.3; ANSUR 1988 bustpoint-to-bustpoint breadth). ANSUR 1988: 184.8 (16.2) and 215.9 (18.9). */
  bustPointWidth?: number & tags.Minimum<50> & tags.Maximum<450>;

  /** Back neck point to waist: over the back's median skin from cervicale to the natural waist (ISO 8559-1 5.4.5; ANSUR 1988 natural waist back length). ANSUR 1988: 367.3 (25.0) and 412.0 (23.2). */
  backNeckToWaist?: number & tags.Minimum<100> & tags.Maximum<800>;

  /** Across back shoulder width: shoulder point to shoulder point over the back neck point (ISO 8559-1 5.4.3). No survey takes it; the references read 395.6 to 451.9. */
  acrossBackShoulderWidth?: number & tags.Minimum<150> & tags.Maximum<800>;

  /** Side neck point to bust point over the skin (ISO 8559-1 5.4.10; ANSUR 1988 neck to bust point length). ANSUR 1988: 268.0 (22.3) and 272.4 (18.1). */
  sideNeckToBustPoint?: number & tags.Minimum<80> & tags.Maximum<600>;

  /** Acromion-radiale length, arm hanging (ANSUR II). ANSUR II: 311.2 (17.2) and 335.2 (17.5). */
  upperArmLength?: number & tags.Minimum<50> & tags.Maximum<600>;

  /** Radiale-stylion length (ANSUR II). ANSUR II: 241.3 (15.2) and 267.9 (15.4). */
  forearmLength?: number & tags.Minimum<40> & tags.Maximum<500>;

  /** Relaxed upper arm girth midway between acromion and olecranon, arm hanging (NHANES mid-upper arm circumference). NHANES 2015-2018, 20 to 29 years: 315 and 341 (means). */
  upperArmCircumference?: number & tags.Minimum<80> & tags.Maximum<800>;

  /** Elbow girth over the olecranon, arm extended (ANSUR 1988 elbow circumference). ANSUR 1988: 238.3 (13.4) and 277.1 (15.3). */
  elbowCircumference?: number & tags.Minimum<80> & tags.Maximum<600>;

  /** Relaxed maximum forearm girth below the elbow (Heinz et al. 2003 forearm girth, extended, palm up). Heinz 2003: 237.6 (16.8) and 282.4 (17.8). */
  forearmCircumference?: number & tags.Minimum<70> & tags.Maximum<600>;

  /** Wrist girth over stylion (ANSUR II wrist circumference). ANSUR II: 154.8 (7.8) and 175.9 (9.0). */
  wristCircumference?: number & tags.Minimum<50> & tags.Maximum<300>;

  /** Hand circumference over metacarpals II to V, thumb excluded (ANSUR 1988 hand circumference at metacarpale). ANSUR 1988: 186.2 (8.5) and 213.8 (9.7). */
  handCircumference?: number & tags.Minimum<60> & tags.Maximum<400>;

  /** Inside leg length: crotch height less the outer ankle point's height (ISO 8559-1 5.7.6). ANSUR 1988 crotch height less lateral malleolus height: 710.8 and 770.1 (means). */
  inseam?: number & tags.Minimum<150> & tags.Maximum<1300>;

  /** Thigh girth: horizontal at the widest part of the thigh below the gluteal fold (ISO 8559-1 5.3.20; ANSUR 1988 proximal thigh circumference, just below the gluteal furrow). ANSUR 1988: 580.3 (45.1) and 596.5 (49.3). */
  thighCircumference?: number & tags.Minimum<120> & tags.Maximum<1300>;

  /** Knee girth: horizontal at mid-patella (ISO 8559-1 5.3.22; ANSUR 1988 knee circumference). ANSUR 1988: 365.2 (23.3) and 386.4 (22.1). */
  kneeCircumference?: number & tags.Minimum<80> & tags.Maximum<900>;

  /** Calf girth: horizontal at the widest part of the calf (ISO 8559-1 5.3.24; ANSUR II). ANSUR II: 373.3 (28.5) and 392.3 (29.7). */
  calfCircumference?: number & tags.Minimum<90> & tags.Maximum<800>;

  /**
   * Biacromial breadth: acromion to acromion, the lateral edges of the
   * acromial processes, a bony breadth by caliper (ISO 7250-1 6.2.7; ANSUR II
   * biacromial breadth). It fixes the shoulder tip, the point the ISO 8559-1
   * 5.4.3 across back shoulder width projects to the skin. ANSUR 1988:
   * 362.6 (17.4) and 397.0 (18.0).
   */
  biacromialBreadth?: number & tags.Minimum<200> & tags.Maximum<550>;

  /**
   * Acromial height: the right acromion above the standing surface (ISO
   * 7250-1 6.1.4 shoulder height; ANSUR II acromial height). ANSUR II:
   * 1335.1 (58.1) and 1440.7 (63.3).
   */
  acromialHeight?: number & tags.Minimum<600> & tags.Maximum<1900>;

  /**
   * Cervicale height: the tip of the seventh cervical vertebra's spinous
   * process above the standing surface (ANSUR II cervicale height). With stature and head height it fixes the neck's span. ANSUR II:
   * 1395.7 (59.5) and 1517.3 (63.3).
   */
  cervicaleHeight?: number & tags.Minimum<650> & tags.Maximum<2000>;

  /**
   * Side neck point height: the side neck point, where the neck base meets
   * the shoulder's top line, above the standing surface (ANSUR 1988 lateral
   * neck height; the ISO 8559-1 side neck point). It stands 62.9 (11.1) mm
   * above the acromion in women and 67.0 (11.7) in men. ANSUR 1988: 1396.5
   * (58.4) and 1509.5 (61.6).
   */
  sideNeckPointHeight?: number & tags.Minimum<650> & tags.Maximum<2000>;

  /**
   * Suprasternale height: the jugular notch, ISO 8559-1's front neck point,
   * above the standing surface (ANSUR 1988 and ANSUR II suprasternale height).
   * ANSUR 1988: 1330.3 (56.0) and 1438.4 (59.3).
   */
  suprasternaleHeight?: number & tags.Minimum<600> & tags.Maximum<1900>;

  /**
   * Axilla height: the lowest point of the armpit's skin above the standing
   * surface, arm hanging (ANSUR II axilla height). ANSUR II: 1239.0 (55.8)
   * and 1329.1 (59.5).
   */
  axillaHeight?: number & tags.Minimum<550> & tags.Maximum<1800>;

  /**
   * Chest breadth: across the rib cage under the arms at the chest
   * circumference's level, tissue compressed, by caliper (ANSUR II chest
   * breadth). ANSUR 1988: 279.6 (19.7) and 321.5 (25.5).
   */
  chestBreadth?: number & tags.Minimum<150> & tags.Maximum<500>;

  /**
   * Humerus biepicondylar breadth: between the medial and lateral epicondyles
   * of the humerus, elbow flexed 90 degrees, caliper with firm pressure (ISAK
   * humerus breadth; NHANES III elbow breadth). It is the bone the elbow's
   * girth wraps, so the epicondyles' relief is its half less the tube's
   * radius. Heinz 2003: 61.9 (4.2) and 72.3 (4.4).
   */
  elbowBreadth?: number & tags.Minimum<35> & tags.Maximum<110>;

  /**
   * Bistyloid breadth: between the radial and ulnar styloid processes, by
   * caliper with firm pressure (ISAK wrist breadth; NHANES III wrist
   * breadth). Heinz 2003: 49.4 (3.3) and 56.3 (3.2).
   */
  wristBreadth?: number & tags.Minimum<30> & tags.Maximum<90>;

  /**
   * Femur biepicondylar breadth: between the medial and lateral epicondyles of
   * the femur, knee flexed 90 degrees, caliper with firm pressure (ISAK femur
   * breadth). Heinz 2003: 90.5 (6.0) and 97.8 (5.4).
   */
  kneeBreadth?: number & tags.Minimum<55> & tags.Maximum<150>;

  /**
   * Bimalleolar breadth: between the most medial point of the medial
   * malleolus and the most lateral point of the lateral malleolus, standing
   * (ANSUR 1988 and ANSUR II bimalleolar breadth). ANSUR 1988: 64.4 (3.1) and
   * 72.8 (3.9).
   */
  bimalleolarBreadth?: number & tags.Minimum<40> & tags.Maximum<110>;

  /**
   * Ankle circumference: the minimum horizontal girth of the leg above the
   * malleoli (ANSUR II ankle circumference). ANSUR II: 215.7 (14.9) and
   * 229.3 (14.6).
   */
  ankleCircumference?: number & tags.Minimum<120> & tags.Maximum<400>;

  /**
   * Heel breadth: the maximum breadth of the heel behind the malleoli,
   * standing (ANSUR 1988 heel breadth). ANSUR 1988: 63.0 (4.8) and 70.1
   * (5.3).
   */
  heelBreadth?: number & tags.Minimum<35> & tags.Maximum<120>;

  /**
   * Ball-of-foot length: the back of the heel to the head of the first
   * metatarsal, along the foot's axis, standing (ANSUR II ball of foot
   * length). It places the metatarsal heads. ANSUR II: 182.1 (9.6) and 200.9
   * (10.5).
   */
  ballOfFootLength?: number & tags.Minimum<100> & tags.Maximum<300>;

  /**
   * Gluteal furrow height: the lowest point of the gluteal fold above the
   * standing surface (ANSUR 1988 gluteal furrow height). The ISO 8559-1
   * 5.3.20 thigh girth is sought just below this level. ANSUR 1988: 744.3
   * (43.0) and 814.4 (45.6).
   */
  glutealFurrowHeight?: number & tags.Minimum<350> & tags.Maximum<1200>;

  /**
   * Thumb breadth: the maximum breadth of the thumb at its interphalangeal
   * joint (ISO 7250-1 6.3.16; ANSUR 1988 thumb breadth). ANSUR 1988: 20.7
   * (1.3) and 24.1 (1.4).
   */
  thumbBreadth?: number & tags.Minimum<10> & tags.Maximum<40>;

  /**
   * Whole-body fat mass over body mass, percent, by dual-energy X-ray
   * absorptiometry (Kelly et al. 2009, PLoS ONE 4(9):e7038). Omitted, it is
   * the US Navy circumference estimate from the person's neck, waist, hip and
   * stature (Hodgdon and Beckett 1984, NHRC report 84-11 and 84-29).
   */
  bodyFatPercentage?: number & tags.Minimum<3> & tags.Maximum<70>;
}
