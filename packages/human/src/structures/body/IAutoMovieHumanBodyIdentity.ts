import { tags } from "typia";

import { IAutoMovieHumanArmIdentity } from "./IAutoMovieHumanArmIdentity";
import { IAutoMovieHumanLegIdentity } from "./IAutoMovieHumanLegIdentity";
import { IAutoMovieHumanPair } from "../common/IAutoMovieHumanPair";
import { IAutoMovieHumanPosture } from "./IAutoMovieHumanPosture";

/**
 * Body heights, breadths and circumferences, with one record per limb.
 *
 * Heights are measured from the standing surface. Segment proportions are parameters of their own rather than functions of stature: in ANSUR II, joint-centre heights regressed on stature leave residual standard deviations of 13 to 26 mm, so two people of equal stature differ that much in each segment.
 */
export interface IAutoMovieHumanBodyIdentity {
  /** Stature: vertex of the head to the standing surface, millimetres. */
  stature: number & tags.Minimum<400> & tags.Maximum<2500>;

  /**
   * Sitting height: vertex to the sitting surface, sitting erect, millimetres. Together with stature it fixes the trunk-to-leg proportion.
   */
  sittingHeight: number & tags.Minimum<200> & tags.Maximum<1400>;

  /**
   * Cervicale height: the most prominent spinous process of the seventh cervical vertebra to the standing surface, millimetres. It places the root of the neck.
   */
  cervicaleHeight: number & tags.Minimum<250> & tags.Maximum<2200>;

  /**
   * Suprasternale height: the jugular notch, the midline notch at the top of the sternum between the clavicles, to the standing surface, millimetres. It places the sternoclavicular joints where the clavicles start, so with acromial height it sets how the clavicles slope.
   */
  suprasternaleHeight: number & tags.Minimum<200> & tags.Maximum<2150>;

  /**
   * Acromial height: the right acromion, the point of the shoulder, to the standing surface, millimetres. It places the shoulder joints.
   */
  acromialHeight: number & tags.Minimum<200> & tags.Maximum<2150>;

  /**
   * Biacromial breadth: between the two acromia, a bony breadth, millimetres. Shoulder breadth carries most of the sex difference in the shoulder-to-hip ratio.
   */
  biacromialBreadth: number & tags.Minimum<80> & tags.Maximum<600>;

  /**
   * Bideltoid breadth: the maximum horizontal breadth across the deltoid muscles, arms hanging, seated, a soft-tissue breadth, millimetres, as ANSUR II measures it. It is the shoulder width the outline shows, and with the natural waist it carries the male V-taper: bideltoid over hip breadth is 1.28 in ANSUR II women and 1.48 in men.
   */
  bideltoidBreadth: number & tags.Minimum<90> & tags.Maximum<900>;

  /**
   * Span: the horizontal distance between the tips of the middle fingers with both arms outstretched sideways at shoulder level, millimetres, as ANSUR II measures it: standing with the back and both arms pressed flat against a wall, palms forward (Hotzman et al. 2011, NATICK/TR-11/017, 6.4.75).
   */
  span: number & tags.Minimum<300> & tags.Maximum<2800>;

  /**
   * Bicristal breadth: between the highest points of the two iliac crests with tissue firmly compressed, the bony pelvis, millimetres.
   */
  bicristalBreadth: number & tags.Minimum<50> & tags.Maximum<500>;

  /**
   * Horizontal distance between the two hip joint centres in the common rest frame, millimetres. This mechanical breadth is distinct from the palpable iliac-crest breadth and soft-tissue hip breadth. A supplied value remains independent of leg lengths.
   */
  hipJointCentreBreadth?: number & tags.ExclusiveMinimum<0> & tags.Maximum<800>;

  /**
   * Hip breadth: between the most lateral points of the buttocks standing, including soft tissue, millimetres.
   */
  hipBreadth: number & tags.Minimum<80> & tags.Maximum<800>;

  /**
   * Neck circumference: just below the thyroid cartilage, perpendicular to the neck axis, millimetres.
   */
  neckCircumference: number & tags.Minimum<100> & tags.Maximum<700>;

