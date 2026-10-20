import { tags } from "typia";

/**
 * One arm, measured hanging at the side.
 */
export interface IAutoMovieHumanArmIdentity {
  /**
   * Acromion-radiale length: the acromion to the upper palpable edge of the radial head, millimetres. It is markedly shorter with the arm abducted, because the acromion moves toward the radiale, so it is taken hanging.
   */
  upperArmLength: number & tags.Minimum<50> & tags.Maximum<600>;

  /**
   * Radiale-stylion length: the radial head to the tip of the radial styloid process, millimetres.
   */
  forearmLength: number & tags.Minimum<40> & tags.Maximum<500>;

  /**
   * Hand length: the wrist crease at stylion to the tip of the middle finger, millimetres.
   */
  handLength: number & tags.Minimum<40> & tags.Maximum<300>;

  /**
   * Hand breadth across the heads of the second to fifth metacarpals, millimetres.
   */
  handBreadth: number & tags.Minimum<20> & tags.Maximum<160>;

  /**
   * Palm length: stylion to the palmar crease at the base of the middle finger, millimetres, as ANSUR II measures it. Hand length less palm length is the middle finger from its crease, which grows faster than the palm through childhood (0.42 of hand length at 2 to 4 years against 0.44 at 16 to 18; Snyder et al. 1977, UM-HSRI-77-17), so it places the knuckles.
   */
  palmLength: number & tags.Minimum<20> & tags.Maximum<200>;

  /**
   * Thumb length: the crease at the base of the thumb, over its metacarpophalangeal joint, to the tip, millimetres, as the 1977 US child survey measures it.
   */
  thumbLength: number & tags.Minimum<10> & tags.Maximum<150>;

  /**
   * Relaxed upper arm circumference midway between acromion and olecranon, arm hanging, millimetres.
   */
  upperArmCircumference: number & tags.Minimum<80> & tags.Maximum<800>;

  /** Relaxed maximum forearm circumference, below the elbow, millimetres. */
  forearmCircumference: number & tags.Minimum<70> & tags.Maximum<600>;

  /** Wrist circumference over the radial styloid, millimetres. */
  wristCircumference: number & tags.Minimum<50> & tags.Maximum<300>;

  /**
   * Carrying angle: the angle in the frontal plane between the long axes of the arm and the forearm with the elbow fully extended and the forearm supinated, degrees, positive for valgus, the forearm turned away from the body. Slightly varus at birth (-1.5), 6 degrees at 2 to 6 years and 11 from 15 on, in 921 Thai children measured with a goniometer, and larger in girls (8.5 against 6.9 over all ages; Kaewpornsawan et al. 2018, Siriraj Med J 70(4):284-288).
   */
  carryingAngle: number & tags.Minimum<-30> & tags.Maximum<40>;

  /**
   * Shoulder flexion, the arm raised forward from hanging, degrees. Goniometric, as in the CDC normal joint range of motion study (Soucie et al. 2011, Haemophilia 17(3)): means of 164 to 179 degrees by age and sex.
   */
  shoulderFlexion: number & tags.Minimum<0> & tags.Maximum<200>;

  /** Elbow flexion from full extension, degrees; 143 to 153 in the same study. */
  elbowFlexion: number & tags.Minimum<0> & tags.Maximum<180>;

  /**
   * Elbow extension beyond straight, degrees; negative when the elbow does not straighten fully. Means run from -0.7 (men 45 to 69) to 6.8 (girls 2 to 8) in the same study.
   */
  elbowHyperextension: number & tags.Minimum<-30> & tags.Maximum<30>;

  /** Forearm pronation from the thumb-up neutral, degrees. */
  forearmPronation: number & tags.Minimum<0> & tags.Maximum<120>;

  /** Forearm supination from the thumb-up neutral, degrees. */
  forearmSupination: number & tags.Minimum<0> & tags.Maximum<140>;

  /**
   * Fat over the back of the hand, millimetres: the dorsal superficial, intermediate and deep fatty laminae over the metacarpals, measured by ultrasound. It thins with age, about 4.3 mm in the 20s and 2.4 mm over 60, which is why old hands show their knuckles, tendons and veins (Hung et al. 2022, Aesthet Surg J 42(10):1119-1126).
   */
  dorsalHandFat: number & tags.Minimum<0> & tags.Maximum<30>;
}
