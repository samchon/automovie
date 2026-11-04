import { tags } from "typia";

import { IAutoMovieHumanArmIdentity } from "./IAutoMovieHumanArmIdentity";
import type { IAutoMovieHumanBodyAnatomy } from "./IAutoMovieHumanBodyAnatomy";
import { IAutoMovieHumanLegIdentity } from "./IAutoMovieHumanLegIdentity";
import { IAutoMovieHumanPair } from "../common/IAutoMovieHumanPair";
import { IAutoMovieHumanPosture } from "./IAutoMovieHumanPosture";

/**
 * Body heights, breadths and circumferences, with one record per limb.
 *
 * Heights are measured from the standing surface. Surface landmarks, mechanical joint centres and support-to-support chord lengths have distinct measurement protocols. Measurements taken at different respiratory states or tissue pressures remain independent observations.
 *
 * Every measure the public input also carries takes its declaration, definition and range from `IAutoMovieHumanBodyAnatomy`, so no measure has two ranges; this record requires each of them and adds the measures the anatomy record does not carry.
 */
export interface IAutoMovieHumanBodyIdentity
  extends Required<
    Pick<
      IAutoMovieHumanBodyAnatomy,
      | "stature"
      | "cervicaleHeight"
      | "suprasternaleHeight"
      | "acromialHeight"
      | "biacromialBreadth"
      | "bideltoidBreadth"
      | "bicristalBreadth"
      | "hipBreadth"
      | "neckCircumference"
      | "chestCircumference"
      | "chestBreadth"
      | "chestDepth"
      | "underbustCircumference"
      | "waistCircumference"
      | "waistHeight"
      | "waistBreadth"
      | "waistDepth"
      | "hipCircumference"
      | "buttockDepth"
    >
  > {
  /**
   * Sitting height: vertex to the sitting surface, sitting erect, millimetres. Sitting height and standing stature retain their respective postures.
   */
  sittingHeight: number & tags.Minimum<200> & tags.Maximum<1400>;

  /**
   * Span: the horizontal distance between the tips of the middle fingers with both arms outstretched sideways at shoulder level, millimetres, as ANSUR II measures it: standing with the back and both arms pressed flat against a wall, palms forward (Hotzman et al. 2011, NATICK/TR-11/017, 6.4.75).
   */
  span: number & tags.Minimum<300> & tags.Maximum<2800>;

  /**
   * Horizontal distance between the two hip joint centres in the common rest frame, millimetres. This mechanical breadth is distinct from the palpable iliac-crest breadth and soft-tissue hip breadth. A supplied value remains independent of leg lengths.
   */
  hipJointCentreBreadth?: number & tags.ExclusiveMinimum<0> & tags.Maximum<800>;

  /**
   * Thyroid angle: the internal angle between the two laminae of the thyroid cartilage at the level of the vocal folds, degrees. The narrower the angle, the further the laryngeal prominence, the Adam's apple, projects in front of the neck. On computed tomography of 283 people aged 8 to 20 the female mean stayed between 91 and 97 degrees at every age while the male mean fell from 92 to 67, most steeply at 14 to 15 years (Glikson et al. 2017, Laryngoscope 127(10):E354-E358); adult cadaver larynges measure 74.4 in men and 92.4 in women (Rawal et al. 2014, Natl J Integr Res Med 5(3)).
   */
  thyroidAngle: number & tags.Minimum<40> & tags.Maximum<140>;

  /** How the spine, pelvis and head stand in the side view. */
  posture: IAutoMovieHumanPosture;

  /** Independent arm measurements. */
  armPair: IAutoMovieHumanPair<IAutoMovieHumanArmIdentity>;

  /** Independent leg measurements. */
  legPair: IAutoMovieHumanPair<IAutoMovieHumanLegIdentity>;
}