  /**
   * Thyroid angle: the internal angle between the two laminae of the thyroid cartilage at the level of the vocal folds, degrees. The narrower the angle, the further the laryngeal prominence, the Adam's apple, projects in front of the neck. On computed tomography of 283 people aged 8 to 20 the female mean stayed between 91 and 97 degrees at every age while the male mean fell from 92 to 67, most steeply at 14 to 15 years (Glikson et al. 2017, Laryngoscope 127(10):E354-E358); adult cadaver larynges measure 74.4 in men and 92.4 in women (Rawal et al. 2014, Natl J Integr Res Med 5(3)).
   */
  thyroidAngle: number & tags.Minimum<40> & tags.Maximum<140>;

  /**
   * Chest circumference at the most anterior point of the chest, the bust in women, at the maximum of quiet respiration, millimetres.
   */
  chestCircumference: number & tags.Minimum<180> & tags.Maximum<2000>;

  /**
   * Chest breadth at the level of the chest circumference, across the rib cage under the arms with tissue compressed, at maximum inspiration, millimetres, as ANSUR II measures it.
   */
  chestBreadth: number & tags.Minimum<40> & tags.Maximum<700>;

  /**
   * Chest depth at the level of the chest circumference, from the most anterior point of the chest, the bust in women, to the back, millimetres. With breadth and circumference it fixes how round or square the section is.
   */
  chestDepth: number & tags.Minimum<30> & tags.Maximum<700>;

  /**
   * Underbust circumference, horizontal just below the breasts at the inframammary fold, millimetres. Its difference from the chest circumference is the girth the breasts add; equal values mean no breast volume.
   */
  underbustCircumference: number & tags.Minimum<150> & tags.Maximum<2000>;

  /**
   * Waist circumference at the natural waist, millimetres: horizontal, at the level of the torso's greatest lateral indentation, or midway between the tenth rib and iliocristale where no single indentation is clear, at quiet respiration, as the 1988 US Army survey measures it (Gordon et al. 1989, NATICK/TR-89/044). This is the narrowest waist of attractiveness studies and the waist of the waist-to-hip ratio; ANSUR II measures its waist at the navel instead, about 70 mm lower and 20 to 70 mm larger on average, which is not comparable.
   */
  waistCircumference: number & tags.Minimum<180> & tags.Maximum<2200>;

  /**
   * Natural waist height: the level of the waist circumference above the standing surface, millimetres. In the 1988 Army survey it averaged 1056 mm in women and 1127 mm in men, at or just above the tenth rib (1044 and 1121 mm) rather than midway down to the iliac crest (989 and 1073 mm), and 74 and 68 mm above the navel. The waist breadth and depth are taken at this level.
   */
  waistHeight: number & tags.Minimum<150> & tags.Maximum<1600>;

  /** Waist breadth at the natural waist, millimetres. */
  waistBreadth: number & tags.Minimum<40> & tags.Maximum<800>;

  /** Waist depth at the natural waist, from the abdomen to the back, millimetres. */
  waistDepth: number & tags.Minimum<30> & tags.Maximum<800>;

  /**
   * Buttock circumference at the maximum posterior protrusion of the buttocks, standing, millimetres.
   */
  buttockCircumference: number & tags.Minimum<200> & tags.Maximum<2200>;

  /**
   * Buttock depth at the level of the buttock circumference, from the abdomen to the maximum posterior protrusion of the buttocks, standing, millimetres. With hip breadth and the circumference it fixes the section's shape.
   */
  buttockDepth: number & tags.Minimum<30> & tags.Maximum<800>;

  /** How the spine, pelvis and head stand in the side view. */
  posture: IAutoMovieHumanPosture;

  /** Independent arm measurements. */
  armPair: IAutoMovieHumanPair<IAutoMovieHumanArmIdentity>;

  /** Independent leg measurements. */
  legPair: IAutoMovieHumanPair<IAutoMovieHumanLegIdentity>;
}
