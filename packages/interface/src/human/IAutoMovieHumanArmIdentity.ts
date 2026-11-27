import type { IAutoMovieHumanBodyAnatomy } from "./IAutoMovieHumanBodyAnatomy";

/**
 * One arm, measured hanging at the side.
 *
 * A measure `IAutoMovieHumanBodyAnatomy` also declares (the right side there)
 * takes its range from that declaration, so no measure has two ranges.
 */
export interface IAutoMovieHumanArmIdentity {
  /**
   * Acromion-radiale length: the acromion to the upper palpable edge of the
   * radial head, millimetres. It is markedly shorter with the arm abducted,
   * because the acromion moves toward the radiale, so it is taken hanging.
   */
  upperArmLength: NonNullable<IAutoMovieHumanBodyAnatomy["upperArmLength"]>;

  /**
   * Radiale-stylion length: the radial head to the tip of the radial styloid
   * process, millimetres.
   */
  forearmLength: NonNullable<IAutoMovieHumanBodyAnatomy["forearmLength"]>;

  /**
   * Hand length: the wrist crease at stylion to the tip of the middle finger,
   * millimetres (ANSUR II hand length; women 181.1, SD 10.1, men 193.3, SD
   * 9.9). Schema constraints: Minimum: 40; Maximum: 300; retained by Human's
   * schema refinement.
   */
  handLength: number;

  /**
   * Hand breadth across the heads of the second to fifth metacarpals,
   * millimetres (ANSUR II hand breadth; women 78.2, SD 3.8, men 88.3, SD 4.4).
   * Schema constraints: Minimum: 20; Maximum: 160; retained by Human's schema
   * refinement.
   */
  handBreadth: number;

  /**
   * Palm length: stylion to the palmar crease at the base of the middle finger,
   * millimetres, as ANSUR II measures it (women 108.7, SD 5.9, men 116.5, SD
   * 6.2). This endpoint is the skin crease; its correspondence to a
   * metacarpophalangeal joint centre is not specified. Schema constraints:
   * Minimum: 20; Maximum: 200; retained by Human's schema refinement.
   */
  palmLength: number;

  /**
   * Thumb length: the crease at the base of the thumb, over its
   * metacarpophalangeal joint, to the tip, millimetres, as the 1977 US child
   * survey measures it. Schema constraints: Minimum: 10; Maximum: 150; retained
   * by Human's schema refinement.
   */
  thumbLength: number;

  /**
   * Relaxed upper arm circumference midway between acromion and olecranon, arm
   * hanging, millimetres.
   */
  upperArmCircumference: NonNullable<
    IAutoMovieHumanBodyAnatomy["upperArmCircumference"]
  >;

  /** Relaxed maximum forearm circumference, below the elbow, millimetres. */
  forearmCircumference: NonNullable<
    IAutoMovieHumanBodyAnatomy["forearmCircumference"]
  >;

  /** Wrist circumference over the radial styloid, millimetres. */
  wristCircumference: NonNullable<
    IAutoMovieHumanBodyAnatomy["wristCircumference"]
  >;

  /**
   * Carrying angle: the angle in the frontal plane between the long axes of the
   * arm and the forearm with the elbow fully extended and the forearm
   * supinated, degrees, positive for valgus, the forearm turned away from the
   * body. Slightly varus at birth (-1.5), 6 degrees at 2 to 6 years and 11 from
   * 15 on, in 921 Thai children measured with a goniometer, and larger in girls
   * (8.5 against 6.9 over all ages; Kaewpornsawan et al. 2018, Siriraj Med J
   * 70(4):284-288). Schema constraints: Minimum: -30; Maximum: 40; retained by
   * Human's schema refinement.
   */
  carryingAngle: number;

  /**
   * Shoulder flexion, the arm raised forward from hanging, degrees.
   * Goniometric, as in the CDC normal joint range of motion study (Soucie et
   * al. 2011, Haemophilia 17(3)): means of 164 to 179 degrees by age and sex.
   * Schema constraints: Minimum: 0; Maximum: 200; retained by Human's schema
   * refinement.
   */
  shoulderFlexion: number;

  /**
   * Elbow flexion from full extension, degrees; 143 to 153 in the same study.
   * Schema constraints: Minimum: 0; Maximum: 180; retained by Human's schema
   * refinement.
   */
  elbowFlexion: number;

  /**
   * Elbow extension beyond straight, degrees; negative when the elbow does not
   * straighten fully. Means run from -0.7 (men 45 to 69) to 6.8 (girls 2 to 8)
   * in the same study. Schema constraints: Minimum: -30; Maximum: 30; retained
   * by Human's schema refinement.
   */
  elbowHyperextension: number;

  /**
   * Forearm pronation from the thumb-up neutral, degrees. Schema constraints:
   * Minimum: 0; Maximum: 120; retained by Human's schema refinement.
   */
  forearmPronation: number;

  /**
   * Forearm supination from the thumb-up neutral, degrees. Schema constraints:
   * Minimum: 0; Maximum: 140; retained by Human's schema refinement.
   */
  forearmSupination: number;

  /**
   * Fat over the back of the hand, millimetres: the dorsal superficial,
   * intermediate and deep fatty laminae over the metacarpals, measured by
   * ultrasound. It thins with age, about 4.3 mm in the 20s and 2.4 mm over 60,
   * which is why old hands show their knuckles, tendons and veins (Hung et al.
   * 2022, Aesthet Surg J 42(10):1119-1126). Schema constraints: Minimum: 0;
   * Maximum: 30; retained by Human's schema refinement.
   */
  dorsalHandFat: number;
}
